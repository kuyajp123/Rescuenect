import { create } from 'zustand';

type ItemData = {
  id: string;
  label: string;
  location: string;
  lat: number;
  lng: number;
};

type SavedLocationsStore = {
  savedLocations: ItemData[];
  setSavedLocations: (locations: ItemData[]) => void;
  clearLocations: () => void;
};

export const useSavedLocationsStore = create<SavedLocationsStore>(set => ({
  savedLocations: [],
  setSavedLocations: (locations: ItemData[]) => set({ savedLocations: locations }),
  clearLocations: () => set({ savedLocations: [] }),
}));
