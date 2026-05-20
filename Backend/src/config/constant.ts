import { WeatherLocationKey } from '@/types/types';
import {
  LEGACY_WEATHER_ZONE_COORDINATES,
  LEGACY_WEATHER_ZONE_KEYS,
  getBarangaysByLegacyWeatherZone,
} from '@/config/locationConfig';

const coastal_west = getBarangaysByLegacyWeatherZone('coastal_west');
const coastal_east = getBarangaysByLegacyWeatherZone('coastal_east');
const central_naic = getBarangaysByLegacyWeatherZone('central_naic');

const sabang = 'sabang';

const farm_area = getBarangaysByLegacyWeatherZone('farm_area');
const naic_boundary = getBarangaysByLegacyWeatherZone('naic_boundary');

const weatherGroups: WeatherLocationKey[] = [...LEGACY_WEATHER_ZONE_KEYS];

const weatherLocations: Record<WeatherLocationKey, string> = LEGACY_WEATHER_ZONE_COORDINATES;

export { central_naic, coastal_east, coastal_west, farm_area, naic_boundary, sabang, weatherGroups, weatherLocations };
