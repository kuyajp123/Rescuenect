import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { DangerZoneCreateOfficialPayload, DangerZoneRecord, DangerZoneStatus } from '@/types/dangerZone';
import axios from 'axios';
import { create } from 'zustand';

interface DangerZoneStore {
  reports: DangerZoneRecord[];
  zones: DangerZoneRecord[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  fetchReports: (status?: DangerZoneStatus | 'all') => Promise<void>;
  fetchZones: (status?: DangerZoneStatus | 'all') => Promise<void>;
  createOfficialZone: (payload: DangerZoneCreateOfficialPayload) => Promise<DangerZoneRecord>;
  verifyReport: (id: string, expiresAt?: string | null) => Promise<DangerZoneRecord>;
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

export const useDangerZoneStore = create<DangerZoneStore>((set, get) => ({
  reports: [],
  zones: [],
  isLoading: false,
  isMutating: false,
  error: null,

  fetchReports: async status => {
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get<{ reports: DangerZoneRecord[] }>(API_ENDPOINTS.DANGER_ZONES.GET_REPORTS, {
        headers,
        params: status && status !== 'all' ? { status } : undefined,
      });
      set({ reports: response.data.reports, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: getErrorMessage(error, 'Failed to fetch danger-zone reports') });
    }
  },

  fetchZones: async status => {
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get<{ zones: DangerZoneRecord[] }>(API_ENDPOINTS.DANGER_ZONES.GET_ZONES, {
        headers,
        params: status && status !== 'all' ? { status } : undefined,
      });
      set({ zones: response.data.zones, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: getErrorMessage(error, 'Failed to fetch danger zones') });
    }
  },

  createOfficialZone: async payload => {
    set({ isMutating: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post<{ data: DangerZoneRecord }>(API_ENDPOINTS.DANGER_ZONES.CREATE_OFFICIAL, payload, {
        headers,
      });
      await get().fetchZones();
      set({ isMutating: false });
      return response.data.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to create official danger zone');
      set({ isMutating: false, error: message });
      throw new Error(message);
    }
  },

  verifyReport: async (id, expiresAt) => {
    set({ isMutating: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await axios.patch<{ data: DangerZoneRecord }>(
        API_ENDPOINTS.DANGER_ZONES.VERIFY_REPORT,
        { id, expiresAt: expiresAt ?? null },
        { headers }
      );
      await Promise.all([get().fetchReports(), get().fetchZones()]);
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
      await Promise.all([get().fetchReports(), get().fetchZones()]);
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
      await get().fetchZones();
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
      await Promise.all([get().fetchReports(), get().fetchZones()]);
      set({ isMutating: false });
      return response.data.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to resolve danger zone');
      set({ isMutating: false, error: message });
      throw new Error(message);
    }
  },
}));
