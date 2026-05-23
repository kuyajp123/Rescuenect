import {
  NAIC_CLIENT_ID,
  NAIC_LOCATION_CLIENT,
  normalizeBarangayValue,
  type ClientType,
  type SaveBarangayLocationPayload,
} from '@/config/locationConfig';
import { db } from '@/db/firestoreConfig';
import type { ClientCoverageBarangay, ClientLgu, ClientLguStatus, LguRequest } from '@/types/admin';
import { isClientVisibleInResidentSignup } from '@/utils/accessControl';
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
};

const toSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const activeBarangays = (barangays: ClientCoverageBarangay[]) =>
  barangays.filter(barangay => barangay.isActive !== false);

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
    weatherLatitude: typeof data.weatherLatitude === 'number' ? data.weatherLatitude : null,
    weatherLongitude: typeof data.weatherLongitude === 'number' ? data.weatherLongitude : null,
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
      weatherLatitude: null,
      weatherLongitude: null,
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
    ].forEach(copyIfPresent);

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
}
