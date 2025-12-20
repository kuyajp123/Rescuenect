import { useAuth } from '@/store/useAuth';
import { auth } from '@/lib/firebaseConfig';
import { FCMTokenService } from '@/services/fcmTokenService';

/**
 * Custom hook for logout with FCM token cleanup
 */
export const useLogout = () => {
  const clearAuth = useAuth(state => state.setAuthUser);

  const logout = async () => {
    try {
      const authUser = auth.currentUser;

      if (authUser) {
        // Remove FCM token from Firestore before signing out
        await FCMTokenService.removeFcmToken(authUser);
        console.log('✅ FCM token removed before logout');
      }

      // Sign out from Firebase
      await auth.signOut();

      // Clear local auth state
      clearAuth(null);

      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);

      // Even if token removal fails, still sign out
      try {
        await auth.signOut();
        clearAuth(null);
      } catch (signOutError) {
        console.error('❌ Error signing out:', signOutError);
      }
    }
  };

  return { logout };
};
