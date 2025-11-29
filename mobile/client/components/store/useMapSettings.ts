import { StyleURL } from '@rnmapbox/maps';
import { create } from 'zustand';

interface MapStyle {
  value: StyleURL.Street | StyleURL.SatelliteStreet | StyleURL.Dark;
}

type MapButtonStates = {
  hasButtons: boolean;
  compassEnabled?: boolean;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  mapStyle?: MapStyle['value'];
  centerCoordinate: [number, number] | null;
  setHasButtons: (hasButtons: boolean) => void;
  setCompassEnabled: (compassEnabled: boolean) => void;
  setPitchEnabled: (pitchEnabled: boolean) => void;
  setRotateEnabled: (rotateEnabled: boolean) => void;
  setScrollEnabled: (scrollEnabled: boolean) => void;
  setZoomEnabled: (zoomEnabled: boolean) => void;
  setCenterCoordinate: (coordinate: [number, number] | null) => void;
  setMapStyle?: (style: MapStyle['value']) => void;
};

export const useMapSettingsStore = create<MapButtonStates>(set => ({
  hasButtons: true,
  compassEnabled: true,
  pitchEnabled: true,
  rotateEnabled: true,
  scrollEnabled: true,
  zoomEnabled: true,
  mapStyle: StyleURL.Street,
  centerCoordinate: [120.7752839, 14.2919325],
  setHasButtons: hasButtons => set({ hasButtons }),
  setCompassEnabled: compassEnabled => set({ compassEnabled }),
  setPitchEnabled: pitchEnabled => set({ pitchEnabled }),
  setRotateEnabled: rotateEnabled => set({ rotateEnabled }),
  setScrollEnabled: scrollEnabled => set({ scrollEnabled }),
  setZoomEnabled: zoomEnabled => set({ zoomEnabled }),
  setCenterCoordinate: coordinate => set({ centerCoordinate: coordinate }),
  setMapStyle: style => set({ mapStyle: style }),
}));
