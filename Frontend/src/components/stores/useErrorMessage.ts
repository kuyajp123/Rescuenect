import { create } from 'zustand';

type ErrorStore = {
  message: string | null;
  setError: (error: string | null) => void;
}

export const useErrorStore = create<ErrorStore>((set) => ({
  message: null,
  setError: (message) => set({ message: message}),
}));