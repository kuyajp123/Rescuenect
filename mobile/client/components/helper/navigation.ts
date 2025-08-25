import { router } from 'expo-router';
import { useNewUser } from './auth';
import { storage } from './storage';

// Direct route constants to avoid import issues
const ROUTES = {
  AUTH: {
    SIGN_IN: '/auth/signIn',
    BARANGAY_FORM: '/auth/barangayForm',
  },
  TABS: '/(tabs)',
} as const;

// Type-safe navigation helper functions with error handling
export const navigateToSignIn = () => {
  try {
    console.log("🧭 Navigating to sign-in page");
    console.log("🧭 Route:", ROUTES.AUTH.SIGN_IN);
    router.replace(ROUTES.AUTH.SIGN_IN);
  } catch (error) {
    console.error("❌ Error navigating to sign-in:", error);
  }
};

export const navigateToBarangayForm = () => {
  try {
    console.log("🧭 Navigating to barangay form");
    console.log("🧭 Route:", ROUTES.AUTH.BARANGAY_FORM);
    router.replace(ROUTES.AUTH.BARANGAY_FORM);
  } catch (error) {
    console.error("❌ Error navigating to barangay form:", error);
  }
};

export const navigateToTabs = () => {
  try {
    console.log("🧭 Navigating to tabs");
    console.log("🧭 Route:", ROUTES.TABS);
    router.replace(ROUTES.TABS);
  } catch (error) {
    console.error("❌ Error navigating to tabs:", error);
  }
};

// Main navigation logic based on auth state
export const handleAuthNavigation = async (user: any) => {
  try {
    console.log("🧭 Starting auth navigation", { hasUser: !!user });
    
    if (user) {
      // User is authenticated - check if new or returning user
      const { newUser } = useNewUser.getState();
      console.log("👤 User authenticated, newUser state:", { newUser });

      if (newUser) {
        console.log("🆕 New user detected");
        navigateToBarangayForm();
        // Reset the newUser state
        useNewUser.getState().reset();
      } else {
        console.log("🔄 Returning user detected");
        navigateToTabs();
      }
    } else {
      // No authenticated user - check saved data
      console.log("❌ No authenticated user, checking saved data");
      await handleGuestNavigation();
    }
  } catch (error) {
    console.error("❌ Error in handleAuthNavigation:", error);
    // Fallback to sign-in page
    navigateToSignIn();
  }
};

// Handle navigation for guests (no authenticated user)
export const handleGuestNavigation = async () => {
  try {
    const savedBarangay = await storage.get('@barangay');
    const savedUser = await storage.get('@user');

    console.log("🔍 Checking saved data:", { 
      savedBarangay: !!savedBarangay, 
      savedUser: !!savedUser 
    });

    if (savedBarangay && savedUser) {
      console.log("✅ Found saved data");
      navigateToTabs();
    } else {
      console.log("❌ No saved data");
      navigateToSignIn();
    }
  } catch (error) {
    console.error('❌ Error loading saved data:', error);
    navigateToSignIn();
  }
};

// Handle navigation after sign-out
export const handleSignOutNavigation = () => {
  console.log("🚪 User signed out");
  navigateToSignIn();
};
