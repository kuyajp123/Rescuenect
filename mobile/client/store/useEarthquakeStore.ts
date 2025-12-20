import { create } from 'zustand';

export interface EarthquakeData {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  updated: number;
  coordinates: {
    longitude: number;
    latitude: number;
    depth: number;
  };
  severity: 'micro' | 'minor' | 'light' | 'moderate' | 'strong' | 'major' | 'great';
  priority: 'low' | 'normal' | 'high' | 'critical';
  tsunami_warning: boolean;
  usgs_url: string;
  distance_km?: number;
  impact_radii: {
    felt_radius_km: number;
    moderate_shaking_radius_km: number;
    strong_shaking_radius_km: number;
    estimation_params: {
      feltA: number;
      moderateA: number;
      strongA: number;
      B: number;
      D: number;
    };
  };
  notification_sent: boolean;
}

interface EarthquakeStoreState {
  earthquakes: EarthquakeData[];
  setEarthquakes: (earthquakes: EarthquakeData[]) => void;
  clearEarthquakes: () => void;
}

export const useEarthquakeStore = create<EarthquakeStoreState>(set => ({
  earthquakes: [],
  setEarthquakes: (earthquakes: EarthquakeData[]) => set({ earthquakes }),
  clearEarthquakes: () => set({ earthquakes: [] }),
}));
