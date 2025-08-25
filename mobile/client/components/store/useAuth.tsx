import { create } from 'zustand';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';

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

