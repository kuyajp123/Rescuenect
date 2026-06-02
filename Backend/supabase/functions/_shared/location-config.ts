export type ClientType = 'municipality' | 'city';

export type LegacyWeatherZoneKey =
  | 'coastal_west'
  | 'coastal_east'
  | 'central_naic'
  | 'sabang'
  | 'farm_area'
  | 'naic_boundary';

export interface BarangayMetadata {
  id: string;
  label: string;
  value: string;
  psgcCode: string | null;
  municipalityId: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  legacyWeatherZoneKey: LegacyWeatherZoneKey;
}

type BarangaySeed = Pick<BarangayMetadata, 'label' | 'value' | 'legacyWeatherZoneKey'>;

export const NAIC_CLIENT_ID = 'naic';
export const NAIC_WEATHER_LOCATION_KEY = 'naic';
export const ACTIVE_WEATHER_LOCATION_KEYS = [NAIC_WEATHER_LOCATION_KEY] as const;
export type WeatherLocationKey = (typeof ACTIVE_WEATHER_LOCATION_KEYS)[number];

export const CAVITE_PROVINCE = {
  id: 'cavite',
  name: 'Cavite',
  psgcCode: '0402100000',
  correspondenceCode: '0421',
} as const;

export const NAIC_MUNICIPALITY = {
  id: NAIC_CLIENT_ID,
  name: 'Naic',
  type: 'municipality' as ClientType,
  provinceId: CAVITE_PROVINCE.id,
  psgcCode: '0402115000',
  correspondenceCode: '042115000',
} as const;

export const LEGACY_NAIC_CLIENT_IDS = [`${NAIC_CLIENT_ID}-${NAIC_MUNICIPALITY.psgcCode}`] as const;

export const isNaicMunicipalityCode = (municipalityCode: unknown): boolean =>
  String(municipalityCode ?? '') === NAIC_MUNICIPALITY.psgcCode;

export const isLegacyNaicClientId = (clientId: unknown): clientId is (typeof LEGACY_NAIC_CLIENT_IDS)[number] =>
  typeof clientId === 'string' && (LEGACY_NAIC_CLIENT_IDS as readonly string[]).includes(clientId);

export const canonicalizeClientId = (clientId: unknown, municipalityCode?: unknown): string | null => {
  if (typeof clientId !== 'string' || !clientId.trim()) return null;
  const trimmedClientId = clientId.trim();
  return trimmedClientId === NAIC_CLIENT_ID || isLegacyNaicClientId(trimmedClientId) || isNaicMunicipalityCode(municipalityCode)
    ? NAIC_CLIENT_ID
    : trimmedClientId;
};

// Historical Tomorrow.io zone metadata retained for reference; active weather behavior uses weather location keys.
export const LEGACY_WEATHER_ZONE_LABELS: Record<LegacyWeatherZoneKey, string> = {
  coastal_west: 'Coastal West',
  coastal_east: 'Coastal East',
  central_naic: 'Central Naic',
  sabang: 'Sabang',
  farm_area: 'Farm Area',
  naic_boundary: 'Naic Boundary',
};

export const LEGACY_WEATHER_ZONE_COORDINATES: Record<LegacyWeatherZoneKey, string> = {
  coastal_west: '14.311667, 120.751944',
  coastal_east: '14.333333, 120.771389',
  central_naic: '14.302222, 120.771944',
  sabang: '14.320000, 120.805833',
  farm_area: '14.289444, 120.793889',
  naic_boundary: '14.260278, 120.820278',
};

export const LEGACY_WEATHER_ZONE_KEYS = Object.keys(
  LEGACY_WEATHER_ZONE_LABELS
) as LegacyWeatherZoneKey[];

export const WEATHER_LOCATION_LABELS: Record<WeatherLocationKey, string> = {
  [NAIC_WEATHER_LOCATION_KEY]: 'Naic',
};

export const WEATHER_LOCATION_COORDINATES: Record<WeatherLocationKey, string> = {
  [NAIC_WEATHER_LOCATION_KEY]: '14.2919325, 120.7752839',
};

const WEATHER_LOCATION_KEY_BY_CLIENT_ID: Record<string, WeatherLocationKey> = {
  [NAIC_CLIENT_ID]: NAIC_WEATHER_LOCATION_KEY,
};

const NAIC_BARANGAY_SEEDS: BarangaySeed[] = [
  { label: 'Labac', value: 'labac', legacyWeatherZoneKey: 'coastal_west' },
  { label: 'Mabolo', value: 'mabolo', legacyWeatherZoneKey: 'coastal_west' },
  { label: 'Bancaan', value: 'bancaan', legacyWeatherZoneKey: 'coastal_west' },
  { label: 'Balsahan', value: 'balsahan', legacyWeatherZoneKey: 'coastal_west' },
  { label: 'Bagong Karsada', value: 'bagong karsada', legacyWeatherZoneKey: 'coastal_west' },
  { label: 'Sapa', value: 'sapa', legacyWeatherZoneKey: 'coastal_west' },
  { label: 'Bucana Sasahan', value: 'bucana sasahan', legacyWeatherZoneKey: 'coastal_west' },
  { label: 'Capt C. Nazareno', value: 'capt c. nazareno', legacyWeatherZoneKey: 'coastal_west' },
  { label: 'Gomez-Zamora', value: 'gomez-zamora', legacyWeatherZoneKey: 'coastal_west' },
  { label: 'Kanluran', value: 'kanluran', legacyWeatherZoneKey: 'coastal_west' },
  { label: 'Humbac', value: 'humbac', legacyWeatherZoneKey: 'coastal_west' },
  { label: 'Bucana Malaki', value: 'bucana malaki', legacyWeatherZoneKey: 'coastal_east' },
  { label: 'Ibayo Estacion', value: 'ibayo estacion', legacyWeatherZoneKey: 'coastal_east' },
  { label: 'Ibayo Silangan', value: 'ibayo silangan', legacyWeatherZoneKey: 'coastal_east' },
  { label: 'Latoria', value: 'latoria', legacyWeatherZoneKey: 'coastal_east' },
  { label: 'Munting Mapino', value: 'munting mapino', legacyWeatherZoneKey: 'coastal_east' },
  { label: 'Timalan Balsahan', value: 'timalan balsahan', legacyWeatherZoneKey: 'coastal_east' },
  { label: 'Timalan Concepcion', value: 'timalan concepcion', legacyWeatherZoneKey: 'coastal_east' },
  { label: 'Muzon', value: 'muzon', legacyWeatherZoneKey: 'central_naic' },
  { label: 'Malainem Bago', value: 'malainem bago', legacyWeatherZoneKey: 'central_naic' },
  { label: 'Santulan', value: 'santulan', legacyWeatherZoneKey: 'central_naic' },
  { label: 'Calubcob', value: 'calubcob', legacyWeatherZoneKey: 'central_naic' },
  { label: 'Makina', value: 'makina', legacyWeatherZoneKey: 'central_naic' },
  { label: 'San Roque', value: 'san roque', legacyWeatherZoneKey: 'central_naic' },
  { label: 'Sabang', value: 'sabang', legacyWeatherZoneKey: 'sabang' },
  { label: 'Molino', value: 'molino', legacyWeatherZoneKey: 'farm_area' },
  { label: 'Halang', value: 'halang', legacyWeatherZoneKey: 'farm_area' },
  { label: 'Palangue 1', value: 'palangue 1', legacyWeatherZoneKey: 'farm_area' },
  { label: 'Malainem Luma', value: 'malainem luma', legacyWeatherZoneKey: 'naic_boundary' },
  { label: 'Palangue 2 & 3', value: 'palangue 2 & 3', legacyWeatherZoneKey: 'naic_boundary' },
];

export const NAIC_BARANGAYS: BarangayMetadata[] = NAIC_BARANGAY_SEEDS.map(barangay => ({
  id: barangay.value,
  psgcCode: null,
  municipalityId: NAIC_MUNICIPALITY.id,
  latitude: null,
  longitude: null,
  isActive: true,
  ...barangay,
}));

export const normalizeBarangayValue = (value: string): string => value.trim().toLowerCase();

export const getBarangayByValue = (value: string): BarangayMetadata | undefined => {
  const normalizedValue = normalizeBarangayValue(value);
  return NAIC_BARANGAYS.find(barangay => barangay.value === normalizedValue && barangay.isActive);
};

export const isCoveredBarangay = (value: string): boolean => !!getBarangayByValue(value);

export const getWeatherLocationKey = (value: string): WeatherLocationKey => {
  const barangay = getBarangayByValue(value);

  if (!barangay) {
    throw new Error(`Invalid location: ${value}`);
  }

  const weatherLocationKey = WEATHER_LOCATION_KEY_BY_CLIENT_ID[barangay.municipalityId];

  if (!weatherLocationKey) {
    throw new Error(`No active weather location configured for: ${value}`);
  }

  return weatherLocationKey;
};

export const getBarangaysForWeatherLocationKey = (weatherLocationKey: string): string[] => {
  const clientId = Object.entries(WEATHER_LOCATION_KEY_BY_CLIENT_ID).find(
    ([_clientId, activeWeatherLocationKey]) => activeWeatherLocationKey === weatherLocationKey
  )?.[0];

  if (!clientId) {
    return [];
  }

  return NAIC_BARANGAYS.filter(
    barangay => barangay.isActive && barangay.municipalityId === clientId
  ).map(barangay => barangay.value);
};

export const getBarangaysByLegacyWeatherZone = (zoneKey: LegacyWeatherZoneKey): string[] =>
  NAIC_BARANGAYS.filter(barangay => barangay.legacyWeatherZoneKey === zoneKey).map(barangay => barangay.value);

export const barangayLegacyWeatherZoneMap: Record<string, LegacyWeatherZoneKey> = Object.fromEntries(
  NAIC_BARANGAYS.map(barangay => [barangay.value, barangay.legacyWeatherZoneKey])
) as Record<string, LegacyWeatherZoneKey>;
