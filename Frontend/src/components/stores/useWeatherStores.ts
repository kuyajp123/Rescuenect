import { create } from 'zustand';

type Weather = {
  temp: number;
  condition: string;
  fetchedAt: number;
};

type Store = {
  weather: Weather | null;
  setWeather: (data: Weather) => void;
};

export const useWeatherStore = create<Store>((set) => ({
  weather: null,
  setWeather: (data) => set({ weather: data }),
}));
