import { router } from 'expo-router';
import { useNewUser } from './auth';
import { storage } from './storage';

// Direct route constants to avoid import issues
const ROUTES = {
  AUTH: {
    SIGN_IN: '/auth/signIn',
    BARANGAY_FORM: '/auth/barangayForm',
    NAME_AND_CONTACT_FORM: '/auth/nameAndContactForm',
  },
  STATUS: {
    CREATE: '/status/createStatus',
    CITY_NEEDS: '/status/cityNeeds',
  },
  TABS: '/(tabs)',
  NOTIFICATION: '/notification',
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

export const navigateToNameAndContactForm = () => {
  try {
    console.log("🧭 Navigating to name and contact form");
    console.log("🧭 Route:", ROUTES.AUTH.NAME_AND_CONTACT_FORM);
    router.replace(ROUTES.AUTH.NAME_AND_CONTACT_FORM);
  } catch (error) {
    console.error("❌ Error navigating to name and contact form:", error);
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

export const navigateToCreateStatus = () => {
  try {
    console.log("🧭 Navigating to create status");
    console.log("🧭 Route:", ROUTES.STATUS.CREATE);
    router.replace(ROUTES.STATUS.CREATE);
  } catch (error) {
    console.error("❌ Error navigating to create status:", error);
  }
};

export const navigateToCityNeeds = () => {
  try {
    console.log("🧭 Navigating to city needs");
    console.log("🧭 Route:", ROUTES.STATUS.CITY_NEEDS);
    router.replace(ROUTES.STATUS.CITY_NEEDS);
  } catch (error) {
    console.error("❌ Error navigating to city needs:", error);
  }
};

export const navigateToNotification = () => {
  try {
    router.replace(ROUTES.NOTIFICATION);
  } catch (error) {
    console.error("❌ Error navigating to notification:", error);
  }
}

// Main navigation logic based on auth state
export const handleAuthNavigation = async (user: any) => {
  try {
    console.log("🧭 Starting auth navigation", { hasUser: !!user });
    
    if (user) {
      // User is authenticated - check if new or returning user
      const { newUser } = useNewUser.getState();
      console.log("👤 User authenticated, newUser state:", { newUser });

      if (newUser === true) {
        console.log("🆕 New user detected - going to barangay form");
        navigateToBarangayForm();
        // Reset the newUser state
        useNewUser.getState().reset();
      } else if (newUser === false) {
        console.log("🔄 Returning user detected - checking stored data");
        const barangayData = await storage.get('@barangay');
        const userData = await storage.get('@user');

        console.log("📱 Storage check results:", {
          hasBarangay: !!barangayData,
          barangayValue: barangayData,
          hasUserData: !!userData,
          hasPhoneNumber: !!userData?.phoneNumber,
          phoneNumberValue: userData?.phoneNumber
        });

        console.log("✅ User has complete data - going to tabs");
        navigateToTabs(); // uncomment this after
        // navigateToCreateStatus(); // temporary only
        // navigateToNotification(); // temporary only
      } else {
        console.log("❓ Undefined newUser state, checking storage for existing data");
        // Check if user has required data in storage
        const barangayData = await storage.get('@barangay');
        const userData = await storage.get('@user');

        if (barangayData && userData?.phoneNumber) {
          console.log("✅ User has complete data in storage - going to tabs");
          navigateToTabs();
        } else {
          console.log("❌ User missing data in storage - going to barangay form");
          navigateToBarangayForm();
        }
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

