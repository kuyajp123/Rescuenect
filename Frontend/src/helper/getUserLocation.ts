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

export { central_naic, coastal_east, coastal_west, farm_area, naic_boundary, sabang };

export const getUsersBarangay = (location: string) => {
  const normalizedLocation = location.trim().toLowerCase();

  if (coastal_west.includes(normalizedLocation)) {
    return 'coastal_west';
  } else if (coastal_east.includes(normalizedLocation)) {
    return 'coastal_east';
  } else if (central_naic.includes(normalizedLocation)) {
    return 'central_naic';
  } else if (normalizedLocation === sabang) {
    return 'sabang';
  } else if (farm_area.includes(normalizedLocation)) {
    return 'farm_area';
  } else if (naic_boundary.includes(normalizedLocation)) {
    return 'naic_boundary';
  } else {
    return normalizedLocation;
  }
};
