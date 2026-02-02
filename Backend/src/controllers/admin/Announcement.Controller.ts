import { AnnouncementModel } from '@/models/admin/AnnouncementModel';
import createDOMPurify, { type WindowLike } from 'dompurify';
import { JSDOM } from 'jsdom';
import { Request, Response } from 'express';

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
const ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'title'];
const MAX_CONTENT_LENGTH = 100_000;
const MAX_TEXT_LENGTH = 500;

const sanitizeText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed.length === 0) return '';
  const sanitized = DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return sanitized.slice(0, maxLength);
};

const sanitizeHtmlContent = (value: unknown) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed.length === 0) return '';

  const sanitized = DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'link', 'meta'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
  });

  return sanitized.slice(0, MAX_CONTENT_LENGTH);
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

export class AnnouncementController {
  static async addAnnouncement(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.uid as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    try {
      const rawCategory = sanitizeText(req.body.category, 50).toLowerCase();
      const category = ALLOWED_CATEGORIES.has(rawCategory) ? rawCategory : '';
      const content = sanitizeHtmlContent(req.body.content);
      const barangays = parseBarangays(req.body.barangays);

      const title = sanitizeText(req.body.title, MAX_TEXT_LENGTH);
      const subtitle = sanitizeText(req.body.subtitle, MAX_TEXT_LENGTH);
      const description = sanitizeText(req.body.description, MAX_TEXT_LENGTH);

      if (!category) {
        res.status(400).json({ message: 'Invalid or missing category' });
        return;
      }

      if (!content) {
        res.status(400).json({ message: 'Content is required' });
        return;
      }

      const payload: Record<string, unknown> = {
        content,
        category,
        barangays,
      };

      if (title) payload.title = title;
      if (subtitle) payload.subtitle = subtitle;
      if (description) payload.description = description;

      const file = req.file as Express.Multer.File | undefined;
      const announcementId = await AnnouncementModel.addAnnouncement(payload, file, userId);

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
}
