import { EvacuationModel } from '@/models/admin/EvacuationModel';
import { Request, Response } from 'express';

const MAX_NAME_LENGTH = 100;
const MAX_LOCATION_LENGTH = 200;
const MAX_CONTACT_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_IMAGES = 3;
const MAX_CAPACITY = 100_000;

const ALLOWED_CENTER_TYPES = new Set([
  'school',
  'barangay hall',
  'gymnasium',
  'church',
  'government building',
  'private facility',
  'vacant building',
  'covered court',
  'other',
]);

const ALLOWED_CENTER_STATUSES = new Set(['available', 'full', 'closed']);

type EvacuationCenterFieldErrors = Partial<{
  id: string;
  name: string;
  location: string;
  coordinates: string;
  capacity: string;
  type: string;
  status: string;
  contact: string;
  description: string;
  images: string;
  data: string;
}>;

const asTrimmedString = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value).trim();
  return '';
};

const normalizeKey = (value: unknown): string => asTrimmedString(value).toLowerCase();

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const validateCoordinates = (value: unknown): { lat: number; lng: number } | null => {
  if (!isPlainObject(value)) return null;
  const lat = (value as { lat?: unknown }).lat;
  const lng = (value as { lng?: unknown }).lng;

  const latNum = typeof lat === 'number' ? lat : Number(lat);
  const lngNum = typeof lng === 'number' ? lng : Number(lng);

  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;
  if (latNum < -90 || latNum > 90) return null;
  if (lngNum < -180 || lngNum > 180) return null;

  return { lat: latNum, lng: lngNum };
};

const validateMaxLength = (
  fieldErrors: EvacuationCenterFieldErrors,
  field: keyof EvacuationCenterFieldErrors,
  value: string,
  maxLength: number,
  label: string
) => {
  if (value.length > maxLength) {
    fieldErrors[field] = `${label} should not exceed ${maxLength} characters`;
  }
};

const validateEvacuationCenterPayload = (
  rawPayload: unknown,
  options?: {
    requireId?: boolean;
    files?: Express.Multer.File[] | undefined;
    keptImages?: unknown;
    requireAtLeastOneImage?: boolean;
  }
): {
  payload: Record<string, unknown>;
  id?: string;
  keptImages: string[];
  fieldErrors: EvacuationCenterFieldErrors;
} => {
  const fieldErrors: EvacuationCenterFieldErrors = {};
  const payload: Record<string, unknown> = {};

  if (!isPlainObject(rawPayload)) {
    fieldErrors.data = 'Invalid payload';
    return { payload, keptImages: [], fieldErrors };
  }

  const id = asTrimmedString((rawPayload as { id?: unknown }).id);
  if (options?.requireId && !id) {
    fieldErrors.id = 'Center ID is required';
  }

  const name = asTrimmedString((rawPayload as { name?: unknown }).name);
  if (!name) {
    fieldErrors.name = 'Name is required';
  } else {
    validateMaxLength(fieldErrors, 'name', name, MAX_NAME_LENGTH, 'Name');
  }

  const location = asTrimmedString((rawPayload as { location?: unknown }).location);
  if (!location) {
    fieldErrors.location = 'Location is required';
  } else {
    validateMaxLength(fieldErrors, 'location', location, MAX_LOCATION_LENGTH, 'Location');
  }

  const coordinates = validateCoordinates((rawPayload as { coordinates?: unknown }).coordinates);
  if (!coordinates) {
    fieldErrors.coordinates = 'Valid coordinates are required';
  }

  const capacityRaw = asTrimmedString((rawPayload as { capacity?: unknown }).capacity);
  const capacityNum = Number.parseInt(capacityRaw, 10);
  if (!capacityRaw) {
    fieldErrors.capacity = 'Capacity is required';
  } else if (!Number.isFinite(capacityNum) || capacityNum <= 0) {
    fieldErrors.capacity = 'Capacity must be a positive number';
  } else if (capacityNum > MAX_CAPACITY) {
    fieldErrors.capacity = `Capacity must not exceed ${MAX_CAPACITY}`;
  }

  const typeKey = normalizeKey((rawPayload as { type?: unknown }).type);
  if (!typeKey) {
    fieldErrors.type = 'Type is required';
  } else if (!ALLOWED_CENTER_TYPES.has(typeKey)) {
    fieldErrors.type = 'Invalid evacuation center type';
  }

  const statusKey = normalizeKey((rawPayload as { status?: unknown }).status);
  if (!statusKey) {
    fieldErrors.status = 'Status is required';
  } else if (!ALLOWED_CENTER_STATUSES.has(statusKey)) {
    fieldErrors.status = 'Invalid status';
  }

  const contact = asTrimmedString((rawPayload as { contact?: unknown }).contact);
  if (contact) {
    validateMaxLength(fieldErrors, 'contact', contact, MAX_CONTACT_LENGTH, 'Contact');
  }

  const description = asTrimmedString((rawPayload as { description?: unknown }).description);
  if (description) {
    validateMaxLength(fieldErrors, 'description', description, MAX_DESCRIPTION_LENGTH, 'Description');
  }

  const keptImagesRaw = options?.keptImages;
  const keptImages = Array.isArray(keptImagesRaw)
    ? keptImagesRaw.map(item => asTrimmedString(item)).filter(Boolean)
    : [];

  const fileCount = options?.files?.length ?? 0;
  if (fileCount > MAX_IMAGES) {
    fieldErrors.images = `You can only upload up to ${MAX_IMAGES} images`;
  }

  if (options?.requireAtLeastOneImage) {
    const totalImages = keptImages.length + fileCount;
    if (totalImages <= 0) {
      fieldErrors.images = 'At least one image is required';
    }
  }

  if (Object.keys(fieldErrors).length === 0) {
    payload.name = name;
    payload.location = location;
    payload.coordinates = coordinates as { lat: number; lng: number };
    payload.capacity = String(capacityNum);
    payload.type = typeKey;
    payload.status = statusKey;
    if (contact) payload.contact = contact;
    if (description) payload.description = description;
  }

  return { payload, id: id || undefined, keptImages, fieldErrors };
};

export class EvacuationController {
  static async addCenter(req: Request, res: Response): Promise<void> {
    try {
      const raw = req.body.data;
      if (typeof raw !== 'string' || raw.trim().length === 0) {
        res.status(400).json({
          message: 'Invalid payload',
          errors: ['Invalid payload'],
          fieldErrors: { data: 'Invalid payload' },
        });
        return;
      }

      let parsedData: unknown;
      try {
        parsedData = JSON.parse(raw);
      } catch {
        res.status(400).json({
          message: 'Invalid JSON payload',
          errors: ['Invalid JSON payload'],
          fieldErrors: { data: 'Invalid JSON payload' },
        });
        return;
      }

      const files = req.files as Express.Multer.File[] | undefined;
      const { payload, fieldErrors } = validateEvacuationCenterPayload(parsedData, {
        files,
        requireAtLeastOneImage: true,
      });

      if (Object.keys(fieldErrors).length > 0) {
        res.status(400).json({
          message: 'Validation failed',
          errors: Object.values(fieldErrors).filter(Boolean),
          fieldErrors,
        });
        return;
      }

      await EvacuationModel.addCenter(payload, files ?? []);
      res.status(200).json({ message: 'Evacuation center added successfully' });
    } catch (error) {
      console.error('❌ Failed to add evacuation center:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to add evacuation center',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async deleteCenter(req: Request, res: Response): Promise<void> {
    try {
      const id = asTrimmedString(req.body?.id);
      if (!id) {
        res.status(400).json({
          message: 'Center ID is required',
          errors: ['Center ID is required'],
          fieldErrors: { id: 'Center ID is required' },
        });
        return;
      }
      await EvacuationModel.deleteCenter(id);
      res.status(200).json({ message: 'Evacuation center deleted successfully' });
    } catch (error) {
      console.error('❌ Failed to delete evacuation center:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to delete evacuation center',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async updateCenter(req: Request, res: Response): Promise<void> {
    try {
      const raw = req.body.data;
      if (typeof raw !== 'string' || raw.trim().length === 0) {
        res.status(400).json({
          message: 'Invalid payload',
          errors: ['Invalid payload'],
          fieldErrors: { data: 'Invalid payload' },
        });
        return;
      }

      let parsedData: unknown;
      try {
        parsedData = JSON.parse(raw);
      } catch {
        res.status(400).json({
          message: 'Invalid JSON payload',
          errors: ['Invalid JSON payload'],
          fieldErrors: { data: 'Invalid JSON payload' },
        });
        return;
      }

      const files = req.files as Express.Multer.File[] | undefined;
      const keptImagesRaw = isPlainObject(parsedData) ? (parsedData as { keptImages?: unknown }).keptImages : undefined;
      const { payload, id, keptImages, fieldErrors } = validateEvacuationCenterPayload(parsedData, {
        requireId: true,
        files,
        keptImages: keptImagesRaw,
        requireAtLeastOneImage: true,
      });

      if (Object.keys(fieldErrors).length > 0) {
        res.status(400).json({
          message: 'Validation failed',
          errors: Object.values(fieldErrors).filter(Boolean),
          fieldErrors,
        });
        return;
      }

      await EvacuationModel.updateCenter(id as string, payload, files ?? [], keptImages);
      res.status(200).json({ message: 'Evacuation center updated successfully' });
    } catch (error) {
      console.error('❌ Failed to update evacuation center:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to update evacuation center',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }
}
