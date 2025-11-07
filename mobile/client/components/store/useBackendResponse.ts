import { create } from 'zustand';

type AuthUser = {
  isNewUser?: boolean | null;
  userData: {
    // ✅ Changed from 'user' to 'userData'
    firstName: string;
    lastName: string;
    barangay: string;
    phoneNumber: string;
    fcmToken: string | null;
  };
};

type BackendResponse = {
  isNewUser: boolean | null;
  userData: {
    firstName: string;
    lastName: string;
    barangay: string;
    phoneNumber: string;
    fcmToken: string | null;
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
    fcmToken: null,
  },
  setUserData: response => set({ ...response }),
  resetResponse: () =>
    set({ isNewUser: null, userData: { firstName: '', lastName: '', barangay: '', phoneNumber: '', fcmToken: null } }),
}));
