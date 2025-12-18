import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { EvacuationCenter } from '@/types/types';
import axios from 'axios';
import { create } from 'zustand';

interface EvacuationStore {
  evacuationCenters: EvacuationCenter[];
  isLoading: boolean;
  error: string | null;
  fetchEvacuationCenters: () => Promise<void>;
  addEvacuationCenter: (center: EvacuationCenter) => void;
  updateEvacuationCenter: (id: string, updatedCenter: Partial<EvacuationCenter>) => void;
  deleteEvacuationCenter: (id: string) => Promise<void>;
  setEvacuationCenters: (centers: EvacuationCenter[]) => void;
}

export const useEvacuationStore = create<EvacuationStore>((set) => ({
  evacuationCenters: [],
  isLoading: false,
  error: null,

  fetchEvacuationCenters: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = auth.currentUser;
      const token = await user?.getIdToken();

      if (!token) {
        console.error('User is not authenticated');
        set({ isLoading: false, error: 'Not authenticated' });
        return;
      }

      const response = await axios.get<EvacuationCenter[]>(API_ENDPOINTS.EVACUATION.GET_CENTERS);
      set({ evacuationCenters: response.data, isLoading: false });
    } catch (error) {
      console.error('Error fetching evacuation centers:', error);
      set({ isLoading: false, error: 'Failed to fetch evacuation centers' });
    }
  },

  addEvacuationCenter: (center: EvacuationCenter) => {
    set(state => ({
      evacuationCenters: [...state.evacuationCenters, center],
    }));
  },

  updateEvacuationCenter: (id: string, updatedCenter: Partial<EvacuationCenter>) => {
    set(state => ({
      evacuationCenters: state.evacuationCenters.map(center =>
        center.id === id ? { ...center, ...updatedCenter } : center
      ),
    }));
  },

  deleteEvacuationCenter: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = auth.currentUser;
      const token = await user?.getIdToken();

      if (!token) {
        console.error('User is not authenticated');
        set({ isLoading: false, error: 'Not authenticated' });
        return;
      }

      await axios.delete(API_ENDPOINTS.EVACUATION.DELETE_CENTER, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { id, uid: user?.uid },
      } as any);

      set(state => ({
        evacuationCenters: state.evacuationCenters.filter(center => center.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error deleting evacuation center:', error);
      set({ isLoading: false, error: 'Failed to delete evacuation center' });
      throw error;
    }
  },

  setEvacuationCenters: (centers: EvacuationCenter[]) => {
    set({ evacuationCenters: centers });
  },
}));
