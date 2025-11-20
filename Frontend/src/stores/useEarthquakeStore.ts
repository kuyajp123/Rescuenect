import { ProcessedEarthquake } from '@/types/types';
import { create } from 'zustand';

interface EarthquakeState {
  earthquakes: ProcessedEarthquake[];
  loading: boolean;
  error: string | null;
  setEarthquakes: (earthquakes: ProcessedEarthquake[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useEarthquakeStore = create<EarthquakeState>(set => ({
  earthquakes: [],
  loading: false,
  error: null,
  setLoading: loading => set({ loading }),
  setError: error => set({ error }),
  setEarthquakes: earthquakes => set({ earthquakes }),
}));
