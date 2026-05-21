import { router } from 'expo-router';

// Direct route constants to avoid import issues
const ROUTES = {
  AUTH: {
    SIGN_IN: '/auth/signIn',
    BARANGAY_FORM: '/auth/barangayForm',
    NAME_AND_CONTACT_FORM: '/auth/nameAndContactForm',
  },
  STATUS: {
    CREATE: '/status/createStatus',
    SETTINGS: '/status/statusSettings',
    CITY_NEEDS: '/status/cityNeeds',
  },
  TABS: '/(app)/(tabs)',
  NOTIFICATION: '/notification',
} as const;

// Type-safe navigation helper functions with error handling
export const navigateToSignIn = () => {
  try {
    router.replace(ROUTES.AUTH.SIGN_IN);
  } catch (error) {
    console.error('❌ Error navigating to sign-in:', error);
  }
};

export const navigateToBarangayForm = () => {
  try {
    // console.log("🧭 Navigating to barangay form");
    // console.log("🧭 Route:", ROUTES.AUTH.BARANGAY_FORM);
    router.replace(ROUTES.AUTH.BARANGAY_FORM);
    return;
  } catch (error) {
    console.error('❌ Error navigating to barangay form:', error);
  }
};

export const navigateToNameAndContactForm = () => {
  try {
    // console.log("🧭 Navigating to name and contact form");
    // console.log("🧭 Route:", ROUTES.AUTH.NAME_AND_CONTACT_FORM);
    router.replace(ROUTES.AUTH.NAME_AND_CONTACT_FORM);
    return;
  } catch (error) {
    console.error('❌ Error navigating to name and contact form:', error);
  }
};

export const navigateToTabs = () => {
  try {
    // console.log("🧭 Navigating to tabs");
    // console.log("🧭 Route:", ROUTES.TABS);
    router.replace(ROUTES.TABS);
  } catch (error) {
    console.error('❌ Error navigating to tabs:', error);
  }
};

export const navigateToCreateStatus = () => {
  try {
    // console.log("🧭 Navigating to create status");
    // console.log("🧭 Route:", ROUTES.STATUS.CREATE);
    router.replace(ROUTES.STATUS.CREATE);
  } catch (error) {
    console.error('❌ Error navigating to create status:', error);
  }
};

export const navigateToNotification = () => {
  try {
    router.replace(ROUTES.NOTIFICATION);
  } catch (error) {
    console.error('❌ Error navigating to notification:', error);
  }
};

// status related navigation
export const navigateToStatusSettings = () => {
  try {
    // console.log("🧭 Navigating to status settings");
    // console.log("🧭 Route:", ROUTES.STATUS.SETTINGS);
    router.push(ROUTES.STATUS.SETTINGS);
    const sheet = require('react-native-actions-sheet').SheetManager;
    sheet.hide('status-more-action');
    sheet.hide('status-ellipsis-action');
  } catch (error) {
    console.error('❌ Error navigating to status settings:', error);
  }
};
