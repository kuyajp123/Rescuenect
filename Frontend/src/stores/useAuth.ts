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
  role?: 'super_admin' | 'lgu_admin';
  clientId?: string | null;
  clientName?: string | null;
  clientStatus?: 'draft' | 'active' | 'inactive' | 'deletion_scheduled' | 'deleting' | 'deleted' | null;
  clientDeletionEffectiveAt?: unknown;
  municipalityName?: string | null;
  weatherLocationKey?: string | null;
  weatherLatitude?: number | null;
  weatherLongitude?: number | null;
  mapSettings?: {
    centerLatitude: number | null;
    centerLongitude: number | null;
    minZoom: number;
    zoom: number;
    maxZoom: number;
    maxBounds: { north: number; south: number; east: number; west: number } | null;
    boundarySource?: string | null;
    boundaryVerified: boolean;
    boundaryUpdatedAt?: unknown;
  };
  clientBarangays?: Array<{
    barangayCode: string | null;
    barangayLabel: string;
    value: string;
    isActive: boolean;
    latitude?: number | null;
    longitude?: number | null;
    verified?: boolean;
  }>;
  status?: 'active' | 'inactive';
  permissions?: string[];
  permissionsVersion?: number;
  onboardingComplete: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  address?: string;
  fcmToken?: string | null;
}

export type AuthAccessIssue = {
  status?: number;
  code: 'admin_inactive' | 'client_inactive' | 'admin_denied' | 'unauthorized';
  message: string;
} | null;

type AuthStore = {
  auth: User | null;
  userData: UserData | null;
  accessIssue: AuthAccessIssue;
  isLoading: boolean;
  isVerifying: boolean;
  setAuth: (user: User | null) => void;
  setUserData: (data: UserData | null) => void;
  setAccessIssue: (issue: AuthAccessIssue) => void;
  setLoading: (loading: boolean) => void;
  setVerifying: (verifying: boolean) => void;
  updateUserData: (data: Partial<UserData>) => void;
  syncUserData: (options?: { silent?: boolean }) => Promise<void>; // Added syncUserData
};

const isUserDataForCurrentUser = (data: UserData | null, user: User | null): boolean =>
  Boolean(data && user && data.uid === user.uid);

export const getAccessIssueFromError = (error: any): AuthAccessIssue => {
  const status = error?.response?.status;
  const message = error?.response?.data?.message || error?.message || 'Admin access is unavailable';

  if (message === 'Admin account is inactive') {
    return { status, code: 'admin_inactive', message };
  }

  if (message === 'LGU client is not active') {
    return { status, code: 'client_inactive', message };
  }

  if (message === 'Admin access required' || message === 'User not found') {
    return { status, code: 'admin_denied', message };
  }

  if (status === 401) {
    return { status, code: 'unauthorized', message: 'Your admin session expired. Please sign in again.' };
  }

  return null;
};

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      auth: null,
      userData: null,
      accessIssue: null,
      isLoading: true,
      isVerifying: false,
      setAuth: user =>
        set(state => ({
          auth: user,
          userData: isUserDataForCurrentUser(state.userData, user) ? state.userData : null,
          accessIssue: user ? state.accessIssue : null,
        })),
      setUserData: data =>
        set(state => {
          if (!data) return { userData: null };

          const currentUid = state.auth?.uid || firebaseAuth.currentUser?.uid;
          if (currentUid && data.uid !== currentUid) return { userData: null };

          return { userData: data, accessIssue: null };
        }),
      setAccessIssue: issue => set({ accessIssue: issue, userData: issue ? null : get().userData }),
      setLoading: loading => set({ isLoading: loading }),
      setVerifying: verifying => set({ isVerifying: verifying }),
      updateUserData: data =>
        set(state => ({
          userData: state.userData ? { ...state.userData, ...data } : null,
        })),
      syncUserData: async (options = {}) => {
        const currentUser = get().auth || firebaseAuth.currentUser;
        if (!currentUser) {
          console.warn('Cannot sync user data: No authenticated user');
          set({ userData: null, accessIssue: null });
          return;
        }

        if (!isUserDataForCurrentUser(get().userData, currentUser)) {
          set({ userData: null });
        }

        if (!options.silent) {
          set({ isVerifying: true });
        }

        try {
          const idToken = await currentUser.getIdToken(true); // Force refresh token
          const response = await axios.post<{ user: UserData }>(
            API_ENDPOINTS.AUTH.SIGNIN,
            {
              email: currentUser.email,
              uid: currentUser.uid,
              fcmToken: null,
              barangay: 'bancaan',
            },
            { headers: { Authorization: `Bearer ${idToken}` }, withCredentials: true }
          );

          if (response.data && response.data.user) {
            const latestUser = get().auth || firebaseAuth.currentUser;
            if (latestUser?.uid === currentUser.uid && response.data.user.uid === currentUser.uid) {
              set({ userData: response.data.user, accessIssue: null });
            }
          }
        } catch (error: any) {
          console.error('❌ Failed to sync user data:', error);

          const errorCode = error?.code || '';
          const status = error?.response?.status;
          const accessIssue = getAccessIssueFromError(error);

          if (accessIssue && (status === 403 || status === 404)) {
            set({ userData: null, accessIssue });
            return;
          }

          // Check for Firebase Auth errors or Backend 401/403 indicating the user is no longer valid
          if (
            errorCode === 'auth/user-not-found' ||
            errorCode === 'auth/user-token-expired' ||
            errorCode === 'auth/invalid-user-token' ||
            errorCode === 'auth/user-disabled' ||
            status === 401
          ) {
            console.warn('Logging out due to invalid auth state/deleted user.');
            await firebaseAuth.signOut();
            set({ auth: null, userData: null, accessIssue: null });
          }
        } finally {
          if (!options.silent) {
            set({ isVerifying: false });
          }
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
  useAuth.getState().setLoading(true);
  useAuth.getState().setAuth(user || null);

  if (user) {
    // User is logged in, sync fresh data from backend
    // This ensures updated onboarding status on reload
    await useAuth.getState().syncUserData();
  } else {
    useAuth.getState().setUserData(null);
  }

  useAuth.getState().setVerifying(false);
  useAuth.getState().setLoading(false);
});
