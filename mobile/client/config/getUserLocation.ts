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

// barangayMap['barangay name']
export const barangayMap = {
  'labac': 'coastal_west',
  'mabolo': 'coastal_west',
  'bancaan': 'coastal_west',
  'balsahan': 'coastal_west',
  'bagong karsada': 'coastal_west',
  'sapa': 'coastal_west',
  'bucana sasahan': 'coastal_west',
  'capt c. nazareno': 'coastal_west',
  'gomez-zamora': 'coastal_west',
  'kanluran': 'coastal_west',
  'humbac': 'coastal_west',
  'bucana malaki': 'coastal_east',
  'ibayo estacion': 'coastal_east',
  'ibayo silangan': 'coastal_east',
  'latoria': 'coastal_east',
  'munting mapino': 'coastal_east',
  'timalan balsahan': 'coastal_east',
  'timalan concepcion': 'coastal_east',
  'muzon': 'central_naic',
  'malainem bago': 'central_naic',
  'santulan': 'central_naic',
  'calubcob': 'central_naic',
  'makina': 'central_naic',
  'san roque': 'central_naic',
  'sabang': 'sabang',
  'molino': 'farm_area',
  'halang': 'farm_area',
  'palangue 1': 'farm_area',
  'malainem luma': 'naic_boundary',
  'palangue 2 & 3': 'naic_boundary',
};


export const getUsersBarangay = (location: string) => {
  if (coastal_west.includes(location)) {
    return 'coastal_west';
  } else if (coastal_east.includes(location)) {
    return 'coastal_east';
  } else if (central_naic.includes(location)) {
    return 'central_naic';
  } else if (location === sabang) {
    return 'sabang';
  } else if (farm_area.includes(location)) {
    return 'farm_area';
  } else if (naic_boundary.includes(location)) {
    return 'naic_boundary';
  } else {
    throw new Error(`Invalid location: ${location}`);
  }
};
