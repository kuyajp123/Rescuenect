import { StatusData } from '@/types/types';
import { create } from 'zustand';

interface AllStatusState {
  allStatuses: StatusData[];
  loading: boolean;
  error: string | null;
  setAllStatuses: (statuses: StatusData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAllStatusStore = create<AllStatusState>(set => ({
  allStatuses: [],
  loading: false,
  error: null,
  setAllStatuses: allStatuses => set({ allStatuses }),
  setLoading: loading => set({ loading }),
  setError: error => set({ error }),
}));
