import { create } from 'zustand';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';

type AuthStore = {
  signinUser: User | null;
  isLoading: boolean;     // Firebase auth state loading
  setAuth: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
};

export const useAuth = create<AuthStore>((set) => ({
  signinUser: null,
  isLoading: true,
  setAuth: (user) => set({ signinUser: user }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

// Always run this on auth state change
onAuthStateChanged(auth, async (user) => {
  useAuth.getState().setAuth(user || null);
  useAuth.getState().setLoading(false);
});
