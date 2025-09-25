import { create } from "zustand";
import { StatusForm } from '@/types/components';

type StatusFormStore = {
    formData: StatusForm | null;
    isLoading: boolean;
    error: boolean;
    setFormData: (data: StatusForm | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: boolean) => void;
    resetFormData: () => void;
}

export const useStatusFormStore = create<StatusFormStore>((set) => ({
  formData: null,  // now it can be null
  isLoading: false,
  error: false,
  setFormData: (data) => set((state) => ({
    formData: state.formData ? { ...state.formData, ...data } : data
  })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error: boolean) => set({ error }),
  resetFormData: () => set({ formData: null, error: false }),
}));