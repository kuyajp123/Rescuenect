// store/useAuth.ts
import { create } from 'zustand';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebaseConfig';

type AuthStore = {
  auth: User | null;
  isLoading: boolean;
  setAuth: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
};

export const useAuth = create<AuthStore>((set) => ({
  auth: null,
  isLoading: true, // Start with loading true
  setAuth: (user) => set({ auth: user }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

onAuthStateChanged(firebaseAuth, (user) => {
  if (user) {
    useAuth.getState().setAuth(user);
    useAuth.getState().setLoading(false);
  }else {
    useAuth.getState().setAuth(null);
    useAuth.getState().setLoading(false);
  }
  useAuth.getState().setLoading(false);
});