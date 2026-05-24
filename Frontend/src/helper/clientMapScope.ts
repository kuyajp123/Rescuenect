import type { UserData } from '@/stores/useAuth';

const DEFAULT_CENTER: [number, number] = [14.2919325, 120.7752839];

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
