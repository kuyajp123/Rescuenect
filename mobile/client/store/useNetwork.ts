import { create } from 'zustand';

type NetworkStore = {
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;
};

export const useNetwork = create<NetworkStore>((set) => ({
  isOnline: false,
  setIsOnline: (isOnline) => set({ isOnline }),
}));