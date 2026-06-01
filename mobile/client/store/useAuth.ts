import { User } from 'firebase/auth';
import { create } from 'zustand';

type AuthStore = {
  authUser: User | null;
  isGuest: boolean;
  isLoading: boolean; // Firebase auth state loading
  hasSignedOut: boolean | null;
  isProfileHydrated: boolean;
  isGuestIntent: boolean;
  isShowingSetupComplete: boolean;
  setAuthUser: (user: User | null) => void;
  setGuest: (isGuest: boolean) => void;
  setLoading: (loading: boolean) => void;
  setHasSignedOut: (hasSignedOut: boolean | null) => void;
  setProfileHydrated: (isProfileHydrated: boolean) => void;
  setGuestIntent: (isGuestIntent: boolean) => void;
  setShowingSetupComplete: (isShowingSetupComplete: boolean) => void;
  resetAuth: () => void;
};

const initialAuthState = {
  authUser: null,
  isGuest: false,
  isLoading: true,
  hasSignedOut: null,
  isProfileHydrated: false,
  isGuestIntent: false,
  isShowingSetupComplete: false,
};

export const useAuth = create<AuthStore>(set => ({
  ...initialAuthState,

  setAuthUser: user => set({ authUser: user }),
  setGuest: isGuest => set({ isGuest }),
  setLoading: loading => set({ isLoading: loading }),
  setHasSignedOut: hasSignedOut => set({ hasSignedOut }),
  setProfileHydrated: isProfileHydrated => set({ isProfileHydrated }),
  setGuestIntent: isGuestIntent => set({ isGuestIntent }),
  setShowingSetupComplete: isShowingSetupComplete => set({ isShowingSetupComplete }),

  resetAuth: () => set(initialAuthState),
}));

// sample stored data:
// Zustand store state: {
// "hasAuthUser": {
// "_redirectEventId": undefined,
// "apiKey": "AIzaSyDXR-C63KYDKQrBmGBixtpMXLtxr-BM_H8",
// "appName": "[DEFAULT]",
// "createdAt": "1756385438774",
// "displayName": "John Paul",
// "email": "jnaag42@gmail.com",
// "emailVerified": false,
// "isAnonymous": false,
// "lastLoginAt": "1756387042166",
// "phoneNumber": undefined,
// "photoURL": "https://lh3.googleusercontent.com/a/ACg8ocLNXZCRiWq62x03uXmmlrdkJ2Gikma_6bwOHToGQXbBAUNzPw=s96-c",
// "providerData": [Array],
// "stsTokenManager": [Object],
// "tenantId": undefined,
// "uid": "BmGvWptqG7Y7lMLCj49LfI3bQBP2"}
// }
