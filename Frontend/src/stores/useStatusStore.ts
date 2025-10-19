import { create } from 'zustand';
import { StatusData } from '@/types/types';

type Status = {
  statusData: Array<StatusData>;
  setData: (data: Array<StatusData>) => void;
};

export const useStatusStore = create<Status>(set => ({
  statusData: [],
  setData: statusData => set({ statusData }),
}));
