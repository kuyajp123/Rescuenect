import { create } from 'zustand';

interface ImagePickerState {
  image: string | null;
  setImage: (image: string | null) => void;
}

export const useImagePickerStore = create<ImagePickerState>((set) => ({
  image: null,
  setImage: (image) => set({ image }),
}));