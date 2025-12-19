import { WeatherData } from '@/types/types';
import { create } from 'zustand';

type Store = {
  weather: WeatherData | null;
  setWeather: (data: WeatherData) => void;
};

export const useWeatherStore = create<Store>((set) => ({
  weather: null,
  setWeather: (data) => set({ weather: data }),
}));
