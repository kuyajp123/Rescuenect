import type { UserData } from '@/stores/useAuth';

const DEFAULT_CENTER: [number, number] = [14.2919325, 120.7752839];
const DEFAULT_BOUNDS: [[number, number], [number, number]] = [
  [DEFAULT_CENTER[0] - 0.08, DEFAULT_CENTER[1] - 0.08],
  [DEFAULT_CENTER[0] + 0.08, DEFAULT_CENTER[1] + 0.08],
];

export const getClientMapCenter = (userData: UserData | null): [number, number] => {
  if (
    typeof userData?.weatherLatitude === 'number' &&
    typeof userData.weatherLongitude === 'number' &&
    !Number.isNaN(userData.weatherLatitude) &&
    !Number.isNaN(userData.weatherLongitude)
  ) {
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
