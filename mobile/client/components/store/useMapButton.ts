import { create } from 'zustand';

type MapButtonStates = {
    isVisible: boolean;
    setIsVisible: (isVisible: boolean) => void;
};

export const useMapButtonStore = create<MapButtonStates>((set) => ({
    isVisible: true,
    setIsVisible: (isVisible) => set({ isVisible }),
}));