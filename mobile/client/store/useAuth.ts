import { create } from 'zustand';
import { User } from 'firebase/auth';

type AuthStore = {
  authUser: User | null;
  isLoading: boolean;     // Firebase auth state loading
  setAuthUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
};

export const useAuth = create<AuthStore>((set) => ({
  authUser: null,
  isLoading: true,
  setAuthUser: (user) => set({ authUser: user }),
  setLoading: (loading) => set({ isLoading: loading }),
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