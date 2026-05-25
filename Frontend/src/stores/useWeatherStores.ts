import { WeatherData } from '@/types/types';
import { create } from 'zustand';

type Store = {
  weather: WeatherData | null;
  setWeather: (data: WeatherData | null) => void;
  clearWeather: () => void;
};

export const useWeatherStore = create<Store>((set) => ({
  weather: null,
  setWeather: (data) => set({ weather: data }),
  clearWeather: () => set({ weather: null }),
}));
