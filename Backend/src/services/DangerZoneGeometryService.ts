import {
  DangerZoneCoordinates,
  DangerZoneCreateInput,
  DangerZoneGeometryType,
  DangerZoneLineString,
  DangerZonePolygon,
  DangerZoneSeverity,
} from '@/types/dangerZone';

const ALLOWED_SEVERITIES = new Set<DangerZoneSeverity>(['low', 'medium', 'high', 'critical']);
const RESIDENT_GEOMETRIES = new Set<DangerZoneGeometryType>(['point', 'circle']);
const ADMIN_GEOMETRIES = new Set<DangerZoneGeometryType>(['point', 'circle', 'line', 'polygon']);
const MAX_TYPE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_RADIUS_METERS = 10_000;
const DEFAULT_LINE_WIDTH_METERS = 30;
const MIN_LINE_WIDTH_METERS = 5;
const MAX_LINE_WIDTH_METERS = 100;

export type DangerZoneFieldErrors = Partial<
  Record<'type' | 'severity' | 'description' | 'geometryType' | 'center' | 'radiusMeters' | 'geojson' | 'affectedWidthMeters', string>
>;

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

const isValidLatLng = (lat: number | null, lng: number | null): lat is number =>
  lat !== null && lng !== null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

const parseCenter = (rawPayload: Record<string, unknown>): DangerZoneCoordinates | null => {
  const centerPayload = parseJsonObject(rawPayload.center);
  const lat = centerPayload ? asFiniteNumber(centerPayload.lat) : asFiniteNumber(rawPayload.lat);
  const lng = centerPayload ? asFiniteNumber(centerPayload.lng) : asFiniteNumber(rawPayload.lng);
  return isValidLatLng(lat, lng) ? { lat, lng: lng as number } : null;
};

const parsePosition = (value: unknown): [number, number] | null => {
  if (!Array.isArray(value) || value.length < 2) return null;
  const lng = asFiniteNumber(value[0]);
  const lat = asFiniteNumber(value[1]);
  return isValidLatLng(lat, lng) ? [lng as number, lat] : null;
};

const samePosition = (a: [number, number], b: [number, number]): boolean =>
  Math.abs(a[0] - b[0]) <= 1e-9 && Math.abs(a[1] - b[1]) <= 1e-9;

const parseLineString = (geojson: Record<string, unknown> | null): DangerZoneLineString | null => {
  if (!geojson || geojson.type !== 'LineString' || !Array.isArray(geojson.coordinates)) return null;
  const coordinates = geojson.coordinates.map(parsePosition);
  if (coordinates.length < 2 || coordinates.some(position => !position)) return null;
  return { type: 'LineString', coordinates: coordinates as [number, number][] };
};

const parsePolygon = (geojson: Record<string, unknown> | null): DangerZonePolygon | null => {
  if (!geojson || geojson.type !== 'Polygon' || !Array.isArray(geojson.coordinates)) return null;
  if (geojson.coordinates.length !== 1 || !Array.isArray(geojson.coordinates[0])) return null;

  const ring = (geojson.coordinates[0] as unknown[]).map(parsePosition);
  if (ring.length < 4 || ring.some(position => !position)) return null;

  const normalizedRing = ring as [number, number][];
  if (!samePosition(normalizedRing[0], normalizedRing[normalizedRing.length - 1])) return null;

  return { type: 'Polygon', coordinates: [normalizedRing] };
};

const parseLineWidth = (value: unknown): number => {
  const width = asFiniteNumber(value);
  return width === null ? DEFAULT_LINE_WIDTH_METERS : width;
};

export class DangerZoneGeometryService {
  static validatePointCirclePayload(rawPayload: unknown): DangerZoneCreateInput {
    return this.validatePayload(rawPayload, RESIDENT_GEOMETRIES, 'Only point and circle danger zones are supported for resident reports');
  }

  static validateAdminPayload(rawPayload: unknown): DangerZoneCreateInput {
    return this.validatePayload(rawPayload, ADMIN_GEOMETRIES, 'Only point, circle, line, and polygon danger zones are supported');
  }

  private static validatePayload(
    rawPayload: unknown,
    allowedGeometries: Set<DangerZoneGeometryType>,
    unsupportedGeometryMessage: string
  ): DangerZoneCreateInput {
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

    const geometryType = asTrimmedString(rawPayload.geometryType).toLowerCase() as DangerZoneGeometryType;
    if (!allowedGeometries.has(geometryType)) {
      fieldErrors.geometryType = unsupportedGeometryMessage;
    }

    const input: DangerZoneCreateInput = {
      type,
      severity: severity as DangerZoneSeverity,
      description,
      geometryType,
      center: null,
      radiusMeters: null,
      geojson: null,
      affectedWidthMeters: null,
      avoidGeojson: null,
    };

    if (geometryType === 'point' || geometryType === 'circle') {
      const center = parseCenter(rawPayload);
      if (!center) {
        fieldErrors.center = 'A valid center latitude and longitude are required';
      } else {
        input.center = center;
      }
    }

    if (geometryType === 'circle') {
      const radiusMeters = asFiniteNumber(rawPayload.radiusMeters);
      if (radiusMeters === null || radiusMeters <= 0 || radiusMeters > MAX_RADIUS_METERS) {
        fieldErrors.radiusMeters = `Circle radius must be between 1 and ${MAX_RADIUS_METERS} meters`;
      } else {
        input.radiusMeters = radiusMeters;
      }
    }

    if (geometryType === 'line') {
      const lineString = parseLineString(parseJsonObject(rawPayload.geojson));
      if (!lineString) {
        fieldErrors.geojson = 'Line danger zones require a valid GeoJSON LineString with at least two [lng, lat] coordinates';
      } else {
        input.geojson = lineString;
      }

      const affectedWidthMeters = parseLineWidth(rawPayload.affectedWidthMeters);
      if (affectedWidthMeters < MIN_LINE_WIDTH_METERS || affectedWidthMeters > MAX_LINE_WIDTH_METERS) {
        fieldErrors.affectedWidthMeters = `Line width must be between ${MIN_LINE_WIDTH_METERS} and ${MAX_LINE_WIDTH_METERS} meters`;
      } else {
        input.affectedWidthMeters = affectedWidthMeters;
      }
    }

    if (geometryType === 'polygon') {
      const polygon = parsePolygon(parseJsonObject(rawPayload.geojson));
      if (!polygon) {
        fieldErrors.geojson = 'Polygon danger zones require one closed outer ring with valid [lng, lat] coordinates';
      } else {
        input.geojson = polygon;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw new DangerZonePayloadError('Invalid danger-zone payload', fieldErrors);
    }

    return input;
  }
}
