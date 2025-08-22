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
    'userEmail'
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
  }
};

// Usage Examples:

// === REGULAR STORAGE (AsyncStorage) ===
// Save object
// await storage.set('user', { name: 'Paul', barangay: 'San Roque' });

// Save string
// await storage.set('theme', 'dark');

// Get object
// const user = await storage.get<{ name: string; barangay: string }>('user');
// console.log(user?.name); // Paul

// Get string
// const theme = await storage.get<string>('theme');
// console.log(theme); // dark

// === SECURE STORAGE (expo-secure-store) ===
// Save sensitive data
// await secureStorage.setSecure('authToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

// Get sensitive data
// const token = await secureStorage.getSecure('authToken');
// console.log(token); // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// === UNIFIED STORAGE (Auto-routing) ===
// Automatically routes to secure storage for sensitive keys
// await unifiedStorage.set('authToken', 'sensitive-token'); // → SecureStore
// await unifiedStorage.set('theme', 'dark'); // → AsyncStorage

// const token = await unifiedStorage.get('authToken'); // ← SecureStore
// const theme = await unifiedStorage.get('theme'); // ← AsyncStorage

// Remove specific items
// await unifiedStorage.remove('authToken'); // → SecureStore
// await unifiedStorage.remove('theme'); // → AsyncStorage

// Clear all storage
// await unifiedStorage.clearAll();
