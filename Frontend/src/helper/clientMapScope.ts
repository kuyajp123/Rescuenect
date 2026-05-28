import type { UserData } from '@/stores/useAuth';

const DEFAULT_CENTER: [number, number] = [14.2919325, 120.7752839];
const DEFAULT_BOUNDS: [[number, number], [number, number]] = [
  [DEFAULT_CENTER[0] - 0.08, DEFAULT_CENTER[1] - 0.08],
  [DEFAULT_CENTER[0] + 0.08, DEFAULT_CENTER[1] + 0.08],
];

const isUsableLatitude = (latitude: unknown): latitude is number =>
  typeof latitude === 'number' &&
  Number.isFinite(latitude) &&
  latitude >= -90 &&
  latitude <= 90;

const isUsableLongitude = (longitude: unknown): longitude is number =>
  typeof longitude === 'number' &&
  Number.isFinite(longitude) &&
  longitude >= -180 &&
  longitude <= 180;

export const getClientMapCenter = (userData: UserData | null): [number, number] => {
  if (
    isUsableLatitude(userData?.mapSettings?.centerLatitude) &&
    isUsableLongitude(userData?.mapSettings?.centerLongitude)
  ) {
    return [userData.mapSettings.centerLatitude, userData.mapSettings.centerLongitude];
  }

  if (isUsableLatitude(userData?.weatherLatitude) && isUsableLongitude(userData?.weatherLongitude)) {
    return [userData.weatherLatitude, userData.weatherLongitude];
  }

  return DEFAULT_CENTER;
};

export const getClientMapBounds = (center: [number, number], delta = 0.08): [[number, number], [number, number]] => [
  [center[0] - delta, center[1] - delta],
  [center[0] + delta, center[1] + delta],
];

export const getClientConfiguredMapBounds = (userData: UserData | null): [[number, number], [number, number]] => {
  const bounds = userData?.mapSettings?.maxBounds;
  if (!bounds) {
    const center = getClientMapCenter(userData);
    if (center[0] !== DEFAULT_CENTER[0] || center[1] !== DEFAULT_CENTER[1]) {
      return getClientMapBounds(center);
    }
    return DEFAULT_BOUNDS;
  }

  return [
    [bounds.south, bounds.west],
    [bounds.north, bounds.east],
  ];
};

export const getClientMapZoomSettings = (userData: UserData | null) => {
  const settings = userData?.mapSettings;
  return {
    minZoom: settings?.minZoom ?? 13,
    zoom: settings?.zoom ?? 15,
    maxZoom: settings?.maxZoom ?? 18,
  };
};

export const getClientEarthquakeMapZoomSettings = (userData: UserData | null) => {
  const settings = userData?.mapSettings;
  const maxZoom = Math.max(10);
  const minZoom = Math.min(settings?.minZoom ?? 13, 7);

  return {
    minZoom,
    zoom: Math.min(Math.max(8, minZoom), maxZoom),
    maxZoom,
  };
};
