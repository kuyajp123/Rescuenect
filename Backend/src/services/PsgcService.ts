import axios from 'axios';

export type PsgcLevel = 'regions' | 'provinces' | 'municipalities' | 'barangays';
type PsgcProvider = 'official_psa' | 'rootscratch';

export interface PsgcOption {
  code: string;
  name: string;
  correspondenceCode?: string;
  geographicLevel?: string;
  type?: 'municipality' | 'city';
  raw?: Record<string, unknown>;
}

type CacheEntry = {
  expiresAt: number;
  data: PsgcOption[];
};

const cache = new Map<string, CacheEntry>();
const TTL_MS = Number(process.env.PSGC_CACHE_TTL_MS || 6 * 60 * 60 * 1000);

const getOfficialBaseUrl = () =>
  (process.env.PSGC_API_BASE_URL || 'https://classification.psa.gov.ph/psgc').replace(/\/$/, '');
const getRootscratchBaseUrl = () =>
  (process.env.PSGC_ROOTSCRATCH_BASE_URL || 'https://psgc.rootscratch.com').replace(/\/$/, '');
const getGitlabBaseUrl = () =>
  (process.env.PSGC_GITLAB_BASE_URL || 'https://psgc.gitlab.io/api').replace(/\/$/, '');
const getVersion = () => process.env.PSGC_API_VERSION || 'Q2_2024';
const getToken = () => process.env.PSGC_API_TOKEN || '';
const getProvider = (): PsgcProvider => (getToken() ? 'official_psa' : 'rootscratch');

const readArray = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
    if (Array.isArray(obj.results)) return obj.results as Record<string, unknown>[];
    if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[];
  }
  return [];
};

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : String(value ?? '').trim());

const toOption = (item: Record<string, unknown>): PsgcOption => {
  const code = asString(item.psgc_code || item.psgc_id || item.code || item.id);
  const geographicLevel = asString(item.geographic_level || item.level);
  const status = asString(item.status).toLowerCase();
  const cityClass = asString(item.city_class).toLowerCase();
  const type = geographicLevel.toLowerCase().includes('city') || status.includes('city') || cityClass
    ? 'city'
    : 'municipality';

  return {
    code,
    name: asString(item.area_name || item.name),
    correspondenceCode: asString(item.correspondence_code),
    geographicLevel,
    type,
    raw: item,
  };
};

const toGitlabOption = (item: Record<string, unknown>): PsgcOption => {
  const isCity = item.isCity === true || asString(item.name).toLowerCase().includes('city');

  return {
    code: asString(item.psgc10DigitCode || item.psgc_code || item.psgc_id || item.code || item.id),
    name: asString(item.name || item.area_name),
    correspondenceCode: asString(item.code || item.correspondence_code),
    geographicLevel: asString(item.geographic_level || item.level),
    type: isCity ? 'city' : 'municipality',
    raw: item,
  };
};

const codePrefix = (code: string, length: number) => code.replace(/\D/g, '').slice(0, length);
const normalizedCode = (code: string) => code.replace(/\D/g, '');

export class PsgcService {
  static getStatus() {
    const provider = getProvider();
    return {
      configured: true,
      cacheEntries: cache.size,
      provider,
      tokenConfigured: Boolean(getToken()),
      status: provider === 'official_psa' ? ('ok' as const) : ('fallback_rootscratch' as const),
    };
  }

  private static async fetchOfficialLevel(level: PsgcLevel): Promise<PsgcOption[]> {
    const cacheKey = `official:${getVersion()}:${level}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const token = getToken();
    if (!token) {
      throw new Error('PSGC_API_TOKEN is not configured');
    }

    const response = await axios.get(`${getOfficialBaseUrl()}/${getVersion()}/${level}`, {
      params: {
        token,
        page_size: 100000,
      },
      timeout: 20000,
    });

    const data = readArray(response.data)
      .map(toOption)
      .filter(item => item.code && item.name)
      .sort((left, right) => left.name.localeCompare(right.name));

    cache.set(cacheKey, { data, expiresAt: Date.now() + TTL_MS });
    return data;
  }

  private static async fetchRootscratchEndpoint(endpoint: string, parentId?: string): Promise<PsgcOption[]> {
    const cacheKey = `rootscratch:${endpoint}:${parentId || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const response = await axios.get(`${getRootscratchBaseUrl()}/${endpoint}`, {
      params: parentId ? { id: parentId } : undefined,
      timeout: 20000,
    });

    const data = readArray(response.data)
      .map(toOption)
      .filter(item => item.code && item.name)
      .sort((left, right) => left.name.localeCompare(right.name));

    cache.set(cacheKey, { data, expiresAt: Date.now() + TTL_MS });
    return data;
  }

  private static async fetchGitlabPath(path: string): Promise<PsgcOption[]> {
    const normalizedPath = path.replace(/^\/+/, '');
    const cacheKey = `gitlab:${normalizedPath}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const response = await axios.get(`${getGitlabBaseUrl()}/${normalizedPath}`, {
      timeout: 20000,
    });

    const data = readArray(response.data)
      .map(toGitlabOption)
      .filter(item => item.code && item.name)
      .sort((left, right) => left.name.localeCompare(right.name));

    cache.set(cacheKey, { data, expiresAt: Date.now() + TTL_MS });
    return data;
  }

  private static async safeFetchGitlabPath(path: string): Promise<PsgcOption[]> {
    try {
      return await this.fetchGitlabPath(path);
    } catch {
      return [];
    }
  }

  private static async getGitlabLookupCode(
    level: 'regions' | 'provinces' | 'municipalities',
    code: string
  ): Promise<string> {
    const normalized = normalizedCode(code);
    if (normalized.length === 9) return normalized;

    const rootScratchEndpointByLevel: Record<typeof level, string> = {
      regions: 'region',
      provinces: 'province',
      municipalities: 'municipal-city',
    };
    const gitlabPathByLevel: Record<typeof level, string> = {
      regions: 'regions/',
      provinces: 'provinces/',
      municipalities: 'cities-municipalities/',
    };

    const rootScratchMatch = (await this.fetchRootscratchEndpoint(rootScratchEndpointByLevel[level])).find(
      item => normalizedCode(item.code) === normalized || normalizedCode(item.correspondenceCode || '') === normalized
    );
    if (rootScratchMatch?.correspondenceCode) return rootScratchMatch.correspondenceCode;

    const gitlabMatch = (await this.safeFetchGitlabPath(gitlabPathByLevel[level])).find(
      item => normalizedCode(item.code) === normalized || normalizedCode(item.correspondenceCode || '') === normalized
    );
    if (gitlabMatch?.correspondenceCode) return gitlabMatch.correspondenceCode;

    return normalized.slice(0, 9);
  }

  private static async fetchLevel(level: PsgcLevel): Promise<PsgcOption[]> {
    if (getProvider() === 'official_psa') {
      return this.fetchOfficialLevel(level);
    }

    const endpointByLevel: Record<PsgcLevel, string> = {
      regions: 'region',
      provinces: 'province',
      municipalities: 'municipal-city',
      barangays: 'barangay',
    };

    return this.fetchRootscratchEndpoint(endpointByLevel[level]);
  }

  static async getRegions(): Promise<PsgcOption[]> {
    if (getProvider() === 'rootscratch') {
      return this.fetchRootscratchEndpoint('region');
    }
    return this.fetchOfficialLevel('regions');
  }

  static async getProvinces(regionCode: string): Promise<PsgcOption[]> {
    if (getProvider() === 'rootscratch') {
      const rootScratchProvinces = await this.fetchRootscratchEndpoint('province', regionCode);
      if (rootScratchProvinces.length > 0) return rootScratchProvinces;

      const regionLookupCode = await this.getGitlabLookupCode('regions', regionCode);
      return this.safeFetchGitlabPath(`regions/${regionLookupCode}/provinces/`);
    }

    const prefix = codePrefix(regionCode, 2);
    return (await this.fetchOfficialLevel('provinces')).filter(item => codePrefix(item.code, 2) === prefix);
  }

  static async getMunicipalities(provinceCode: string): Promise<PsgcOption[]> {
    if (getProvider() === 'rootscratch') {
      const rootScratchMunicipalities = await this.fetchRootscratchEndpoint('municipal-city', provinceCode);
      if (rootScratchMunicipalities.length > 0) return rootScratchMunicipalities;

      const provinceLookupCode = await this.getGitlabLookupCode('provinces', provinceCode);
      return this.safeFetchGitlabPath(`provinces/${provinceLookupCode}/cities-municipalities/`);
    }

    const prefix = codePrefix(provinceCode, 5);
    return (await this.fetchOfficialLevel('municipalities')).filter(item => codePrefix(item.code, 5) === prefix);
  }

  static async getMunicipalitiesForRegion(regionCode: string): Promise<PsgcOption[]> {
    if (getProvider() === 'rootscratch') {
      const regionMunicipalities = await this.fetchRootscratchEndpoint('municipal-city', regionCode);
      if (regionMunicipalities.length > 0) return regionMunicipalities;

      const [cities, municipalities] = await Promise.all([
        this.fetchRootscratchEndpoint('city', regionCode),
        this.fetchRootscratchEndpoint('municipal', regionCode),
      ]);

      const combinedMunicipalities = [...cities, ...municipalities].sort((left, right) =>
        left.name.localeCompare(right.name)
      );
      if (combinedMunicipalities.length > 0) return combinedMunicipalities;

      const regionLookupCode = await this.getGitlabLookupCode('regions', regionCode);
      return this.safeFetchGitlabPath(`regions/${regionLookupCode}/cities-municipalities/`);
    }

    const prefix = codePrefix(regionCode, 2);
    return (await this.fetchOfficialLevel('municipalities')).filter(item => codePrefix(item.code, 2) === prefix);
  }

  static async getBarangays(municipalityCode: string): Promise<PsgcOption[]> {
    if (getProvider() === 'rootscratch') {
      const rootScratchBarangays = await this.fetchRootscratchEndpoint('barangay', municipalityCode);
      if (rootScratchBarangays.length > 0) return rootScratchBarangays;

      const municipalityLookupCode = await this.getGitlabLookupCode('municipalities', municipalityCode);
      const cityBarangays = await this.safeFetchGitlabPath(`cities/${municipalityLookupCode}/barangays/`);
      if (cityBarangays.length > 0) return cityBarangays;

      return this.safeFetchGitlabPath(`municipalities/${municipalityLookupCode}/barangays/`);
    }

    const prefix = codePrefix(municipalityCode, 7);
    return (await this.fetchOfficialLevel('barangays')).filter(item => codePrefix(item.code, 7) === prefix);
  }
}
