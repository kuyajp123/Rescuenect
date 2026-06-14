import { create } from 'zustand';

export type MapStyleKey = 'light' | 'dark';

export interface MapStyleOption {
  key: MapStyleKey;
  label: string;
  url: string;
  attribution: string;
  description: string;
}

export const MAP_STYLE_STORAGE_KEY = 'rescuenect_map_style';

export const MAP_STYLE_OPTIONS: MapStyleOption[] = [
  {
    key: 'light',
    label: 'Light',
    url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    // url: 'https://tiles.openfreemap.org/styles/liberty',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    description: 'Standard OpenStreetMap style with light colors',
  },
  {
    key: 'dark',
    label: 'Dark',
    // url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    // url: 'https://tiles.openfreemap.org/styles/fiord',
    attribution:
      '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    description: 'Smooth dark theme',
  },
];

export const DEFAULT_MAP_STYLE = MAP_STYLE_OPTIONS[0];

export const getMapStyleOption = (styleKey?: string | null) =>
  MAP_STYLE_OPTIONS.find(style => style.key === styleKey) ?? DEFAULT_MAP_STYLE;

const getInitialMapStyle = () => {
  if (typeof window === 'undefined') return DEFAULT_MAP_STYLE;

  try {
    return getMapStyleOption(window.localStorage.getItem(MAP_STYLE_STORAGE_KEY));
  } catch {
    return DEFAULT_MAP_STYLE;
  }
};

const persistMapStyle = (styleKey: MapStyleKey) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(MAP_STYLE_STORAGE_KEY, styleKey);
  } catch {
    // Ignore storage failures so map rendering is not blocked.
  }
};

interface MapStyleState {
  styleKey: MapStyleKey;
  styleUrl: string;
  attribution: string;
  setMapStyle: (styleUrl: string, attribution: string, styleKey?: MapStyleKey) => void;
  setMapStyleByKey: (styleKey: string) => void;
}

const initialMapStyle = getInitialMapStyle();

export const useMapStyleStore = create<MapStyleState>(set => ({
  styleKey: initialMapStyle.key,
  styleUrl: initialMapStyle.url,
  attribution: initialMapStyle.attribution,
  setMapStyle: (styleUrl: string, attribution: string, styleKey?: MapStyleKey) => {
    const matchingStyle = styleKey
      ? getMapStyleOption(styleKey)
      : MAP_STYLE_OPTIONS.find(style => style.url === styleUrl);

    if (matchingStyle) {
      persistMapStyle(matchingStyle.key);
      set({ styleKey: matchingStyle.key, styleUrl, attribution });
      return;
    }

    set({ styleUrl, attribution });
  },
  setMapStyleByKey: (styleKey: string) => {
    const style = getMapStyleOption(styleKey);
    persistMapStyle(style.key);
    set({ styleKey: style.key, styleUrl: style.url, attribution: style.attribution });
  },
}));
