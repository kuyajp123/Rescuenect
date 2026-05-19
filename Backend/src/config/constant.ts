import { WeatherLocationKey } from '@/types/types';

const coastal_west = [
  'labac',
  'mabolo',
  'bancaan',
  'balsahan',
  'bagong karsada',
  'sapa',
  'bucana sasahan',
  'capt c. nazareno',
  'gomez-zamora',
  'kanluran',
  'humbac',
];
const coastal_east = [
  'bucana malaki',
  'ibayo estacion',
  'ibayo silangan',
  'latoria',
  'munting mapino',
  'timalan balsahan',
  'timalan concepcion',
];
const central_naic = ['muzon', 'malainem bago', 'santulan', 'calubcob', 'makina', 'san roque'];

const sabang = 'sabang';

const farm_area = ['molino', 'halang', 'palangue 1'];
const naic_boundary = ['malainem luma', 'palangue 2 & 3'];

const weatherGroups: WeatherLocationKey[] = [
  'coastal_west',
  'coastal_east',
  'central_naic',
  'sabang',
  'farm_area',
  'naic_boundary',
];

const weatherLocations: Record<WeatherLocationKey, string> = {
  coastal_west: '14.311667, 120.751944',
  coastal_east: '14.333333, 120.771389',
  central_naic: '14.302222, 120.771944',
  sabang: '14.320000, 120.805833',
  farm_area: '14.289444, 120.793889',
  naic_boundary: '14.260278, 120.820278',
};