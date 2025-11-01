import { create } from 'zustand';

type AuthUser = {
  isNewUser?: boolean | null;
  userData: {
    // ✅ Changed from 'user' to 'userData'
    firstName: string;
    lastName: string;
    barangay: string;
    phoneNumber: string;
  };
};

type BackendResponse = {
  isNewUser: boolean | null;
  userData: {
    firstName: string;
    lastName: string;
    barangay: string;
    phoneNumber: string;
  };
  setUserData: (response: AuthUser) => void;
  resetResponse: () => void;
};

export const useUserData = create<BackendResponse>()(set => ({
  isNewUser: null,
  userData: {
    firstName: '',
    lastName: '',
    barangay: '',
    phoneNumber: '',
  },
  setUserData: response => set({ ...response }),
  resetResponse: () =>
    set({ isNewUser: null, userData: { firstName: '', lastName: '', barangay: '', phoneNumber: '' } }),
}));
