import { API_ENDPOINTS } from '@/config/endPoints';
import { auth as firebaseAuth } from '@/lib/firebaseConfig';
import axios from 'axios';
import { onAuthStateChanged, User } from 'firebase/auth';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface UserData {
  uid: string;
  email: string;
  barangay: string;
  onboardingComplete: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  address?: string;
  fcmToken?: string | null;
}

type AuthStore = {
  auth: User | null;
  userData: UserData | null;
  isLoading: boolean;
  isVerifying: boolean;
  setAuth: (user: User | null) => void;
  setUserData: (data: UserData | null) => void;
  setLoading: (loading: boolean) => void;
  setVerifying: (verifying: boolean) => void;
  updateUserData: (data: Partial<UserData>) => void;
  syncUserData: () => Promise<void>; // Added syncUserData
};

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      auth: null,
      userData: null,
      isLoading: true,
      isVerifying: false,
      setAuth: user => set({ auth: user }),
      setUserData: data => set({ userData: data }),
      setLoading: loading => set({ isLoading: loading }),
      setVerifying: verifying => set({ isVerifying: verifying }),
      updateUserData: data =>
        set(state => ({
          userData: state.userData ? { ...state.userData, ...data } : null,
        })),
      syncUserData: async () => {
        const currentUser = get().auth;
        if (!currentUser) {
          console.warn('Cannot sync user data: No authenticated user');
          return;
        }

        try {
          const idToken = await currentUser.getIdToken(true); // Force refresh token
          const response = await axios.post<{ user: UserData }>(
            API_ENDPOINTS.AUTH.SIGNIN,
            {
              email: currentUser.email,
              uid: currentUser.uid,
              fcmToken: null,
              barangay: 'bancaan', // Default/Existing param required by controller
            },
            { headers: { Authorization: `Bearer ${idToken}` }, withCredentials: true }
          );

          if (response.data && response.data.user) {
            set({ userData: response.data.user });
          }
        } catch (error) {
          console.error('❌ Failed to sync user data:', error);
          // If 401/403, user might need to re-authenticate
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: state => ({ userData: state.userData }),
    }
  )
);

// Always run this on auth state change
onAuthStateChanged(firebaseAuth, async user => {
  useAuth.getState().setAuth(user || null);

  if (user) {
    // User is logged in, sync fresh data from backend
    // This ensures updated onboarding status on reload
    await useAuth.getState().syncUserData();
  } else {
    useAuth.getState().setUserData(null);
  }

  useAuth.getState().setLoading(false);
});
