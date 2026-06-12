import { AnnouncementModel } from '@/models/admin/AnnouncementModel';
import { ClientModel } from '@/models/admin/ClientModel';
import { normalizeBarangayValue } from '@/config/locationConfig';
import { getClientScopeFromRequest } from '@/utils/adminScope';
import { AnnouncementNotificationService, type AnnouncementNotificationScope } from '@/services/AnnouncementNotificationService';
import createDOMPurify, { type WindowLike } from 'dompurify';
import { Request, Response } from 'express';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window as unknown as WindowLike;
const DOMPurify = createDOMPurify(window);

const ALLOWED_CATEGORIES = new Set(['general', 'event', 'update', 'maintenance', 'alert', 'emergency', 'other']);
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'h1',
  'h2',
  'code',
  'pre',
  'img',
];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'title', 'style'];
const MAX_CONTENT_LENGTH = 100_000;
const MAX_TEXT_LENGTH = 50;

type AnnouncementFieldErrors = Partial<{
  title: string;
  subtitle: string;
  content: string;
  category: string;
}>;

type NormalizedBarangayResult = {
  barangays: string[];
  invalidBarangays: string[];
};

const sanitizeText = (value: unknown) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed.length === 0) return '';
  const sanitized = DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return sanitized;
};

DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
  if (data.attrName === 'style') {
    const match = data.attrValue?.match(/text-align\s*:\s*(left|right|center|justify)/i);
    if (match) {
      data.attrValue = `text-align: ${match[1].toLowerCase()}`;
    } else {
      data.keepAttr = false;
    }
  }
});

const sanitizeHtmlContent = (value: unknown) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed.length === 0) return '';

  const sanitized = DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'link', 'meta'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
  });

  return sanitized;
};

const parseBarangays = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item).trim()).filter(Boolean);
      }
    } catch {
      return value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const isMaxLength = (value: unknown, maxLength: number): boolean => {
  if (typeof value !== 'string') return false;
  if (value.trim().length > maxLength) return false;
  return true;
};

const normalizeBarangayLookupKey = (value: unknown): string =>
  normalizeBarangayValue(String(value ?? ''))
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeBarangaysForClient = async (
  clientId: string,
  barangays: string[]
): Promise<NormalizedBarangayResult> => {
  const client = await ClientModel.getClientById(clientId);
  if (!client) {
    return { barangays: [], invalidBarangays: barangays };
  }

  const allowedBarangays = new Map<string, string>();
  for (const barangay of client.barangays.filter(barangay => barangay.isActive !== false)) {
    const canonicalValue =
      typeof barangay.value === 'string' && barangay.value.trim()
        ? barangay.value.trim()
        : String(barangay.barangayLabel ?? '').trim();

    if (!canonicalValue) continue;

    [canonicalValue, barangay.value, barangay.barangayLabel, barangay.barangayCode].forEach(alias => {
      const key = normalizeBarangayLookupKey(alias);
      if (key) allowedBarangays.set(key, canonicalValue);
    });
  }

  const normalizedBarangays: string[] = [];
  const invalidBarangays: string[] = [];

  for (const barangay of barangays) {
    const canonicalValue = allowedBarangays.get(normalizeBarangayLookupKey(barangay));
    if (!canonicalValue) {
      invalidBarangays.push(barangay);
      continue;
    }

    if (!normalizedBarangays.includes(canonicalValue)) {
      normalizedBarangays.push(canonicalValue);
    }
  }

  return { barangays: normalizedBarangays, invalidBarangays };
};

export class AnnouncementController {
  static async getAnnouncementDetails(req: Request, res: Response): Promise<void> {
    const announcementId = req.params.id;
    if (!announcementId) {
      res.status(400).json({ message: 'Announcement ID is required' });
      return;
    }

    try {
      const announcement = await AnnouncementModel.getAnnouncementById(announcementId, getClientScopeFromRequest(req));
      if (!announcement) {
        res.status(404).json({ message: 'Announcement not found' });
        return;
      }

      res.status(200).json(announcement);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to get announcement details',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async getAnnouncements(req: Request, res: Response): Promise<void> {
    try {
      const announcements = await AnnouncementModel.getAnnouncements(getClientScopeFromRequest(req));
      res.status(200).json({ announcements });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to get announcements',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async addAnnouncement(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.uid as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    try {
      const rawCategory = sanitizeText(req.body.category).toLowerCase();
      const category = ALLOWED_CATEGORIES.has(rawCategory) ? rawCategory : '';
      const content = sanitizeHtmlContent(req.body.content);
      const requestedBarangays = parseBarangays(req.body.barangays);
      const clientId = getClientScopeFromRequest(req);
      if (!clientId) {
        res.status(400).json({ message: 'clientId is required for announcements' });
        return;
      }

      const title = sanitizeText(req.body.title);
      const subtitle = sanitizeText(req.body.subtitle);

      const fieldErrors: AnnouncementFieldErrors = {};

      if (!isMaxLength(title, MAX_TEXT_LENGTH)) {
        fieldErrors.title = `Title should not exceed ${MAX_TEXT_LENGTH} characters`;
      }

      if (!isMaxLength(subtitle, MAX_TEXT_LENGTH)) {
        fieldErrors.subtitle = `Subtitle should not exceed ${MAX_TEXT_LENGTH} characters`;
      }

      if (!isMaxLength(content, MAX_CONTENT_LENGTH)) {
        fieldErrors.content = `Content should not exceed ${MAX_CONTENT_LENGTH} characters`;
      }

      if (Object.keys(fieldErrors).length > 0) {
        const errors = [fieldErrors.title, fieldErrors.subtitle, fieldErrors.content].filter(Boolean);
        res.status(400).json({ message: 'Validation failed', errors, fieldErrors });
        return;
      }

      if (!category) {
        res.status(400).json({
          message: 'Invalid or missing category',
          errors: ['Invalid or missing category'],
          fieldErrors: { category: 'Invalid or missing category' },
        });
        return;
      }

      if (!content) {
        res.status(400).json({
          message: 'Content is required',
          errors: ['Content is required'],
          fieldErrors: { content: 'Content is required' },
        });
        return;
      }

      const { barangays, invalidBarangays } = await normalizeBarangaysForClient(clientId, requestedBarangays);
      if (invalidBarangays.length > 0) {
        res.status(400).json({
          message: 'Selected barangays are outside the client coverage',
          errors: ['Selected barangays are outside the client coverage'],
          fieldErrors: { barangays: 'Selected barangays are outside the client coverage' },
        });
        return;
      }

      const rawScope = typeof req.body.notificationScope === 'string' ? req.body.notificationScope.trim() : 'all';
      const notificationScope: AnnouncementNotificationScope = rawScope === 'barangays' ? 'barangays' : 'all';

      const payload: Record<string, unknown> = {
        content,
        category,
        barangays,
      };

      if (title) payload.title = title;
      if (subtitle) payload.subtitle = subtitle;

      const file = req.file as Express.Multer.File | undefined;
      const announcementId = await AnnouncementModel.addAnnouncement(payload, file, userId, clientId);

      // Fire-and-forget: send push + save in-app notification record
      // We do NOT await this so the HTTP response is not delayed.
      // Even if FCM tokens are missing, the in-app record is always saved.
      AnnouncementNotificationService.sendAnnouncementNotification({
        announcementId,
        title: title || 'New Announcement',
        subtitle: subtitle || undefined,
        // Pass the HTML content – the service strips tags to extract plain text
        contentText: content,
        category,
        clientId,
        barangays,
        notificationScope,
      }).catch(err =>
        console.error('❌ Failed to send announcement notification:', err instanceof Error ? err.message : err)
      );

      res.status(201).json({ message: 'Announcement created', id: announcementId });
    } catch (error) {
      console.error('❌ Failed to add announcement:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to create announcement',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async updateAnnouncement(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.uid as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const announcementId = req.params.id;
    if (!announcementId) {
      res.status(400).json({ message: 'Announcement ID is required' });
      return;
    }

    try {
      const rawCategory = sanitizeText(req.body.category).toLowerCase();
      const category = ALLOWED_CATEGORIES.has(rawCategory) ? rawCategory : '';
      const content = sanitizeHtmlContent(req.body.content);
      const requestedBarangays = parseBarangays(req.body.barangays);
      const clientId = getClientScopeFromRequest(req);
      if (!clientId) {
        res.status(400).json({ message: 'clientId is required for announcements' });
        return;
      }

      const title = sanitizeText(req.body.title);
      const subtitle = sanitizeText(req.body.subtitle);

      const fieldErrors: AnnouncementFieldErrors = {};

      if (!isMaxLength(title, MAX_TEXT_LENGTH)) {
        fieldErrors.title = `Title should not exceed ${MAX_TEXT_LENGTH} characters`;
      }

      if (!isMaxLength(subtitle, MAX_TEXT_LENGTH)) {
        fieldErrors.subtitle = `Subtitle should not exceed ${MAX_TEXT_LENGTH} characters`;
      }

      if (!isMaxLength(content, MAX_CONTENT_LENGTH)) {
        fieldErrors.content = `Content should not exceed ${MAX_CONTENT_LENGTH} characters`;
      }

      if (Object.keys(fieldErrors).length > 0) {
        const errors = [fieldErrors.title, fieldErrors.subtitle, fieldErrors.content].filter(Boolean);
        res.status(400).json({ message: 'Validation failed', errors, fieldErrors });
        return;
      }

      if (!category) {
        res.status(400).json({
          message: 'Invalid or missing category',
          errors: ['Invalid or missing category'],
          fieldErrors: { category: 'Invalid or missing category' },
        });
        return;
      }

      if (!content) {
        res.status(400).json({
          message: 'Content is required',
          errors: ['Content is required'],
          fieldErrors: { content: 'Content is required' },
        });
        return;
      }

      const { barangays, invalidBarangays } = await normalizeBarangaysForClient(clientId, requestedBarangays);
      if (invalidBarangays.length > 0) {
        res.status(400).json({
          message: 'Selected barangays are outside the client coverage',
          errors: ['Selected barangays are outside the client coverage'],
          fieldErrors: { barangays: 'Selected barangays are outside the client coverage' },
        });
        return;
      }

      const payload: Record<string, unknown> = {
        title,
        subtitle,
        content,
        category,
        barangays,
      };

      const file = req.file as Express.Multer.File | undefined;
      await AnnouncementModel.updateAnnouncement(announcementId, payload, file, userId, clientId);

      res.status(200).json({ message: 'Announcement updated', id: announcementId });
    } catch (error) {
      console.error('âŒ Failed to update announcement:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to update announcement',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async deleteAnnouncement(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.uid as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const announcementId = req.params.id;
    if (!announcementId) {
      res.status(400).json({ message: 'Announcement ID is required' });
      return;
    }

    try {
      await AnnouncementModel.deleteAnnouncement(announcementId, getClientScopeFromRequest(req));
      res.status(200).json({ message: 'Announcement deleted' });
    } catch (error) {
      console.error('❌ Failed to delete announcement:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to delete announcement',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }
}
