export type ClientType = 'municipality' | 'city';
export type ClientStatus = 'active' | 'inactive';

export type LegacyWeatherZoneKey =
  | 'coastal_west'
  | 'coastal_east'
  | 'central_naic'
  | 'sabang'
  | 'farm_area'
  | 'naic_boundary';

export interface ProvinceMetadata {
  id: string;
  name: string;
  psgcCode: string;
  correspondenceCode: string;
}

export interface MunicipalityMetadata {
  id: string;
  name: string;
  type: ClientType;
  provinceId: string;
  psgcCode: string;
  correspondenceCode: string;
}

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

export interface LocationClient {
  id: string;
  name: string;
  type: ClientType;
  status: ClientStatus;
  provinceCode: string;
  municipalityCode: string;
  cityCode: string | null;
  weatherLocationKey: WeatherLocationKey;
  weatherLatitude: number;
  weatherLongitude: number;
  province: ProvinceMetadata;
  municipality: MunicipalityMetadata;
  barangays: BarangayMetadata[];
}

export interface LocationCoverageBarangay {
  barangayCode: string | null;
  barangayLabel: string;
  value: string;
}

export interface LocationCoverageClient {
  clientId: string;
  clientName: string;
  provinceCode: string;
  provinceName: string;
  municipalityCode: string;
  municipalityName: string;
  municipalityType: ClientType;
  barangays: LocationCoverageBarangay[];
  weatherLocationKey: WeatherLocationKey;
  weatherCoordinates: {
    latitude: number;
    longitude: number;
  };
  isActive: boolean;
}

export interface LocationCoverageProvince {
  provinceCode: string;
  provinceName: string;
  clients: LocationCoverageClient[];
}

export interface LocationCoverageResponse {
  provinces: LocationCoverageProvince[];
}

export interface SaveBarangayLocationPayload {
  barangay?: unknown;
  clientId?: unknown;
  provinceCode?: unknown;
  municipalityCode?: unknown;
  barangayCode?: unknown;
  weatherLocationKey?: unknown;
}

export interface ResidentLocationSelection {
  barangay: string;
  clientId: string;
  clientName: string;
  provinceCode: string;
  provinceName: string;
  municipalityCode: string;
  municipalityName: string;
  municipalityType: ClientType;
  barangayCode: string | null;
  barangayLabel: string;
  weatherLocationKey: WeatherLocationKey;
}

type BarangaySeed = Pick<BarangayMetadata, 'label' | 'value' | 'legacyWeatherZoneKey'>;

export const NAIC_CLIENT_ID = 'naic';
export const NAIC_WEATHER_LOCATION_KEY = 'naic';
export const ACTIVE_WEATHER_LOCATION_KEYS = [NAIC_WEATHER_LOCATION_KEY] as const;
export type WeatherLocationKey = (typeof ACTIVE_WEATHER_LOCATION_KEYS)[number];

export const CAVITE_PROVINCE: ProvinceMetadata = {
  id: 'cavite',
  name: 'Cavite',
  psgcCode: '0402100000',
  correspondenceCode: '0421',
};

export const NAIC_MUNICIPALITY: MunicipalityMetadata = {
  id: NAIC_CLIENT_ID,
  name: 'Naic',
  type: 'municipality',
  provinceId: CAVITE_PROVINCE.id,
  psgcCode: '0402115000',
  correspondenceCode: '042115000',
};

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

export const NAIC_LOCATION_CLIENT: LocationClient = {
  id: NAIC_CLIENT_ID,
  name: 'Naic',
  type: 'municipality',
  status: 'active',
  provinceCode: CAVITE_PROVINCE.psgcCode,
  municipalityCode: NAIC_MUNICIPALITY.psgcCode,
  cityCode: null,
  weatherLocationKey: NAIC_WEATHER_LOCATION_KEY,
  weatherLatitude: 14.2919325,
  weatherLongitude: 120.7752839,
  province: CAVITE_PROVINCE,
  municipality: NAIC_MUNICIPALITY,
  barangays: NAIC_BARANGAYS,
};

export const ACTIVE_LOCATION_CLIENTS: LocationClient[] = [NAIC_LOCATION_CLIENT];

export const normalizeBarangayValue = (value: string): string => value.trim().toLowerCase();

export const getClientById = (clientId: string): LocationClient | undefined =>
  ACTIVE_LOCATION_CLIENTS.find(client => client.id === clientId && client.status === 'active');

export const getBarangaysForClient = (clientId: string): BarangayMetadata[] =>
  getClientById(clientId)?.barangays.filter(barangay => barangay.isActive) ?? [];

const toLocationCoverageClient = (client: LocationClient): LocationCoverageClient => ({
  clientId: client.id,
  clientName: client.name,
  provinceCode: client.province.psgcCode,
  provinceName: client.province.name,
  municipalityCode: client.municipality.psgcCode,
  municipalityName: client.municipality.name,
  municipalityType: client.type,
  barangays: client.barangays
    .filter(barangay => barangay.isActive)
    .map(barangay => ({
      barangayCode: barangay.psgcCode,
      barangayLabel: barangay.label,
      value: barangay.value,
    })),
  weatherLocationKey: client.weatherLocationKey,
  weatherCoordinates: {
    latitude: client.weatherLatitude,
    longitude: client.weatherLongitude,
  },
  isActive: client.status === 'active',
});

export const getActiveLocationCoverage = (): LocationCoverageResponse => {
  const provinces = new Map<string, LocationCoverageProvince>();

  ACTIVE_LOCATION_CLIENTS.filter(client => client.status === 'active').forEach(client => {
    const provinceCode = client.province.psgcCode;
    const province = provinces.get(provinceCode) ?? {
      provinceCode,
      provinceName: client.province.name,
      clients: [],
    };

    province.clients.push(toLocationCoverageClient(client));
    provinces.set(provinceCode, province);
  });

  return {
    provinces: Array.from(provinces.values()).map(province => ({
      ...province,
      clients: province.clients.sort((left, right) => left.clientName.localeCompare(right.clientName)),
    })),
  };
};

export const getClientForBarangayValue = (value: string): LocationClient | undefined => {
  const normalizedValue = normalizeBarangayValue(value);

  return ACTIVE_LOCATION_CLIENTS.find(
    client =>
      client.status === 'active' &&
      client.barangays.some(barangay => barangay.value === normalizedValue && barangay.isActive)
  );
};

export const getBarangayByValue = (value: string): BarangayMetadata | undefined => {
  const normalizedValue = normalizeBarangayValue(value);
  return ACTIVE_LOCATION_CLIENTS.flatMap(client => client.barangays).find(
    barangay => barangay.value === normalizedValue && barangay.isActive
  );
};

export const isCoveredBarangay = (value: string): boolean => !!getBarangayByValue(value);

const isProvidedString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export const resolveResidentLocationSelection = (
  payload: SaveBarangayLocationPayload
): ResidentLocationSelection | null => {
  if (!isProvidedString(payload.barangay)) {
    return null;
  }

  const normalizedBarangay = normalizeBarangayValue(payload.barangay);
  const matchedBarangay = getBarangayByValue(normalizedBarangay);
  const matchedClient = matchedBarangay ? getClientForBarangayValue(matchedBarangay.value) : undefined;

  if (!matchedBarangay || !matchedClient) {
    return null;
  }

  if (isProvidedString(payload.clientId) && payload.clientId !== matchedClient.id) {
    return null;
  }

  if (isProvidedString(payload.provinceCode) && payload.provinceCode !== matchedClient.province.psgcCode) {
    return null;
  }

  if (isProvidedString(payload.municipalityCode) && payload.municipalityCode !== matchedClient.municipality.psgcCode) {
    return null;
  }

  if (isProvidedString(payload.weatherLocationKey) && payload.weatherLocationKey !== matchedClient.weatherLocationKey) {
    return null;
  }

  if (
    isProvidedString(payload.barangayCode) &&
    matchedBarangay.psgcCode &&
    payload.barangayCode !== matchedBarangay.psgcCode
  ) {
    return null;
  }

  return {
    barangay: matchedBarangay.value,
    clientId: matchedClient.id,
    clientName: matchedClient.name,
    provinceCode: matchedClient.province.psgcCode,
    provinceName: matchedClient.province.name,
    municipalityCode: matchedClient.municipality.psgcCode,
    municipalityName: matchedClient.municipality.name,
    municipalityType: matchedClient.type,
    barangayCode: matchedBarangay.psgcCode,
    barangayLabel: matchedBarangay.label,
    weatherLocationKey: matchedClient.weatherLocationKey,
  };
};

export const getWeatherLocationKey = (value: string): WeatherLocationKey => {
  const barangay = getBarangayByValue(value);

  if (!barangay) {
    throw new Error(`Invalid location: ${value}`);
  }

  const client = getClientById(barangay.municipalityId);

  if (!client || !ACTIVE_WEATHER_LOCATION_KEYS.includes(client.weatherLocationKey as WeatherLocationKey)) {
    throw new Error(`No active weather location configured for: ${value}`);
  }

  return client.weatherLocationKey as WeatherLocationKey;
};

export const getBarangaysForWeatherLocationKey = (weatherLocationKey: string): string[] => {
  const client = ACTIVE_LOCATION_CLIENTS.find(
    activeClient => activeClient.weatherLocationKey === weatherLocationKey && activeClient.status === 'active'
  );

  return client?.barangays.filter(barangay => barangay.isActive).map(barangay => barangay.value) ?? [];
};

export const getBarangaysByLegacyWeatherZone = (zoneKey: LegacyWeatherZoneKey): string[] =>
  NAIC_BARANGAYS.filter(barangay => barangay.legacyWeatherZoneKey === zoneKey).map(barangay => barangay.value);

export const barangayLegacyWeatherZoneMap: Record<string, LegacyWeatherZoneKey> = Object.fromEntries(
  NAIC_BARANGAYS.map(barangay => [barangay.value, barangay.legacyWeatherZoneKey])
) as Record<string, LegacyWeatherZoneKey>;

export const getLegacyWeatherZoneKey = (value: string): LegacyWeatherZoneKey => {
  const barangay = getBarangayByValue(value);

  if (!barangay) {
    throw new Error(`Invalid location: ${value}`);
  }

  return barangay.legacyWeatherZoneKey;
};
