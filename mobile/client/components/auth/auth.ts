import { storageHelpers } from '@/components/helper/storage';
import { useUserData } from '@/components/store/useBackendResponse';
import { useCoords } from '@/components/store/useCoords';
import { useStatusFormStore } from '@/components/store/useStatusForm';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { API_ROUTES } from '@/config/endpoints';
import { auth } from '@/lib/firebaseConfig';
import { navigateToSignIn } from '@/routes/route';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import { signInWithCustomToken } from 'firebase/auth';
import { Alert } from 'react-native';

export const handleGoogleSignIn = async (setLoading?: (loading: boolean) => void) => {
  try {
    const { setUserData } = useUserData.getState();
    setLoading?.(true);

    // Check Google Play Services
    await GoogleSignin.hasPlayServices();

    // Perform Google Sign-In
    const userInfo = await GoogleSignin.signIn();

    const idToken = userInfo.data?.idToken;

    // Send to backend for verification and user creation/retrieval
    const response = await axios.post(
      API_ROUTES.AUTH.SIGNIN,
      {
        idToken,
        user: {
          email: userInfo.data?.user.email,
          familyName: userInfo.data?.user.familyName,
          givenName: userInfo.data?.user.givenName,
          photo: userInfo.data?.user.photo,
        },
      },
      {
        timeout: 30000, // 30 seconds timeout
      }
    );

    // Store backend response BEFORE Firebase auth state changes
    setUserData({
      isNewUser: response.data.isNewUser,
      userData: {
        firstName: response.data.user.firstName,
        lastName: response.data.user.lastName,
        barangay: response.data.user.barangay,
        phoneNumber: response.data.user.phoneNumber,
      },
    });

    // Sign in to Firebase with custom token AFTER storing response
    await signInWithCustomToken(auth, response.data.token);
    await auth.currentUser?.reload();

    // Clear sign-out flag since user is now signed in
    await storageHelpers.setField(STORAGE_KEYS.APP_STATE, 'hasSignedOut', false);

    setLoading?.(false);
    // Note: Navigation for complete users will be handled by the auth state listener in firebaseAuth.ts
  } catch (error: any) {
    setLoading?.(false);

    console.error('❌ Google Sign-In error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      toString: error.toString(),
    });

    const isSignedIn = await GoogleSignin.getCurrentUser();

    // Sign out from Google
    if (isSignedIn) {
      // console.log("🔄 User is signed in with Google, proceeding to sign out");
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    }

    // Show user-friendly error
    Alert.alert('Sign-In Error', `Failed to sign in: ${error.message || 'Unknown error'}`, [{ text: 'OK' }]);
  }
};

export const handleLogout = async () => {
  const resetFormData = useStatusFormStore.getState().resetFormData;
  const resetCoords = useCoords.getState().resetState;
  const resetResponse = useUserData.getState().resetResponse;
  const setFormData = useStatusFormStore.getState().setFormData;

  try {
    resetFormData();
    resetCoords?.();
    // Clear user data from storage
    await storageHelpers.removeData(STORAGE_KEYS.USER);
    // Set sign-out flag to indicate intentional sign-out
    await storageHelpers.setField(STORAGE_KEYS.APP_STATE, 'hasSignedOut', true);
    // console.log("✅ Storage cleared and sign-out flag set");

    // Sign out from Firebase (this will trigger the auth state listener)
    await auth.signOut();
    // console.log("✅ Firebase sign out successful");

    const isSignedIn = await GoogleSignin.getCurrentUser();

    // Sign out from Google
    if (isSignedIn) {
      // console.log("🔄 User is signed in with Google, proceeding to sign out");
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    }

    resetResponse();
    setFormData(null);
    // console.log("✅ Google sign out successful");

    // Alert.alert("Logged Out", "You have been logged out successfully.");

    // Note: Navigation will be handled by the auth state listener in firebaseAuth.ts
    navigateToSignIn();
  } catch (error) {
    console.error('❌ Logout error:', error);

    // Even if there's an error, try to clear Google state
    try {
      resetFormData();
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    } catch (e) {
      console.error('Failed to sign out from Google:', e);
    }

    Alert.alert('Logout Error', 'Failed to log out completely. Please try again.');
  }
};
