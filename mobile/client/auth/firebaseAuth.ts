import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useAuth } from '@/store/useAuth';
import { handleAuthNavigation, handleSignOutNavigation } from '@/components/navigations/navigation';
import Constants from 'expo-constants';

const getGoogleWebClientId = () => {
  const configuredClientId = Constants.expoConfig?.extra?.googleWebClientId;
  if (typeof configuredClientId === 'string' && configuredClientId.length > 0) {
    return configuredClientId;
  }

  return process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
};

// Configure Google Sign-In
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
    // console.log("✅ Google Sign-In configured successfully");
  } catch (error) {
    console.error("❌ Error configuring Google Sign-In:", error);
  }
};

// Set up Firebase auth state listener
export const setupAuthListener = (): Promise<void> => {
  return new Promise((resolve) => {
    let hasResolved = false;
    
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      try {
        // Update the centralized auth store
        useAuth.getState().setAuthUser(user);
        useAuth.getState().setLoading(false);

        // console.log("🔔 Auth state changed. Current user:", user ? JSON.stringify(user, null, 2) : "No user");
        
        // Handle navigation based on auth state
        if (user) {
          await handleAuthNavigation(user);
        } else if (hasResolved) {
          // Only handle sign-out navigation if this isn't the initial load
          handleSignOutNavigation();
        } else {
          // Initial load with no user - handle guest navigation
          await handleAuthNavigation(null);
        }
        
        // console.log("✅ Navigation handling completed");
        
      } catch (error) {
        console.error("❌ Error in auth state handler:", error);
        const errorDetails = error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : {
          message: String(error),
          stack: undefined
        };
        console.error("❌ Error details:", errorDetails);
        
        // Fallback navigation
        try {
          // console.log("🔄 Attempting fallback navigation to sign-in");
          handleSignOutNavigation();
        } catch (fallbackError) {
          console.error("❌ Even fallback navigation failed:", fallbackError);
        }
      }
      
      // Resolve the promise after first auth state determination
      if (!hasResolved) {
        hasResolved = true;
        resolve();
      }
    });
    
    // Keep the listener active - don't unsubscribe
    // The listener will continue to monitor auth state changes
  });
};

// Initialize authentication system
export const initializeAuth = async (): Promise<void> => {
  // console.log("🚀 Initializing authentication system");
  
  // Configure Google Sign-In
  configureGoogleSignIn();
  
  // Set up auth listener and wait for initial state
  await setupAuthListener();
  
  // console.log("✅ Authentication system initialized");
};
