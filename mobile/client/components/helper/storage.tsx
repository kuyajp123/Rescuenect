import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  // Save data (string or object)
  async set(key: string, value: any) {
    try {
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  },

  // Get data (returns object if JSON, or string)
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

  // Remove a specific key
  async remove(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  },

  // Clear all data
  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  },
};

// usage example:

// Save object
// await storage.set('user', { name: 'Paul', barangay: 'San Roque' });

// Save string
// await storage.set('token', 'abc123');

// Get object
// const user = await storage.get<{ name: string; barangay: string }>('user');
// console.log(user?.name); // Paul

// Get string
// const token = await storage.get<string>('token');
// console.log(token); // abc123

// Remove specific
// await storage.remove('token');

// Clear all
// await storage.clear();
