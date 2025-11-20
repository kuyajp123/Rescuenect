import { create } from 'zustand';

interface MapStyleState {
  styleUrl: string;
  attribution: string;
  setMapStyle: (styleUrl: string, attribution: string) => void;
}

export const useMapStyleStore = create<MapStyleState>(set => ({
  styleUrl: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', // Default to Light style
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  setMapStyle: (styleUrl: string, attribution: string) => set({ styleUrl, attribution }),
}));
