import { STORAGE_KEYS } from '@/config/asyncStorage';
import { API_ROUTES } from '@/config/endpoints';
import { storageHelpers } from '@/helper/storage';
import { auth } from '@/lib/firebaseConfig';
import { navigateToSignIn } from '@/routes/route';
import { FCMTokenService } from '@/services/fcmTokenService';
import { useUserData } from '@/store/useBackendResponse';
import { useCoords } from '@/store/useCoords';
import { useImagePickerStore } from '@/store/useImagePicker';
import { useSavedLocationsStore } from '@/store/useSavedLocationsStore';
import { useStatusFormStore } from '@/store/useStatusForm';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import { signInWithCustomToken } from 'firebase/auth';
import { Alert } from 'react-native';

export const handleGoogleSignIn = async (setLoading?: (loading: boolean) => void) => {
  try {
    const { setUserData } = useUserData.getState();
    const { userData } = useUserData.getState();
    setLoading?.(true);

    // Check Google Play Services
    await GoogleSignin.hasPlayServices();

    // Ensure we are in a clean state to force account picker
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      // Ignore errors if already signed out
    }

    // Perform Google Sign-In
    const userInfo = await GoogleSignin.signIn();

    const idToken = userInfo.data?.idToken;

    if (!idToken) {
      setLoading?.(false);
      return;
    }

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
        ...userData,
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

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      // User cancelled the login flow
      return;
    }

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
      try {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore sign out errors during cleanup
        console.warn('Google signout error during cleanup (ignored):', e);
      }
    }

    // Show user-friendly error
    Alert.alert('Sign-In Error', `Failed to sign in: ${error.message || 'Unknown error'}`, [{ text: 'OK' }]);
  }
};

const safeGoogleSignOut = async () => {
  try {
    const isSignedIn = await GoogleSignin.getCurrentUser();
    if (isSignedIn) {
      try {
        await GoogleSignin.revokeAccess();
      } catch (error: any) {
        // If revoke fails, we still want to try signing out
        // console.warn('Google revokeAccess failed:', error);
      }
      await GoogleSignin.signOut();
    }
  } catch (error: any) {
    // If we get SIGN_IN_REQUIRED, it means we're already signed out, which is fine.
    // For other errors, we log them but don't block the logout flow.
    const errorMessage = String(error?.message || error);
    if (!errorMessage.includes('SIGN_IN_REQUIRED')) {
      console.warn('Google signOut failed:', error);
    }
  }
};

export const handleLogout = async () => {
  const resetFormData = useStatusFormStore.getState().resetFormData;
  const resetCoords = useCoords.getState().resetState;
  const resetResponse = useUserData.getState().resetResponse;
  const setFormData = useStatusFormStore.getState().setFormData;
  const setImage = useImagePickerStore.getState().setImage;
  const clearLocations = useSavedLocationsStore.getState().clearLocations;
  const authUser = auth.currentUser;

  try {
    resetFormData();
    resetCoords?.();
    // Clear user data from storage
    await storageHelpers.removeData(STORAGE_KEYS.USER);
    // Set sign-out flag to indicate intentional sign-out
    await storageHelpers.setField(STORAGE_KEYS.APP_STATE, 'hasSignedOut', true);

    await storageHelpers.removeData(STORAGE_KEYS.SAVED_LOCATIONS);
    clearLocations();

    // delete the notification from storage
    await storageHelpers.removeData(STORAGE_KEYS.GUEST_PREFS);

    if (authUser) {
      FCMTokenService.removeFcmToken(authUser);
    }

    // Sign out from Firebase (this will trigger the auth state listener)
    await auth.signOut();

    // Clear Google Session safely
    await safeGoogleSignOut();

    resetResponse();
    setFormData(null);
    setImage(null);

    // Note: Navigation will be handled by the auth state listener in firebaseAuth.ts
    navigateToSignIn();
  } catch (error) {
    console.error('❌ Logout error:', error);

    // Even if there's an error, try to clear Google state safely
    await safeGoogleSignOut();

    // Attempt to clear state and navigate anyway
    resetFormData();
    resetResponse();
    navigateToSignIn();

    // Only alert if it's a critical error that prevents logout feeling effective
    // Alert.alert('Logout Error', 'Failed to log out completely. Please try again.');
  }
};
