import { storageHelpers } from '@/helper/storage';
import type { ClientMapSettings } from './locationConfig';

//
//  --------------------------------------------
// KEYS

export const STORAGE_KEYS = {
  USER: '@user',
  APP_STATE: '@app_state',
  USER_SETTINGS: '@user_settings',
  SAVED_LOCATIONS: '@saved_locations',
  GUEST_PREFS: '@guest_prefs',
  NOTIFICATION_INDICATOR_SEEN_AT: '@notification_indicator_seen_at',
  HAS_SEEN_ONBOARDING: '@has_seen_onboarding',
  EVACUATION_CENTERS: '@evacuation_centers',
  CONTACTS_MAIN: '@contacts_main',
  ACCEPTED_TOS: '@accepted_tos',
};

//
//  --------------------------------------------
// USER RELATED STORAGE

export interface User {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  e164PhoneNumber?: string;
  barangay: string;
  fcmToken: string | null;
  clientId?: string;
  clientName?: string;
  clientStatus?: 'draft' | 'active' | 'inactive' | 'deletion_scheduled' | 'deleting' | 'deleted' | null;
  clientDeletionEffectiveAt?: unknown;
  clientDeletionStatus?: string | null;
  provinceCode?: string;
  provinceName?: string;
  municipalityCode?: string;
  municipalityName?: string;
  municipalityType?: 'municipality' | 'city';
  barangayCode?: string | null;
  barangayLabel?: string;
  weatherLocationKey?: string;
  weatherLatitude?: number | null;
  weatherLongitude?: number | null;
  mapSettings?: ClientMapSettings | null;
}

//
//  --------------------------------------------
// APP STATE RELATED STORAGE

export interface AppState {
  hasSignedOut?: boolean;
  isGuestMode?: boolean;
}

export const isEnabledStorageFlag = (value: unknown) => value === true || value === 'true';

export const getStoredGuestMode = async () => {
  const isGuestMode = await storageHelpers.getField<boolean | string>(STORAGE_KEYS.APP_STATE, 'isGuestMode');
  return isEnabledStorageFlag(isGuestMode);
};

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
    const isGuestMode = await storageHelpers.getField(STORAGE_KEYS.APP_STATE, 'isGuestMode');
    const expirationDuration = await storageHelpers.getField(
      STORAGE_KEYS.USER_SETTINGS,
      'status_settings.expirationDuration'
    );
    const shareLocation = await storageHelpers.getField(STORAGE_KEYS.USER_SETTINGS, 'status_settings.shareLocation');
    const shareContact = await storageHelpers.getField(STORAGE_KEYS.USER_SETTINGS, 'status_settings.shareContact');

    if (hasSignedOut === null || hasSignedOut === undefined) {
      await storageHelpers.setField(STORAGE_KEYS.APP_STATE, 'hasSignedOut', true);
    }
    if (isGuestMode === null || isGuestMode === undefined) {
      await storageHelpers.setField(STORAGE_KEYS.APP_STATE, 'isGuestMode', false);
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
