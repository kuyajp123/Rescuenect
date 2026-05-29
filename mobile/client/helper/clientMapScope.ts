import type { ClientMapSettings } from '@/config/locationConfig';

export type MapBoundsArray = [[number, number], [number, number]];

type ScopedMapUserData = {
  weatherLatitude?: number | null;
  weatherLongitude?: number | null;
  mapSettings?: ClientMapSettings | null;
};

type ZoomOverrides = {
  zoomLevel?: number;
  minZoomLevel?: number;
  maxZoomLevel?: number;
};

export const DEFAULT_CLIENT_MAP_CENTER: [number, number] = [120.750674, 14.31808];

const DEFAULT_BOUNDS_DELTA = 0.08;

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const getClientMapCenter = (
  userData: ScopedMapUserData,
  fallbackCenter: [number, number] = DEFAULT_CLIENT_MAP_CENTER
): [number, number] => {
  const settings = userData.mapSettings;

  if (settings && isFiniteNumber(settings.centerLongitude) && isFiniteNumber(settings.centerLatitude)) {
    return [settings.centerLongitude, settings.centerLatitude];
  }

  if (isFiniteNumber(userData.weatherLongitude) && isFiniteNumber(userData.weatherLatitude)) {
    return [userData.weatherLongitude, userData.weatherLatitude];
  }

  return fallbackCenter;
};

export const getClientMapBounds = (
  userData: ScopedMapUserData,
  fallbackCenter?: [number, number]
): MapBoundsArray => {
  const bounds = userData.mapSettings?.maxBounds;

  if (
    bounds &&
    isFiniteNumber(bounds.north) &&
    isFiniteNumber(bounds.south) &&
    isFiniteNumber(bounds.east) &&
    isFiniteNumber(bounds.west) &&
    bounds.south < bounds.north &&
    bounds.west < bounds.east
  ) {
    return [
      [bounds.west, bounds.south],
      [bounds.east, bounds.north],
    ];
  }

  const [lng, lat] = fallbackCenter ?? getClientMapCenter(userData);

  return [
    [lng - DEFAULT_BOUNDS_DELTA, lat - DEFAULT_BOUNDS_DELTA],
    [lng + DEFAULT_BOUNDS_DELTA, lat + DEFAULT_BOUNDS_DELTA],
  ];
};

export const getClientMapZoomSettings = (userData: ScopedMapUserData, overrides: ZoomOverrides = {}) => {
  const settings = userData.mapSettings;
  const minZoomLevel = overrides.minZoomLevel ?? settings?.minZoom ?? 13;
  const maxZoomLevel = Math.max(overrides.maxZoomLevel ?? settings?.maxZoom ?? 18, minZoomLevel);
  const rawZoomLevel = overrides.zoomLevel ?? settings?.zoom ?? 15;

  return {
    minZoomLevel,
    maxZoomLevel,
    zoomLevel: clamp(rawZoomLevel, minZoomLevel, maxZoomLevel),
  };
};
