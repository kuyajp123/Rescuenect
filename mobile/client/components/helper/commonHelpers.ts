import * as Location from 'expo-location';
import * as Network from "expo-network";
import { Alert } from 'react-native';
import * as Linking from "expo-linking";

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
    console.warn("Error checking internet:", error);
    return false;
  }
};


// Request location permission
export const requestLocationPermission = async (): Promise<boolean> => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === "granted";
    } catch (error) {
        console.warn("Error requesting location permission:", error);
        return false;
    }
};

// Get current position once
export const getCurrentPositionOnce = async (): Promise<[number, number] | null> => {
    try {
        console.log("Requesting location permission...");
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
            console.warn("Location permission not granted");
            Alert.alert(
                "Permission Required",
                "Please enable location in your settings to use this feature.",
                [
                { text: "Cancel", style: "cancel" },
                { text: "Open Settings", onPress: () => Linking.openSettings() }
                ]
            );
            return null;
        }

        console.log("Getting current position...");
        const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });
        
        const coords: [number, number] = [currentLocation.coords.longitude, currentLocation.coords.latitude];
        console.log("Current position obtained:", coords);
        return coords;
    } catch (error) {
        console.error("Error getting current location:", error);
        return null;
    }
}