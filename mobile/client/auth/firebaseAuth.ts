import { auth } from '@/lib/firebaseConfig';
import { useAuth } from '@/store/useAuth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { onAuthStateChanged, User } from 'firebase/auth';

const getGoogleWebClientId = () => {
  const configuredClientId = Constants.expoConfig?.extra?.googleWebClientId;
  if (typeof configuredClientId === 'string' && configuredClientId.length > 0) {
    return configuredClientId;
  }

  return process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
};

export const configureGoogleSignIn = () => {
  try {
    const webClientId = getGoogleWebClientId();
    if (!webClientId) {
      console.error('Google Sign-In web client ID is missing. Check app.config.ts and google-services.json.');
      return;
    }

    GoogleSignin.configure({
      webClientId,
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
  } catch (error) {
    console.error('Error configuring Google Sign-In:', error);
  }
};

export const setupAuthListener = () => {
  useAuth.getState().setLoading(true);

  return onAuthStateChanged(
    auth,
    (user: User | null) => {
      useAuth.getState().setAuthUser(user);
      useAuth.getState().setLoading(false);
    },
    error => {
      console.error('Firebase auth listener error:', error);
      useAuth.getState().setAuthUser(null);
      useAuth.getState().setLoading(false);
    }
  );
};

export const initializeAuth = () => {
  configureGoogleSignIn();
  return setupAuthListener();
};
