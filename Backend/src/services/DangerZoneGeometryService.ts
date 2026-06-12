import { DangerZoneCreateInput, DangerZoneGeometryType, DangerZoneSeverity } from '@/types/dangerZone';

const ALLOWED_SEVERITIES = new Set<DangerZoneSeverity>(['low', 'medium', 'high', 'critical']);
const ALLOWED_GEOMETRIES = new Set<DangerZoneGeometryType>(['point', 'circle']);
const MAX_TYPE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_RADIUS_METERS = 10_000;

export type DangerZoneFieldErrors = Partial<Record<'type' | 'severity' | 'description' | 'geometryType' | 'center' | 'radiusMeters', string>>;

export class DangerZonePayloadError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors: DangerZoneFieldErrors = {}
  ) {
    super(message);
    this.name = 'DangerZonePayloadError';
  }
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const asTrimmedString = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const parseJsonObject = (value: unknown): Record<string, unknown> | null => {
  if (isPlainObject(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const asFiniteNumber = (value: unknown): number | null => {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

export class DangerZoneGeometryService {
  static validatePointCirclePayload(rawPayload: unknown): DangerZoneCreateInput {
    if (!isPlainObject(rawPayload)) {
      throw new DangerZonePayloadError('Invalid danger-zone payload', { type: 'Invalid payload' });
    }

    const fieldErrors: DangerZoneFieldErrors = {};

    const type = asTrimmedString(rawPayload.type);
    if (!type) {
      fieldErrors.type = 'Danger type is required';
    } else if (type.length > MAX_TYPE_LENGTH) {
      fieldErrors.type = `Danger type must be ${MAX_TYPE_LENGTH} characters or fewer`;
    }

    const severity = asTrimmedString(rawPayload.severity).toLowerCase();
    if (!ALLOWED_SEVERITIES.has(severity as DangerZoneSeverity)) {
      fieldErrors.severity = 'Severity must be low, medium, high, or critical';
    }

    const description = asTrimmedString(rawPayload.description);
    if (!description) {
      fieldErrors.description = 'Description is required';
    } else if (description.length > MAX_DESCRIPTION_LENGTH) {
      fieldErrors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`;
    }

    const geometryType = asTrimmedString(rawPayload.geometryType).toLowerCase();
    if (!ALLOWED_GEOMETRIES.has(geometryType as DangerZoneGeometryType)) {
      fieldErrors.geometryType = 'Only point and circle danger zones are supported in this phase';
    }

    const centerPayload = parseJsonObject(rawPayload.center);
    const lat = centerPayload ? asFiniteNumber(centerPayload.lat) : asFiniteNumber(rawPayload.lat);
    const lng = centerPayload ? asFiniteNumber(centerPayload.lng) : asFiniteNumber(rawPayload.lng);

    if (lat === null || lng === null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      fieldErrors.center = 'A valid center latitude and longitude are required';
    }

    const radiusMeters = asFiniteNumber(rawPayload.radiusMeters);
    if (geometryType === 'circle') {
      if (radiusMeters === null || radiusMeters <= 0 || radiusMeters > MAX_RADIUS_METERS) {
        fieldErrors.radiusMeters = `Circle radius must be between 1 and ${MAX_RADIUS_METERS} meters`;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw new DangerZonePayloadError('Invalid danger-zone payload', fieldErrors);
    }

    const normalizedGeometry = geometryType as DangerZoneGeometryType;
    const input: DangerZoneCreateInput = {
      type,
      severity: severity as DangerZoneSeverity,
      description,
      geometryType: normalizedGeometry,
      center: {
        lat: lat as number,
        lng: lng as number,
      },
    };

    if (normalizedGeometry === 'circle') {
      input.radiusMeters = radiusMeters as number;
    }

    return input;
  }
}
