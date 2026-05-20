import {
  barangayLegacyWeatherZoneMap,
  getBarangaysByLegacyWeatherZone,
  getLegacyWeatherZoneKey,
  getWeatherLocationKey,
} from '@/config/locationConfig';

const coastal_west = getBarangaysByLegacyWeatherZone('coastal_west');
const coastal_east = getBarangaysByLegacyWeatherZone('coastal_east');
const central_naic = getBarangaysByLegacyWeatherZone('central_naic');
const sabang = 'sabang';
const farm_area = getBarangaysByLegacyWeatherZone('farm_area');
const naic_boundary = getBarangaysByLegacyWeatherZone('naic_boundary');

export { central_naic, coastal_east, coastal_west, farm_area, naic_boundary, sabang };

// barangayMap['barangay name']
export const barangayMap = barangayLegacyWeatherZoneMap;

export const getUsersBarangay = (location: string) => {
  return getWeatherLocationKey(location);
};

export { getLegacyWeatherZoneKey, getWeatherLocationKey };
