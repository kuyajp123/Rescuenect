import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import {
  DangerZoneAnalytics,
  DangerZoneCreateOfficialPayload,
  DangerZoneListFilters,
  DangerZonePagination,
  DangerZoneRecord,
  DangerZoneStatus,
  RoutingOperations,
} from '@/types/dangerZone';
import axios from 'axios';
import { create } from 'zustand';

interface DangerZoneStore {
  reports: DangerZoneRecord[];
  zones: DangerZoneRecord[];
  reportPagination: DangerZonePagination | null;
  zonePagination: DangerZonePagination | null;
  analytics: DangerZoneAnalytics | null;
  routingOperations: RoutingOperations | null;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  fetchReports: (filters?: DangerZoneListFilters | DangerZoneStatus | 'all') => Promise<void>;
  fetchZones: (filters?: DangerZoneListFilters | DangerZoneStatus | 'all') => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  fetchRoutingOperations: () => Promise<void>;
  createOfficialZone: (payload: DangerZoneCreateOfficialPayload) => Promise<DangerZoneRecord>;
  verifyReport: (
    id: string,
    expiresAt?: string | null,
    metadata?: Pick<DangerZoneCreateOfficialPayload, 'confidence' | 'verificationNotes' | 'affectedBarangays'>
  ) => Promise<DangerZoneRecord>;
  rejectReport: (id: string, rejectionReason: string) => Promise<DangerZoneRecord>;
  updateZone: (id: string, payload: DangerZoneCreateOfficialPayload) => Promise<DangerZoneRecord>;
  resolveZone: (id: string) => Promise<DangerZoneRecord>;
}

const getAuthHeaders = async () => {
  const user = auth.currentUser;
  const token = await user?.getIdToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  return { Authorization: `Bearer ${token}` };
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? error.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

const buildParams = (filters?: DangerZoneListFilters | DangerZoneStatus | 'all') => {
  if (!filters) return undefined;
  const normalized = typeof filters === 'string' ? { status: filters } : filters;
  const params: Record<string, string | number> = {};
  Object.entries(normalized).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return;
    params[key] = value as string | number;
  });
  return Object.keys(params).length ? params : undefined;
};

export const useDangerZoneStore = create<DangerZoneStore>((set, get) => ({
  reports: [],
  zones: [],
  reportPagination: null,
  zonePagination: null,
  analytics: null,
  routingOperations: null,
  isLoading: false,
  isMutating: false,
  error: null,

  fetchReports: async filters => {
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get<{ reports: DangerZoneRecord[]; pagination?: DangerZonePagination }>(API_ENDPOINTS.DANGER_ZONES.GET_REPORTS, {
        headers,
        params: buildParams(filters),
      });
      const append = typeof filters === 'object' && Boolean(filters?.cursor);
      set({
        reports: append ? [...get().reports, ...response.data.reports] : response.data.reports,
        reportPagination: response.data.pagination ?? null,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false, error: getErrorMessage(error, 'Failed to fetch danger-zone reports') });
    }
  },

  fetchZones: async filters => {
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get<{ zones: DangerZoneRecord[]; pagination?: DangerZonePagination }>(API_ENDPOINTS.DANGER_ZONES.GET_ZONES, {
        headers,
        params: buildParams(filters),
      });
      const append = typeof filters === 'object' && Boolean(filters?.cursor);
      set({
        zones: append ? [...get().zones, ...response.data.zones] : response.data.zones,
        zonePagination: response.data.pagination ?? null,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false, error: getErrorMessage(error, 'Failed to fetch danger zones') });
    }
  },

  fetchAnalytics: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get<{ analytics: DangerZoneAnalytics }>(API_ENDPOINTS.DANGER_ZONES.ANALYTICS, { headers });
      set({ analytics: response.data.analytics });
    } catch (error) {
      set({ error: getErrorMessage(error, 'Failed to fetch danger-zone analytics') });
    }
  },

  fetchRoutingOperations: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get<{ operations: RoutingOperations }>(API_ENDPOINTS.DANGER_ZONES.ROUTING_OPERATIONS, { headers });
      set({ routingOperations: response.data.operations });
    } catch (error) {
      set({ error: getErrorMessage(error, 'Failed to fetch routing operations') });
    }
  },

  createOfficialZone: async payload => {
    set({ isMutating: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post<{ data: DangerZoneRecord }>(API_ENDPOINTS.DANGER_ZONES.CREATE_OFFICIAL, payload, {
        headers,
      });
      set({ isMutating: false });
      return response.data.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to create official danger zone');
      set({ isMutating: false, error: message });
      throw new Error(message);
    }
  },

  verifyReport: async (id, expiresAt, metadata) => {
    set({ isMutating: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await axios.patch<{ data: DangerZoneRecord }>(
        API_ENDPOINTS.DANGER_ZONES.VERIFY_REPORT,
        { id, expiresAt: expiresAt ?? null, ...(metadata ?? {}) },
        { headers }
      );
      set({ isMutating: false });
      return response.data.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to verify danger-zone report');
      set({ isMutating: false, error: message });
      throw new Error(message);
    }
  },

  rejectReport: async (id, rejectionReason) => {
    set({ isMutating: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await axios.patch<{ data: DangerZoneRecord }>(
        API_ENDPOINTS.DANGER_ZONES.REJECT_REPORT,
        { id, rejectionReason },
        { headers }
      );
      set({ isMutating: false });
      return response.data.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to reject danger-zone report');
      set({ isMutating: false, error: message });
      throw new Error(message);
    }
  },

  updateZone: async (id, payload) => {
    set({ isMutating: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await axios.patch<{ data: DangerZoneRecord }>(
        API_ENDPOINTS.DANGER_ZONES.UPDATE_ZONE,
        { id, ...payload },
        { headers }
      );
      set({ isMutating: false });
      return response.data.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to update danger zone');
      set({ isMutating: false, error: message });
      throw new Error(message);
    }
  },

  resolveZone: async id => {
    set({ isMutating: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await axios.patch<{ data: DangerZoneRecord }>(
        API_ENDPOINTS.DANGER_ZONES.RESOLVE_ZONE,
        { id },
        { headers }
      );
      set({ isMutating: false });
      return response.data.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to resolve danger zone');
      set({ isMutating: false, error: message });
      throw new Error(message);
    }
  },
}));
