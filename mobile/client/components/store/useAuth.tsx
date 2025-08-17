import { create } from 'zustand';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebaseConfig';
import { storage } from '@/components/helper/storage';

type AuthStore = {
  auth: User | null;
  isLoading: boolean;     // Firebase auth state loading
  isVerifying: boolean;   // Backend verification in progress
  setAuth: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setVerifying: (verifying: boolean) => void;
};

export const useAuth = create<AuthStore>((set) => ({
  auth: null,
  isLoading: true,
  isVerifying: false,
  setAuth: (user) => set({ auth: user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setVerifying: (verifying) => set({ isVerifying: verifying }),
}));

// Always run this on auth state change
onAuthStateChanged(firebaseAuth, async (user) => {
  if (user) {
    useAuth.getState().setAuth(user || null);
    useAuth.getState().setLoading(false);
  } else {
    await storage.remove('@user');
    await storage.remove('@barangay');
  }
});
