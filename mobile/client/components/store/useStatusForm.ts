import { create } from "zustand";
import { StatusForm } from '@/types/components';

type StatusFormStore = {
    formData: StatusForm | null;
    setFormData: (data: StatusForm | null) => void;
    resetFormData: () => void;
}

export const useStatusFormStore = create<StatusFormStore>((set) => ({
  formData: null,  // now it can be null
  setFormData: (data) => set((state) => ({
    formData: state.formData ? { ...state.formData, ...data } : data
  })),
  resetFormData: () => set({ formData: null }),
}));