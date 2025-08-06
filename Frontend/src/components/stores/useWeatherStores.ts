import { create } from 'zustand';
import { WeatherData } from '../shared/types'

type Store = {
  weather: any | null;
  setWeather: (data: any) => void;
};

export const useWeatherStore = create<Store>((set) => ({
  weather: null,
  setWeather: (data) => set({ weather: data }),
}));
