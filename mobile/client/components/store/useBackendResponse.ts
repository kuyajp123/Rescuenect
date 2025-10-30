import { create } from 'zustand';

type AuthUser = {
  isNewUser?: boolean | null;
  userResponse: {
    // ✅ Changed from 'user' to 'userResponse'
    firstName: string;
    lastName: string;
    barangay: string;
    phoneNumber: string;
  };
};

type BackendResponse = {
  isNewUser: boolean | null;
  userResponse: {
    firstName: string;
    lastName: string;
    barangay: string;
    phoneNumber: string;
  };
  setBackendResponse: (response: AuthUser) => void;
  resetResponse: () => void;
};

export const useUserData = create<BackendResponse>()(set => ({
  isNewUser: null,
  userResponse: {
    firstName: '',
    lastName: '',
    barangay: '',
    phoneNumber: '',
  },
  setBackendResponse: response => set({ ...response }),
  resetResponse: () =>
    set({ isNewUser: null, userResponse: { firstName: '', lastName: '', barangay: '', phoneNumber: '' } }),
}));
