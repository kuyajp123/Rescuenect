import { create } from 'zustand';
import { StatusStateData } from '@/types/components';

type StatusFormStore = {
  formData: StatusStateData | null;
  isLoading: boolean;
  error: boolean;
  setFormData: (data: StatusStateData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: boolean) => void;
  resetFormData: () => void;
};

export const useStatusFormStore = create<StatusFormStore>(set => ({
  formData: null, // now it can be null
  // formData: {
  //   uid: 'dfhn;asdf',
  //   firstName: 'John',
  //   lastName: 'Doe',
  //   condition: 'safe',
  //   phoneNumber: '123-456-7890',
  //   lng: 120.7752839,
  //   lat: 14.2919325,
  //   location: null,
  //   image: '',
  //   note: '',
  //   shareLocation: true,
  //   shareContact: true,
  //   expirationDuration: 24,
  // }, // temporary only for testing
  isLoading: false,
  error: false,
  setFormData: data =>
    set(state => ({
      formData: state.formData ? { ...state.formData, ...data } : data,
    })),
  setLoading: loading => set({ isLoading: loading }),
  setError: (error: boolean) => set({ error }),
  resetFormData: () => set({ formData: null, error: false }),
}));
