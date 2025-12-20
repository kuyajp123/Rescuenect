import { auth } from '@/lib/firebaseConfig';
import { useAuth } from '@/stores/useAuth';
import axios from 'axios';

export const setupAxiosInterceptors = () => {
  axios.interceptors.response.use(
    response => response,
    async error => {
      const status = error.response ? error.response.status : null;
      const errorCode = error.code;

      // Check for unauthorized or forbidden status
      // Also check for specific Firebase auth error codes if they bubble up
      if (
        status === 401 ||
        status === 403 ||
        errorCode === 'auth/user-not-found' ||
        errorCode === 'auth/user-token-expired'
      ) {
        // Force Firebase Sign Out
        try {
          await auth.signOut();
        } catch (e) {
          console.error('Error signing out:', e);
        }

        // Clear local Zustand state
        useAuth.getState().setAuth(null);
        useAuth.getState().setUserData(null);

        // Optional: Redirect to login or show a toast
        // Window location reload might be aggressive but ensures clean slate
        // window.location.href = '/auth/login';
      }

      return Promise.reject(error);
    }
  );
};
