import { Category } from '@/types/components';
import { differenceInHours, formatDistanceToNow } from 'date-fns';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { Alert } from 'react-native';

// Convert contact number to E.164 format (+63xxxxxxxxxx)
export const convertToE164Format = (contactNumber: string): string => {
  const numericOnly = contactNumber.replace(/\D/g, '');
  if (numericOnly.length === 11 && numericOnly.startsWith('09')) {
    return `+63${numericOnly.slice(1)}`;
  } else if (numericOnly.length === 10 && numericOnly.startsWith('9')) {
    return `+639${numericOnly}`;
  } else if (numericOnly.length === 11 && numericOnly.startsWith('63')) {
    return `+${numericOnly}`;
  }
  return `+639${numericOnly}`;
};

// Format contact number with dashes and limit to 11 digits
export const formatContactNumber = (text: string): string => {
  const numericOnly = text.replace(/\D/g, '');
  const limitedNumbers = numericOnly.slice(0, 11);
  if (limitedNumbers.length <= 4) {
    return limitedNumbers;
  } else if (limitedNumbers.length <= 7) {
    return `${limitedNumbers.slice(0, 4)}-${limitedNumbers.slice(4)}`;
  } else {
    return `${limitedNumbers.slice(0, 4)}-${limitedNumbers.slice(4, 7)}-${limitedNumbers.slice(7)}`;
  }
};

// Validate contact number (must be exactly 11 digits)
export const isValidContactNumber = (contactNumber: string): boolean => {
  const numericOnly = contactNumber.replace(/\D/g, '');
  return numericOnly.length === 11 && numericOnly.startsWith('09');
};

// Format name with proper capitalization
export const formatName = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// check network connection
export const checkInternetConnectionOnce = async (): Promise<boolean> => {
  try {
    const state = await Network.getNetworkStateAsync();
    return !!(state.isConnected && state.isInternetReachable);
  } catch (error) {
    console.warn('Error checking internet:', error);
    return false;
  }
};

// Request location permission
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Error requesting location permission:', error);
    return false;
  }
};

// Get current position once
export const getCurrentPositionOnce = async (): Promise<[number, number] | null> => {
  try {
    console.log('Requesting location permission...');
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.warn('Location permission not granted');
      Alert.alert('Permission Required', 'Please enable location in your settings to use this feature.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]);
      return null;
    }

    console.log('Getting current position...');
    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const coords: [number, number] = [currentLocation.coords.longitude, currentLocation.coords.latitude];
    console.log('Current position obtained:', coords);
    return coords;
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

// Helper function to convert various date formats to Date object
const convertToDate = (dateValue: any): Date | null => {
  if (!dateValue) {
    return null;
  }

  if (dateValue instanceof Date) {
    return dateValue;
  }

  // Handle Firestore Timestamp with toDate method
  if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }

  // Handle Firestore Timestamp object format { seconds: number, nanoseconds: number }
  if (dateValue?.seconds && typeof dateValue.seconds === 'number') {
    return new Date(dateValue.seconds * 1000);
  }

  // Handle Firestore Timestamp object format with underscores { _seconds: number, _nanoseconds: number }
  if (dateValue?._seconds && typeof dateValue._seconds === 'number') {
    return new Date(dateValue._seconds * 1000);
  }

  // Handle string dates
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // Handle numeric timestamps (milliseconds)
  if (typeof dateValue === 'number') {
    return new Date(dateValue);
  }

  return null;
};

// Helper function to format time since creation
export const formatTimeSince = (dateValue: any): string => {
  const date = convertToDate(dateValue);
  if (!date) {
    return 'Unknown';
  }

  try {
    const now = new Date();

    // Check if the date is in the future
    if (date > now) {
      // For future dates, show "in X minutes/hours" or the actual date
      const diffInHours = differenceInHours(date, now);
      if (diffInHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true, includeSeconds: true }).replace(/^about\s+/, '');
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
      }
    }

    // For past dates
    const diffInHours = differenceInHours(now, date);

    // If more than 24 hours (1 day), show the actual date
    if (diffInHours >= 24) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }

    // For recent times (less than 24 hours), show relative time
    const relativeTime = formatDistanceToNow(date, { addSuffix: true, includeSeconds: true }).replace(/^about\s+/, '');

    // If it's showing seconds, display "Just now" instead
    if (relativeTime.includes('second')) {
      return 'Just now';
    }

    return relativeTime;
  } catch (error) {
    return 'Unknown';
  }
};

// address filter
export const cleanAddress = (fullAddress: string) => {
  // Split the address by commas and filter out unwanted parts
  const addressParts = fullAddress.split(',').map(part => part.trim());

  // Filter out postcode, region codes, and country
  const filteredParts = addressParts.filter(part => {
    // Remove parts that look like postcodes (numbers)
    if (/^\d+$/.test(part)) return false;
    // Remove common region identifiers
    if (part.includes('Calabarzon') || part.includes('Philippines')) return false;
    // Remove "unnamed road" (case insensitive)
    if (part.toLowerCase().includes('unnamed road')) return false;
    // Remove country codes and similar
    if (part.length <= 4 && /^[A-Z]+$/.test(part)) return false;
    return true;
  });

  return filteredParts.join(', ');
};

export const normalizeCategory = (category: any): Category[] => {
  if (Array.isArray(category)) {
    return category as Category[];
  } else if (typeof category === 'string') {
    // Check if it's a JSON string
    try {
      const parsed = JSON.parse(category);
      if (Array.isArray(parsed)) {
        return parsed as Category[];
      }
    } catch {
      // Not a JSON string, return as single-element array
      return [category as Category];
    }
  }
  return [];
};

// Format to Capitalized teh first letter of each word
export const formatToCapitalized = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
