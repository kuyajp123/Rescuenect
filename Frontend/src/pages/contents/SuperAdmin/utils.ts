import { auth } from '@/lib/firebaseConfig';
import type { ClientCoverageBarangay } from './types';

export const getToken = async () => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not authenticated');
  return token;
};

export const statusColor = (status: string) => {
  if (status === 'active' || status === 'approved' || status === 'healthy') return 'success';
  if (status === 'pending' || status === 'draft') return 'warning';
  if (status === 'inactive' || status === 'rejected' || status === 'degraded') return 'danger';
  return 'default';
};

export const barangayKey = (barangay: ClientCoverageBarangay) =>
  barangay.barangayCode || barangay.value || barangay.barangayLabel;

export const formatDateTime = (value: unknown) => {
  if (!value) return 'Not recorded';

  const timestamp = value as { _seconds?: number; seconds?: number; toDate?: () => Date };
  const date =
    typeof value === 'number'
      ? new Date(value)
      : typeof timestamp.toDate === 'function'
      ? timestamp.toDate()
      : typeof timestamp._seconds === 'number'
        ? new Date(timestamp._seconds * 1000)
        : typeof timestamp.seconds === 'number'
          ? new Date(timestamp.seconds * 1000)
          : typeof value === 'string'
            ? new Date(value)
            : null;

  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Not recorded';
};

export const formatClientChangeRequestType = (type: string) => {
  const labels: Record<string, string> = {
    weather_coordinates: 'Center Coordinates',
    map_settings: 'Map Settings',
    barangay_coverage: 'Barangay Coverage',
    client_info: 'Client Info',
    admin_invite: 'Admin Invite',
    boundary_update: 'Boundary Update',
  };

  return labels[type] || type.replace(/_/g, ' ');
};

export type MapSettingsDraft = {
  centerLatitude: string;
  centerLongitude: string;
  minZoom: string;
  zoom: string;
  maxZoom: string;
  north: string;
  south: string;
  east: string;
  west: string;
};

export type WeatherCoordinateDraft = {
  key: string;
  lat: string;
  lng: string;
};

export type MapSettingsErrors = Partial<Record<keyof MapSettingsDraft, string>>;
export type WeatherCoordinateErrors = Partial<Record<keyof WeatherCoordinateDraft, string>>;

export const mapSettingPlaceholders: MapSettingsDraft & { boundarySource: string; boundaryGeoJson: string } = {
  centerLatitude: '14.2919325',
  centerLongitude: '120.7752839',
  minZoom: '13',
  zoom: '15',
  maxZoom: '18',
  north: '14.3452',
  south: '14.2741',
  east: '120.9205',
  west: '120.8501',
  boundarySource: 'PSA PSGC, NAMRIA, LGU GIS Office, or verified file name',
  boundaryGeoJson: 'Paste a FeatureCollection, Feature, Polygon, or MultiPolygon boundary GeoJSON',
};

export const weatherCoordinatePlaceholders: WeatherCoordinateDraft = {
  key: 'alcala',
  lat: '15.846794',
  lng: '120.521822',
};

const toRequiredNumber = (value: string): number | null => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isWholeNumber = (value: number) => Number.isInteger(value);

export const validateMapSettingsDraft = (draft: MapSettingsDraft): MapSettingsErrors => {
  const errors: MapSettingsErrors = {};
  const centerLatitude = toRequiredNumber(draft.centerLatitude);
  const centerLongitude = toRequiredNumber(draft.centerLongitude);
  const minZoom = toRequiredNumber(draft.minZoom);
  const zoom = toRequiredNumber(draft.zoom);
  const maxZoom = toRequiredNumber(draft.maxZoom);
  const north = toRequiredNumber(draft.north);
  const south = toRequiredNumber(draft.south);
  const east = toRequiredNumber(draft.east);
  const west = toRequiredNumber(draft.west);

  if (centerLatitude === null) errors.centerLatitude = 'Enter a valid latitude, for example 14.2919325.';
  else if (centerLatitude < -90 || centerLatitude > 90) errors.centerLatitude = 'Latitude must be between -90 and 90.';

  if (centerLongitude === null) errors.centerLongitude = 'Enter a valid longitude, for example 120.7752839.';
  else if (centerLongitude < -180 || centerLongitude > 180) {
    errors.centerLongitude = 'Longitude must be between -180 and 180.';
  }

  if (minZoom === null || !isWholeNumber(minZoom)) errors.minZoom = 'Use a whole number from 12 to 13.';
  else if (minZoom < 12 || minZoom > 13) errors.minZoom = 'Minimum zoom must be 12 or 13.';

  if (zoom === null || !isWholeNumber(zoom)) errors.zoom = 'Use a whole number from minimum zoom to 17.';
  else if (zoom < (minZoom ?? 12) || zoom > 17) errors.zoom = 'Default zoom must be between minimum zoom and 17.';

  if (maxZoom === null || !isWholeNumber(maxZoom)) errors.maxZoom = 'Use a whole number from default zoom to 18.';
  else if (maxZoom < (zoom ?? 15) || maxZoom > 18) {
    errors.maxZoom = 'Maximum zoom must be between default zoom and 18.';
  }

  if (north === null) errors.north = 'Enter the highest latitude, for example 14.3452.';
  else if (north < -90 || north > 90) errors.north = 'North bound must be between -90 and 90.';

  if (south === null) errors.south = 'Enter the lowest latitude, for example 14.2741.';
  else if (south < -90 || south > 90) errors.south = 'South bound must be between -90 and 90.';

  if (east === null) errors.east = 'Enter the highest longitude, for example 120.9205.';
  else if (east < -180 || east > 180) errors.east = 'East bound must be between -180 and 180.';

  if (west === null) errors.west = 'Enter the lowest longitude, for example 120.8501.';
  else if (west < -180 || west > 180) errors.west = 'West bound must be between -180 and 180.';

  if (north !== null && south !== null && north <= south) {
    errors.north = 'North bound must be greater than south bound.';
    errors.south = 'South bound must be less than north bound.';
  }

  if (east !== null && west !== null && east <= west) {
    errors.east = 'East bound must be greater than west bound.';
    errors.west = 'West bound must be less than east bound.';
  }

  if (centerLatitude !== null && north !== null && south !== null && centerLatitude > north) {
    errors.centerLatitude = 'Center latitude must be inside the north/south bounds.';
  }
  if (centerLatitude !== null && north !== null && south !== null && centerLatitude < south) {
    errors.centerLatitude = 'Center latitude must be inside the north/south bounds.';
  }
  if (centerLongitude !== null && east !== null && west !== null && centerLongitude > east) {
    errors.centerLongitude = 'Center longitude must be inside the east/west bounds.';
  }
  if (centerLongitude !== null && east !== null && west !== null && centerLongitude < west) {
    errors.centerLongitude = 'Center longitude must be inside the east/west bounds.';
  }

  return errors;
};

export const hasMapSettingsErrors = (errors: MapSettingsErrors): boolean => Object.keys(errors).length > 0;

export const validateWeatherCoordinateDraft = (draft: WeatherCoordinateDraft): WeatherCoordinateErrors => {
  const errors: WeatherCoordinateErrors = {};
  const key = draft.key.trim();
  const latitude = toRequiredNumber(draft.lat);
  const longitude = toRequiredNumber(draft.lng);

  if (!key) errors.key = 'Enter a weather location key, for example alcala.';
  if (latitude === null) errors.lat = 'Enter a valid latitude, for example 15.846794.';
  else if (latitude < -90 || latitude > 90) errors.lat = 'Latitude must be between -90 and 90.';
  if (longitude === null) errors.lng = 'Enter a valid longitude, for example 120.521822.';
  else if (longitude < -180 || longitude > 180) errors.lng = 'Longitude must be between -180 and 180.';

  return errors;
};

export const hasWeatherCoordinateErrors = (errors: WeatherCoordinateErrors): boolean => Object.keys(errors).length > 0;
