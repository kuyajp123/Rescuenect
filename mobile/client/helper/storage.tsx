import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const storage = {
  // Save data (string or object) - Non-sensitive data
  async set(key: string, value: any) {
    try {
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  },

  // Get data (returns object if JSON, or string) - Non-sensitive data
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      }
      return null;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  },

  // Remove a specific key - Non-sensitive data
  async remove(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  },

  // Clear all data - Non-sensitive data
  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  },
};

// Secure storage for sensitive data (tokens, credentials, etc.)
export const secureStorage = {
  // Save sensitive data (encrypted)
  async setSecure(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error saving secure ${key}:`, error);
    }
  },

  // Get sensitive data (decrypted)
  async getSecure(key: string): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (error) {
      console.error(`Error reading secure ${key}:`, error);
      return null;
    }
  },

  // Remove sensitive data
  async removeSecure(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error removing secure ${key}:`, error);
    }
  },
};

// Unified storage interface with automatic routing
export const unifiedStorage = {
  // Define which keys should use secure storage
  SECURE_KEYS: [
    'authToken',
    'refreshToken',
    'googleAccessToken',
    'firebaseUid',
    'userCredentials',
    'apiKey',
    'biometricData',
    'userEmail',
  ],

  // Auto-route to appropriate storage based on key
  async set(key: string, value: any) {
    if (this.SECURE_KEYS.includes(key)) {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await secureStorage.setSecure(key, stringValue);
    } else {
      await storage.set(key, value);
    }
  },

  // Auto-route to appropriate storage based on key
  async get<T = any>(key: string): Promise<T | null> {
    if (this.SECURE_KEYS.includes(key)) {
      const value = await secureStorage.getSecure(key);
      if (value) {
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      }
      return null;
    } else {
      return await storage.get<T>(key);
    }
  },

  // Auto-route to appropriate storage based on key
  async remove(key: string) {
    if (this.SECURE_KEYS.includes(key)) {
      await secureStorage.removeSecure(key);
    } else {
      await storage.remove(key);
    }
  },

  // Clear all storage (both secure and regular)
  async clearAll() {
    await storage.clear();
    // Note: SecureStore doesn't have a clear all method,
    // you need to remove items individually
    for (const key of this.SECURE_KEYS) {
      await secureStorage.removeSecure(key);
    }
  },
};

// ============================================================================
// ENHANCED STORAGE HELPERS
// ============================================================================

/**
 * Enhanced storage helpers that work with both objects and primitive values
 * Uses unifiedStorage for automatic secure/regular storage routing
 */
export const storageHelpers = {
  /**
   * Get the entire stored data by key
   * @param key Storage key
   * @returns The stored data or null if not found
   */
  async getData<T = any>(key: string): Promise<T | null> {
    try {
      return await unifiedStorage.get<T>(key);
    } catch (error) {
      console.error(`Error getting data for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Save a full object or primitive value to storage
   * @param key Storage key
   * @param data Data to store (object, string, number, boolean, etc.)
   */
  async setData<T>(key: string, data: T): Promise<void> {
    try {
      await unifiedStorage.set(key, data);
    } catch (error) {
      console.error(`Error setting data for key "${key}":`, error);
    }
  },

  /**
   * Get a specific field from an object stored in storage
   * @param key Storage key
   * @param fieldPath Field path (supports nested: 'user.profile.name')
   * @returns The field value or null if not found
   */
  async getField<T = any>(key: string, fieldPath: string): Promise<T | null> {
    try {
      const data = await unifiedStorage.get(key);
      if (!data || typeof data !== 'object') {
        return null;
      }

      // Handle nested field paths (e.g., 'user.profile.name')
      const fields = fieldPath.split('.');
      let current = data;

      for (const field of fields) {
        if (current && typeof current === 'object' && field in current) {
          current = (current as any)[field];
        } else {
          return null;
        }
      }

      return current as T;
    } catch (error) {
      console.error(`Error getting field "${fieldPath}" from key "${key}":`, error);
      return null;
    }
  },

  /**
   * Update or add a specific field to a stored object
   * @param key Storage key
   * @param fieldPath Field path (supports nested: 'user.profile.name')
   * @param value New value for the field
   */
  async setField<T>(key: string, fieldPath: string, value: T): Promise<void> {
    try {
      let data = await unifiedStorage.get(key);

      // If no data exists or data is not an object, create new object
      if (!data || typeof data !== 'object') {
        data = {};
      } else {
        // Clone the existing data to ensure immutability
        data = JSON.parse(JSON.stringify(data));
      }

      // Handle nested field paths
      const fields = fieldPath.split('.');
      let current = data as any;

      // Navigate to the parent of the target field
      for (let i = 0; i < fields.length - 1; i++) {
        const field = fields[i];
        if (!current[field] || typeof current[field] !== 'object') {
          current[field] = {};
        }
        current = current[field];
      }

      // Set the final field value
      const finalField = fields[fields.length - 1];
      current[finalField] = value;

      await unifiedStorage.set(key, data);
    } catch (error) {
      console.error(`Error setting field "${fieldPath}" in key "${key}":`, error);
    }
  },

  /**
   * Update an existing field (alias for setField with explicit intent)
   * @param key Storage key
   * @param fieldPath Field path
   * @param value New value for the field
   */
  async updateField<T>(key: string, fieldPath: string, value: T): Promise<void> {
    return this.setField(key, fieldPath, value);
  },

  /**
   * Remove a specific field from a stored object
   * @param key Storage key
   * @param fieldPath Field path (supports nested: 'user.profile.name')
   */
  async removeField(key: string, fieldPath: string): Promise<void> {
    try {
      const data = await unifiedStorage.get(key);

      if (!data || typeof data !== 'object') {
        return; // Nothing to remove
      }

      // Clone the data to ensure immutability
      const clonedData = JSON.parse(JSON.stringify(data));
      const fields = fieldPath.split('.');
      let current = clonedData as any;

      // Navigate to the parent of the target field
      for (let i = 0; i < fields.length - 1; i++) {
        const field = fields[i];
        if (!current[field] || typeof current[field] !== 'object') {
          return; // Path doesn't exist
        }
        current = current[field];
      }

      // Remove the final field
      const finalField = fields[fields.length - 1];
      if (finalField in current) {
        delete current[finalField];
        await unifiedStorage.set(key, clonedData);
      }
    } catch (error) {
      console.error(`Error removing field "${fieldPath}" from key "${key}":`, error);
    }
  },

  /**
   * Completely delete an item from storage
   * @param key Storage key to remove
   */
  async removeData(key: string): Promise<void> {
    try {
      await unifiedStorage.remove(key);
    } catch (error) {
      console.error(`Error removing data for key "${key}":`, error);
    }
  },

  /**
   * Check if a key exists in storage
   * @param key Storage key
   * @returns true if key exists, false otherwise
   */
  async hasKey(key: string): Promise<boolean> {
    try {
      const data = await unifiedStorage.get(key);
      return data !== null;
    } catch (error) {
      console.error(`Error checking if key "${key}" exists:`, error);
      return false;
    }
  },

  /**
   * Get multiple keys at once
   * @param keys Array of storage keys
   * @returns Object with key-value pairs
   */
  async getMultiple<T = any>(keys: string[]): Promise<Record<string, T | null>> {
    const results: Record<string, T | null> = {};

    try {
      await Promise.all(
        keys.map(async key => {
          results[key] = await unifiedStorage.get<T>(key);
        })
      );
    } catch (error) {
      console.error('Error getting multiple keys:', error);
    }

    return results;
  },

  /**
   * Clear all storage (both secure and regular)
   */
  async clearAll(): Promise<void> {
    try {
      await unifiedStorage.clearAll();
    } catch (error) {
      console.error('Error clearing all storage:', error);
    }
  },
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

// === BASIC DATA OPERATIONS ===
// await storageHelpers.setData('user', { name: 'Paul', age: 25, profile: { bio: 'Developer' } });
// const user = await storageHelpers.getData('user');
// await storageHelpers.removeData('user');

// === FIELD OPERATIONS (Simple) ===
// await storageHelpers.setField('user', 'name', 'Paulo');
// const name = await storageHelpers.getField('user', 'name');
// await storageHelpers.updateField('user', 'age', 26);
// await storageHelpers.removeField('user', 'age');

// === FIELD OPERATIONS (Nested) ===
// await storageHelpers.setField('user', 'profile.bio', 'Senior Developer');
// const bio = await storageHelpers.getField('user', 'profile.bio');
// await storageHelpers.removeField('user', 'profile.bio');

// === UTILITY OPERATIONS ===
// const exists = await storageHelpers.hasKey('user');
// const multiple = await storageHelpers.getMultiple(['user', 'settings', 'theme']);
// await storageHelpers.clearAll();

// === SECURE DATA (Automatically routed based on key) ===
// await storageHelpers.setData('authToken', 'sensitive-token'); // → SecureStore
// await storageHelpers.setField('userCredentials', 'password', 'secret'); // → SecureStore
// const token = await storageHelpers.getData('authToken'); // ← SecureStore
