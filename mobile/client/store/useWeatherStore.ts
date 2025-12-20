import { WeatherData } from '@/types/components';
import { create } from 'zustand';

// Store type
export interface WeatherStore {
  weather: WeatherData | null;
  // Add other store methods/state as needed
  setWeather?: (weather: WeatherData) => void;
  clearWeather?: () => void;
}

export const useWeatherStore = create<WeatherStore>(set => ({
  weather: null,
  setWeather: data => set({ weather: data }),
}));
