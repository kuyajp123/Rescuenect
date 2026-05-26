import {
  NAIC_CLIENT_ID,
  NAIC_LOCATION_CLIENT,
  normalizeBarangayValue,
  type ClientType,
  type SaveBarangayLocationPayload,
} from '@/config/locationConfig';
import { db } from '@/db/firestoreConfig';
import type {
  ClientBoundary,
  ClientCoverageBarangay,
  ClientEarthquakeSettings,
  ClientLgu,
  ClientLguStatus,
  ClientMapBounds,
  ClientMapSettings,
  LguRequest,
} from '@/types/admin';
import { hasUsableWeatherCoordinates, isClientVisibleInResidentSignup } from '@/utils/accessControl';
import { FieldValue } from 'firebase-admin/firestore';

export type DynamicResidentLocationSelection = {
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
  weatherLocationKey: string;
  weatherLatitude: number | null;
  weatherLongitude: number | null;
};

const toSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const activeBarangays = (barangays: ClientCoverageBarangay[]) =>
  barangays.filter(barangay => barangay.isActive !== false);

export const DEFAULT_EARTHQUAKE_SETTINGS: ClientEarthquakeSettings = {
  radiusKm: 150,
  minMagnitude: 1.5,
};

export const DEFAULT_MAP_SETTINGS: ClientMapSettings = {
  centerLatitude: NAIC_LOCATION_CLIENT.weatherLatitude,
  centerLongitude: NAIC_LOCATION_CLIENT.weatherLongitude,
  minZoom: 13,
  zoom: 15,
  maxZoom: 18,
  maxBounds: {
    north: NAIC_LOCATION_CLIENT.weatherLatitude + 0.08,
    south: NAIC_LOCATION_CLIENT.weatherLatitude - 0.08,
    east: NAIC_LOCATION_CLIENT.weatherLongitude + 0.08,
    west: NAIC_LOCATION_CLIENT.weatherLongitude - 0.08,
  },
  boundarySource: 'naic_default',
  boundaryVerified: false,
};

const toNumberOrNull = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const normalizeBounds = (value: unknown): ClientMapBounds | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const north = data.north;
  const south = data.south;
  const east = data.east;
  const west = data.west;

  if (![north, south, east, west].every(isFiniteNumber)) return null;
  if ((south as number) >= (north as number) || (west as number) >= (east as number)) return null;

  return { north: north as number, south: south as number, east: east as number, west: west as number };
};

export const normalizeMapSettings = (
  rawSettings: unknown,
  fallbackLatitude: number | null,
  fallbackLongitude: number | null
): ClientMapSettings => {
  const settings =
    rawSettings && typeof rawSettings === 'object' && !Array.isArray(rawSettings)
      ? (rawSettings as Record<string, unknown>)
      : {};
  const centerLatitude = toNumberOrNull(settings.centerLatitude) ?? fallbackLatitude;
  const centerLongitude = toNumberOrNull(settings.centerLongitude) ?? fallbackLongitude;
  const minZoom = clamp(isFiniteNumber(settings.minZoom) ? settings.minZoom : 13, 12, 13);
  const zoom = clamp(isFiniteNumber(settings.zoom) ? settings.zoom : 15, minZoom, 17);
  const maxZoom = clamp(isFiniteNumber(settings.maxZoom) ? settings.maxZoom : 18, zoom, 18);
  const fallbackBounds =
    centerLatitude !== null && centerLongitude !== null
      ? {
          north: centerLatitude + 0.08,
          south: centerLatitude - 0.08,
          east: centerLongitude + 0.08,
          west: centerLongitude - 0.08,
        }
      : null;

  return {
    centerLatitude,
    centerLongitude,
    minZoom,
    zoom,
    maxZoom,
    maxBounds: normalizeBounds(settings.maxBounds) ?? fallbackBounds,
    boundarySource: typeof settings.boundarySource === 'string' ? settings.boundarySource : null,
    boundaryVerified: settings.boundaryVerified === true,
    boundaryUpdatedAt: settings.boundaryUpdatedAt,
  };
};

const normalizeEarthquakeSettings = (rawSettings: unknown): ClientEarthquakeSettings => {
  const settings =
    rawSettings && typeof rawSettings === 'object' && !Array.isArray(rawSettings)
      ? (rawSettings as Record<string, unknown>)
      : {};

  return {
    radiusKm: clamp(isFiniteNumber(settings.radiusKm) ? settings.radiusKm : DEFAULT_EARTHQUAKE_SETTINGS.radiusKm, 25, 500),
    minMagnitude: clamp(
      isFiniteNumber(settings.minMagnitude) ? settings.minMagnitude : DEFAULT_EARTHQUAKE_SETTINGS.minMagnitude,
      0,
      9
    ),
  };
};

export const computeGeoJsonBounds = (geoJson: unknown): ClientMapBounds => {
  const coordinates: Array<[number, number]> = [];

  const walk = (value: unknown): void => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && isFiniteNumber(value[0]) && isFiniteNumber(value[1])) {
      coordinates.push([value[0], value[1]]);
      return;
    }
    value.forEach(walk);
  };

  if (!geoJson || typeof geoJson !== 'object') {
    throw new Error('Valid GeoJSON object is required');
  }

  walk((geoJson as Record<string, unknown>).coordinates);
  const features = (geoJson as Record<string, unknown>).features;
  if (Array.isArray(features)) {
    features.forEach(feature => {
      if (feature && typeof feature === 'object') {
        walk((feature as Record<string, unknown>).geometry && (feature as any).geometry.coordinates);
      }
    });
  }
  const geometry = (geoJson as Record<string, unknown>).geometry;
  if (geometry && typeof geometry === 'object') {
    walk((geometry as Record<string, unknown>).coordinates);
  }

  if (coordinates.length === 0) {
    throw new Error('GeoJSON must include polygon or multipolygon coordinates');
  }

  const lngValues = coordinates.map(([lng]) => lng);
  const latValues = coordinates.map(([, lat]) => lat);
  return {
    north: Math.max(...latValues),
    south: Math.min(...latValues),
    east: Math.max(...lngValues),
    west: Math.min(...lngValues),
  };
};

const toFallbackClient = (): ClientLgu => ({
  id: NAIC_LOCATION_CLIENT.id,
  name: NAIC_LOCATION_CLIENT.name,
  type: NAIC_LOCATION_CLIENT.type,
  status: 'active',
  regionCode: '0400000000',
  regionName: 'Region IV-A (CALABARZON)',
  provinceCode: NAIC_LOCATION_CLIENT.province.psgcCode,
  provinceName: NAIC_LOCATION_CLIENT.province.name,
  municipalityCode: NAIC_LOCATION_CLIENT.municipality.psgcCode,
  municipalityName: NAIC_LOCATION_CLIENT.municipality.name,
  municipalityType: NAIC_LOCATION_CLIENT.type,
  weatherLocationKey: NAIC_LOCATION_CLIENT.weatherLocationKey,
  weatherLatitude: NAIC_LOCATION_CLIENT.weatherLatitude,
  weatherLongitude: NAIC_LOCATION_CLIENT.weatherLongitude,
  mapSettings: DEFAULT_MAP_SETTINGS,
  earthquakeSettings: DEFAULT_EARTHQUAKE_SETTINGS,
  barangays: NAIC_LOCATION_CLIENT.barangays.map(barangay => ({
    barangayCode: barangay.psgcCode,
    barangayLabel: barangay.label,
    value: barangay.value,
    isActive: barangay.isActive,
    latitude: barangay.latitude,
    longitude: barangay.longitude,
    verified: true,
  })),
});

const normalizeClientDoc = (id: string, data: FirebaseFirestore.DocumentData): ClientLgu => {
  const type = data.type === 'city' ? 'city' : 'municipality';
  const rawBarangays = Array.isArray(data.barangays) ? data.barangays : [];
  const weatherLatitude = typeof data.weatherLatitude === 'number' ? data.weatherLatitude : null;
  const weatherLongitude = typeof data.weatherLongitude === 'number' ? data.weatherLongitude : null;

  return {
    id,
    name: data.name || data.municipalityName || id,
    type,
    status: data.status === 'active' || data.status === 'inactive' ? data.status : 'draft',
    regionCode: data.regionCode ?? null,
    regionName: data.regionName ?? null,
    provinceCode: data.provinceCode || '',
    provinceName: data.provinceName || '',
    municipalityCode: data.municipalityCode || '',
    municipalityName: data.municipalityName || data.name || id,
    municipalityType: type,
    weatherLocationKey: data.weatherLocationKey || toSlug(data.municipalityName || data.name || id),
    weatherLatitude,
    weatherLongitude,
    mapSettings: normalizeMapSettings(data.mapSettings, weatherLatitude, weatherLongitude),
    earthquakeSettings: normalizeEarthquakeSettings(data.earthquakeSettings),
    barangays: rawBarangays.map((barangay: any) => ({
      barangayCode: barangay.barangayCode ?? barangay.psgcCode ?? null,
      barangayLabel: barangay.barangayLabel ?? barangay.label ?? barangay.name ?? barangay.value ?? '',
      value: normalizeBarangayValue(barangay.value ?? barangay.barangayLabel ?? barangay.name ?? ''),
      isActive: barangay.isActive !== false,
      latitude: typeof barangay.latitude === 'number' ? barangay.latitude : null,
      longitude: typeof barangay.longitude === 'number' ? barangay.longitude : null,
      verified: barangay.verified !== false,
    })),
    requestId: data.requestId ?? null,
  };
};

export class ClientModel {
  private static collectionRef() {
    return db.collection('clients');
  }

  static getNaicClientSeed(): ClientLgu {
    return toFallbackClient();
  }

  static async listClients(): Promise<ClientLgu[]> {
    const snapshot = await this.collectionRef().get();
    const clients = snapshot.docs.map(doc => normalizeClientDoc(doc.id, doc.data()));
    const hasNaic = clients.some(client => client.id === NAIC_CLIENT_ID);

    return (hasNaic ? clients : [toFallbackClient(), ...clients]).sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  }

  static async getClientById(clientId: string): Promise<ClientLgu | null> {
    if (clientId === NAIC_CLIENT_ID) {
      const snap = await this.collectionRef().doc(clientId).get();
      return snap.exists ? normalizeClientDoc(snap.id, snap.data() ?? {}) : toFallbackClient();
    }

    const snap = await this.collectionRef().doc(clientId).get();
    return snap.exists ? normalizeClientDoc(snap.id, snap.data() ?? {}) : null;
  }

  static async getActiveClients(): Promise<ClientLgu[]> {
    return (await this.listClients()).filter(client => isClientVisibleInResidentSignup(client.status));
  }

  static async getActiveClientIds(): Promise<Set<string>> {
    return new Set((await this.getActiveClients()).map(client => client.id));
  }

  static async getActiveLocationCoverage(): Promise<Record<string, unknown>> {
    const provinces = new Map<string, any>();

    for (const client of await this.getActiveClients()) {
      const province = provinces.get(client.provinceCode) ?? {
        provinceCode: client.provinceCode,
        provinceName: client.provinceName,
        clients: [],
      };

      province.clients.push({
        clientId: client.id,
        clientName: client.name,
        provinceCode: client.provinceCode,
        provinceName: client.provinceName,
        municipalityCode: client.municipalityCode,
        municipalityName: client.municipalityName,
        municipalityType: client.municipalityType,
        barangays: activeBarangays(client.barangays).map(barangay => ({
          barangayCode: barangay.barangayCode,
          barangayLabel: barangay.barangayLabel,
          value: barangay.value,
        })),
        weatherLocationKey: client.weatherLocationKey,
        weatherLatitude: client.weatherLatitude,
        weatherLongitude: client.weatherLongitude,
        weatherCoordinates: {
          latitude: client.weatherLatitude,
          longitude: client.weatherLongitude,
        },
        isActive: client.status === 'active',
      });

      provinces.set(client.provinceCode, province);
    }

    return {
      provinces: Array.from(provinces.values()).map(province => ({
        ...province,
        clients: province.clients.sort((left: any, right: any) => left.clientName.localeCompare(right.clientName)),
      })),
    };
  }

  static async resolveResidentLocationSelection(
    payload: SaveBarangayLocationPayload
  ): Promise<DynamicResidentLocationSelection | null> {
    if (typeof payload.barangay !== 'string' || payload.barangay.trim().length === 0) {
      return null;
    }

    const normalizedBarangay = normalizeBarangayValue(payload.barangay);

    for (const client of await this.getActiveClients()) {
      const barangay = activeBarangays(client.barangays).find(item => item.value === normalizedBarangay);
      if (!barangay) continue;

      if (typeof payload.clientId === 'string' && payload.clientId.trim() && payload.clientId !== client.id) {
        return null;
      }
      if (
        typeof payload.provinceCode === 'string' &&
        payload.provinceCode.trim() &&
        payload.provinceCode !== client.provinceCode
      ) {
        return null;
      }
      if (
        typeof payload.municipalityCode === 'string' &&
        payload.municipalityCode.trim() &&
        payload.municipalityCode !== client.municipalityCode
      ) {
        return null;
      }
      if (
        typeof payload.weatherLocationKey === 'string' &&
        payload.weatherLocationKey.trim() &&
        payload.weatherLocationKey !== client.weatherLocationKey
      ) {
        return null;
      }
      if (
        typeof payload.barangayCode === 'string' &&
        payload.barangayCode.trim() &&
        barangay.barangayCode &&
        payload.barangayCode !== barangay.barangayCode
      ) {
        return null;
      }

      return {
        barangay: barangay.value,
        clientId: client.id,
        clientName: client.name,
        provinceCode: client.provinceCode,
        provinceName: client.provinceName,
        municipalityCode: client.municipalityCode,
        municipalityName: client.municipalityName,
        municipalityType: client.municipalityType,
        barangayCode: barangay.barangayCode,
        barangayLabel: barangay.barangayLabel,
        weatherLocationKey: client.weatherLocationKey,
        weatherLatitude: client.weatherLatitude,
        weatherLongitude: client.weatherLongitude,
      };
    }

    return null;
  }

  static async createDraftClientFromRequest(request: LguRequest): Promise<ClientLgu> {
    const baseClientId = toSlug(request.municipalityName);
    let clientId = baseClientId;
    if (clientId === NAIC_CLIENT_ID || request.municipalityCode === NAIC_LOCATION_CLIENT.municipality.psgcCode) {
      clientId = `${baseClientId}-${request.municipalityCode}`;
    }

    const existing = await this.collectionRef().doc(clientId).get();
    if (existing.exists) {
      clientId = `${baseClientId}-${request.municipalityCode}`;
    }

    const weatherLocationKey = clientId;
    const weatherLatitude =
      typeof request.proposedWeatherLatitude === 'number' && Number.isFinite(request.proposedWeatherLatitude)
        ? request.proposedWeatherLatitude
        : null;
    const weatherLongitude =
      typeof request.proposedWeatherLongitude === 'number' && Number.isFinite(request.proposedWeatherLongitude)
        ? request.proposedWeatherLongitude
        : null;
    const client: ClientLgu = {
      id: clientId,
      name: request.lguName || request.municipalityName,
      type: request.municipalityType,
      status: 'draft',
      regionCode: request.regionCode,
      regionName: request.regionName,
      provinceCode: request.provinceCode,
      provinceName: request.provinceName,
      municipalityCode: request.municipalityCode,
      municipalityName: request.municipalityName,
      municipalityType: request.municipalityType,
      weatherLocationKey,
      weatherLatitude,
      weatherLongitude,
      mapSettings: normalizeMapSettings(
        {
          centerLatitude: weatherLatitude,
          centerLongitude: weatherLongitude,
          minZoom: 13,
          zoom: 15,
          maxZoom: 18,
          maxBounds: null,
          boundarySource: null,
          boundaryVerified: false,
        },
        weatherLatitude,
        weatherLongitude
      ),
      earthquakeSettings: DEFAULT_EARTHQUAKE_SETTINGS,
      barangays: request.selectedBarangays.map(barangay => ({
        barangayCode: barangay.barangayCode,
        barangayLabel: barangay.barangayLabel,
        value: normalizeBarangayValue(barangay.value || barangay.barangayLabel),
        isActive: true,
        latitude: null,
        longitude: null,
        verified: true,
      })),
      requestId: request.id,
    };

    await this.collectionRef()
      .doc(clientId)
      .set({
        ...client,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return client;
  }

  static async updateClient(clientId: string, updates: Record<string, unknown>): Promise<ClientLgu> {
    const allowed: Record<string, unknown> = {};
    const copyIfPresent = (key: string) => {
      if (Object.prototype.hasOwnProperty.call(updates, key)) allowed[key] = updates[key];
    };

    [
      'name',
      'weatherLocationKey',
      'weatherLatitude',
      'weatherLongitude',
      'barangays',
      'regionCode',
      'regionName',
      'provinceCode',
      'provinceName',
      'municipalityCode',
      'municipalityName',
      'mapSettings',
      'earthquakeSettings',
    ].forEach(copyIfPresent);

    if (Object.prototype.hasOwnProperty.call(allowed, 'mapSettings')) {
      const existing = await this.getClientById(clientId);
      allowed.mapSettings = normalizeMapSettings(
        allowed.mapSettings,
        typeof allowed.weatherLatitude === 'number' ? allowed.weatherLatitude : existing?.weatherLatitude ?? null,
        typeof allowed.weatherLongitude === 'number' ? allowed.weatherLongitude : existing?.weatherLongitude ?? null
      );
    }

    if (Object.prototype.hasOwnProperty.call(allowed, 'earthquakeSettings')) {
      allowed.earthquakeSettings = normalizeEarthquakeSettings(allowed.earthquakeSettings);
    }

    if (
      Object.prototype.hasOwnProperty.call(allowed, 'weatherLatitude') ||
      Object.prototype.hasOwnProperty.call(allowed, 'weatherLongitude')
    ) {
      const latitude = allowed.weatherLatitude;
      const longitude = allowed.weatherLongitude;
      const hasLatitude = latitude !== null && latitude !== undefined;
      const hasLongitude = longitude !== null && longitude !== undefined;

      if (
        hasLatitude !== hasLongitude ||
        (hasLatitude && !hasUsableWeatherCoordinates(latitude as number, longitude as number))
      ) {
        throw new Error('Weather latitude and longitude must be valid coordinates');
      }
    }

    await this.collectionRef()
      .doc(clientId)
      .set(
        {
          ...allowed,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    const updated = await this.getClientById(clientId);
    if (!updated) throw new Error('Client not found');
    return updated;
  }

  static async setClientStatus(clientId: string, status: ClientLguStatus): Promise<ClientLgu> {
    if (!['draft', 'active', 'inactive'].includes(status)) {
      throw new Error('Invalid client status');
    }

    const client = await this.getClientById(clientId);
    if (!client) throw new Error('Client not found');

    if (status === 'active' && activeBarangays(client.barangays).length === 0) {
      throw new Error('Client must have at least one active barangay before activation');
    }

    if (status === 'active' && !hasUsableWeatherCoordinates(client.weatherLatitude, client.weatherLongitude)) {
      throw new Error('Client must have valid weather coordinates before activation');
    }

    await this.collectionRef().doc(clientId).set({ status, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    const updated = await this.getClientById(clientId);
    if (!updated) throw new Error('Client not found');
    return updated;
  }

  static async deleteClient(clientId: string): Promise<ClientLgu> {
    if (clientId === NAIC_CLIENT_ID) {
      throw new Error('Default Naic client cannot be deleted');
    }

    const client = await this.getClientById(clientId);
    if (!client) throw new Error('Client not found');
    if (client.status === 'active') {
      throw new Error('Deactivate the client before deleting it');
    }

    await this.collectionRef().doc(clientId).delete();
    return client;
  }

  static async saveBoundary(params: {
    clientId: string;
    geoJson: Record<string, unknown>;
    source?: string | null;
    uploadedBy: string;
  }): Promise<ClientBoundary> {
    const client = await this.getClientById(params.clientId);
    if (!client) throw new Error('Client not found');

    const bounds = computeGeoJsonBounds(params.geoJson);
    const source = typeof params.source === 'string' && params.source.trim() ? params.source.trim() : null;
    const boundary: Omit<ClientBoundary, 'uploadedAt'> = {
      clientId: client.id,
      source,
      geoJson: params.geoJson,
      bounds,
      uploadedBy: params.uploadedBy,
    };

    await db.collection('clientBoundaries').doc(client.id).set(
      {
        ...boundary,
        uploadedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const currentMapSettings = normalizeMapSettings(client.mapSettings, client.weatherLatitude, client.weatherLongitude);
    await this.collectionRef()
      .doc(client.id)
      .set(
        {
          mapSettings: {
            ...currentMapSettings,
            maxBounds: bounds,
            boundarySource: source,
            boundaryVerified: true,
            boundaryUpdatedAt: FieldValue.serverTimestamp(),
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return boundary;
  }

  static async getBoundary(clientId: string): Promise<ClientBoundary | null> {
    const snap = await db.collection('clientBoundaries').doc(clientId).get();
    if (!snap.exists) return null;
    const data = snap.data() ?? {};
    const bounds = normalizeBounds(data.bounds);
    if (!bounds) return null;

    return {
      clientId,
      source: typeof data.source === 'string' ? data.source : null,
      geoJson: data.geoJson && typeof data.geoJson === 'object' ? (data.geoJson as Record<string, unknown>) : null,
      bounds,
      uploadedBy: typeof data.uploadedBy === 'string' ? data.uploadedBy : 'unknown',
      uploadedAt: data.uploadedAt,
    };
  }
}
