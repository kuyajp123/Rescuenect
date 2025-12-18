import { storageHelpers } from '@/components/helper/storage';

//
//  --------------------------------------------
// KEYS

export const STORAGE_KEYS = {
  USER: '@user',
  APP_STATE: '@app_state',
  USER_SETTINGS: '@user_settings',
  SAVED_LOCATIONS: '@saved_locations',
  GUEST_PREFS: '@guest_prefs',
  HAS_SEEN_ONBOARDING: '@has_seen_onboarding',
};

//
//  --------------------------------------------
// USER RELATED STORAGE

export interface User {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  barangay: string;
  fcmToken: string | null;
}

//
//  --------------------------------------------
// APP STATE RELATED STORAGE

export interface AppState {
  hasSignedOut?: boolean;
}

//
//  --------------------------------------------
// USER SETTINGS RELATED STORAGE

export interface UserSettings {
  font_size_preference: string;
  high_contrast_mode: boolean;
  theme_preference: string;
  mapStyle: string;
  status_settings: {
    expirationDuration: number; // in hours
    shareLocation: boolean;
    shareContact: boolean;
  };
}

//
//  --------------------------------------------
// CLEAR ALL DATA

// Function to clear all relevant data from storage
export const clearAllData = async () => {
  try {
    // Get all the key values from STORAGE_KEYS (e.g. ['@user', '@app_state', '@user_settings'])
    const keys = Object.values(STORAGE_KEYS);

    // Loop through them using for...of
    for (const key of keys) {
      await storageHelpers.removeData(key);
    }
  } catch (error) {
    console.error('Error clearing all data:', error);
  }
};

//
// ------------------------------------------------------------
// INITIALIZE STORAGE WITH DEFAULTS

// Function to initialize storage with default values if they don't exist
export const inititallizeAppStorage = async () => {
  try {
    const hasSignedOut = await storageHelpers.getField(STORAGE_KEYS.APP_STATE, 'hasSignedOut');
    const expirationDuration = await storageHelpers.getField(
      STORAGE_KEYS.USER_SETTINGS,
      'status_settings.expirationDuration'
    );
    const shareLocation = await storageHelpers.getField(STORAGE_KEYS.USER_SETTINGS, 'status_settings.shareLocation');
    const shareContact = await storageHelpers.getField(STORAGE_KEYS.USER_SETTINGS, 'status_settings.shareContact');

    if (hasSignedOut === null || hasSignedOut === undefined) {
      await storageHelpers.setField(STORAGE_KEYS.APP_STATE, 'hasSignedOut', true);
    }
    if (expirationDuration === null || expirationDuration === undefined) {
      await storageHelpers.setField(STORAGE_KEYS.USER_SETTINGS, 'status_settings.expirationDuration', 24);
    }
    if (shareLocation === null || shareLocation === undefined) {
      await storageHelpers.setField(STORAGE_KEYS.USER_SETTINGS, 'status_settings.shareLocation', true);
    }
    if (shareContact === null || shareContact === undefined) {
      await storageHelpers.setField(STORAGE_KEYS.USER_SETTINGS, 'status_settings.shareContact', true);
    }
    // console.log('✅ Storage initialized with default values where necessary.');
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};
