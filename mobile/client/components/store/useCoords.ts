import { create } from 'zustand';

type coordTypes = [number, number] | null;

interface CoordsState {
    coords: coordTypes;
    locationCoords: coordTypes;
    oneTimeLocationCoords: coordTypes;
    followUserLocation?: boolean;
    resetState?: () => void;
    setCoords: (coords: coordTypes) => void;
    setLocationCoords: (coords: coordTypes) => void;
    setOneTimeLocationCoords: (coords: coordTypes) => void;
    setFollowUserLocation: (follow: boolean) => void;
}

export const useCoords = create<CoordsState>((set) => ({
    coords: null,
    // locationCoords: [120.788432, 14.303068],
    locationCoords: null,
    oneTimeLocationCoords: null,
    followUserLocation: false,
    resetState: () => set({
        coords: null,
        locationCoords: null,
        oneTimeLocationCoords: null,
        followUserLocation: false,
    }),
    setCoords: (coords) => set({ coords }),
    setLocationCoords: (coords) => set({ locationCoords: coords }),
    setOneTimeLocationCoords: (coords) => set({ oneTimeLocationCoords: coords }),
    setFollowUserLocation: (follow) => set({ followUserLocation: follow }),
}));