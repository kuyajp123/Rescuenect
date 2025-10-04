import { storageHelpers } from '@/components/helper/storage';

//
//  --------------------------------------------
// KEYS

export const STORAGE_KEYS = {
  USER: '@user',
  APP_STATE: '@app_state',
  USER_SETTINGS: '@user_settings',
};

//
//  --------------------------------------------
// USER RELATED STORAGE

interface User {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  barangay: string;
}

// Function to get user info from storage
export const getUserInfo = async (): Promise<User | null> => {
  try {
    const user = await storageHelpers.getData<User>(STORAGE_KEYS.USER);
    return user;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

// Function to set user info in storage
export const setUserInfo = async (value: User) => {
  try {
    await storageHelpers.setData(STORAGE_KEYS.USER, value);
  } catch (error) {
    console.error('Error setting user info:', error);
  }
};

// Function to remove user info from storage
export const removeUserInfo = async () => {
  try {
    await storageHelpers.removeData(STORAGE_KEYS.USER);
  } catch (error) {
    console.error('Error removing user info:', error);
  }
};

//
//  --------------------------------------------
// APP STATE RELATED STORAGE

interface AppState {
  hasSignedOut?: boolean;
}

// Function to get app state from storage
export const getAppState = async (): Promise<AppState | null> => {
  try {
    const appState = await storageHelpers.getData<AppState>(STORAGE_KEYS.APP_STATE);
    return appState;
  } catch (error) {
    console.error('Error getting app state:', error);
    return null;
  }
};

// Function to set app state in storage
export const setAppState = async (value: AppState) => {
  try {
    await storageHelpers.setData(STORAGE_KEYS.APP_STATE, value);
  } catch (error) {
    console.error('Error setting app state:', error);
  }
};

// Function to remove app state from storage
export const removeAppState = async () => {
  try {
    await storageHelpers.removeData(STORAGE_KEYS.APP_STATE);
  } catch (error) {
    console.error('Error removing app state:', error);
  }
};

// Function to remove specific key from app state
export const removeAppStateKey = async (key: keyof AppState) => {
  try {
    await storageHelpers.removeField(STORAGE_KEYS.APP_STATE, key);
  } catch (error) {
    console.error('Error removing app state key:', error);
  }
};

//
//  --------------------------------------------
// USER SETTINGS RELATED STORAGE

interface UserSettings {
  font_size_preference: string;
  high_contrast_mode: boolean;
  theme_preference: string;
  mapStyle: string;
}

// Function to get user settings from storage
export const getUserSettings = async (): Promise<UserSettings | null> => {
  try {
    const userSettings = await storageHelpers.getData<UserSettings>(STORAGE_KEYS.USER_SETTINGS);
    return userSettings;
  } catch (error) {
    console.error('Error getting user settings:', error);
    return null;
  }
};

// Function to set user settings in storage
export const setUserSettings = async (value: UserSettings) => {
  try {
    await storageHelpers.setData(STORAGE_KEYS.USER_SETTINGS, value);
  } catch (error) {
    console.error('Error setting user settings:', error);
  }
};

//
//  --------------------------------------------
// CLEAR ALL DATA

// Function to clear all relevant data from storage
export const clearAllData = async () => {
  try {
    await storageHelpers.removeData(STORAGE_KEYS.USER);
    await storageHelpers.removeData(STORAGE_KEYS.APP_STATE);
    await storageHelpers.removeData(STORAGE_KEYS.USER_SETTINGS);
  } catch (error) {
    console.error('Error clearing all data:', error);
  }
};

//
//  --------------------------------------------
// ENHANCED FIELD-LEVEL OPERATIONS

/**
 * Get a specific user field (supports nested paths)
 * @param fieldPath Field path (e.g., 'firstName' or 'profile.bio')
 */
export const getUserField = async <T = any>(fieldPath: string): Promise<T | null> => {
  return await storageHelpers.getField<T>(STORAGE_KEYS.USER, fieldPath);
};

/**
 * Update a specific user field (supports nested paths)
 * @param fieldPath Field path (e.g., 'firstName' or 'profile.bio')
 * @param value New value
 */
export const setUserField = async <T>(fieldPath: string, value: T): Promise<void> => {
  await storageHelpers.setField(STORAGE_KEYS.USER, fieldPath, value);
};

/**
 * Remove a specific user field
 * @param fieldPath Field path to remove
 */
export const removeUserField = async (fieldPath: string): Promise<void> => {
  await storageHelpers.removeField(STORAGE_KEYS.USER, fieldPath);
};

/**
 * Get a specific app state field
 * @param fieldPath Field path (e.g., 'hasSignedOut')
 */
export const getAppStateField = async <T = any>(fieldPath: string): Promise<T | null> => {
  return await storageHelpers.getField<T>(STORAGE_KEYS.APP_STATE, fieldPath);
};

/**
 * Update a specific app state field
 * @param fieldPath Field path
 * @param value New value
 */
export const setAppStateField = async <T>(fieldPath: string, value: T): Promise<void> => {
  await storageHelpers.setField(STORAGE_KEYS.APP_STATE, fieldPath, value);
};

/**
 * Get a specific user settings field
 * @param fieldPath Field path (e.g., 'darkMode' or 'fontSize')
 */
export const getUserSettingsField = async <T = any>(fieldPath: string): Promise<T | null> => {
  return await storageHelpers.getField<T>(STORAGE_KEYS.USER_SETTINGS, fieldPath);
};

/**
 * Update a specific user settings field
 * @param fieldPath Field path
 * @param value New value
 */
export const setUserSettingsField = async <T>(fieldPath: string, value: T): Promise<void> => {
  await storageHelpers.setField(STORAGE_KEYS.USER_SETTINGS, fieldPath, value);
};

//
//  --------------------------------------------
// USAGE EXAMPLES FOR NEW HELPERS

// === USER FIELD OPERATIONS ===
// await setUserField('firstName', 'Paulo');
// await setUserField('profile.bio', 'Senior Developer');
// const name = await getUserField<string>('firstName');
// const bio = await getUserField<string>('profile.bio');
// await removeUserField('profile.bio');

// === APP STATE FIELD OPERATIONS ===
// await setAppStateField('hasSignedOut', true);
// const hasSignedOut = await getAppStateField<boolean>('hasSignedOut');

// === USER SETTINGS FIELD OPERATIONS ===
// await setUserSettingsField('darkMode', 'system');
// await setUserSettingsField('fontSize', 'large');
// const darkMode = await getUserSettingsField<string>('darkMode');
// const fontSize = await getUserSettingsField<string>('fontSize');
