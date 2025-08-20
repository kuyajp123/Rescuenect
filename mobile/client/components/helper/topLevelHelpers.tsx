import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export const loadSavedBarangay = async () => {
    try {
    const savedBarangay = await AsyncStorage.getItem('@barangay');
    const savedUser = await AsyncStorage.getItem('@user');

    if (savedBarangay && savedUser) {
        router.replace("(tabs)" as any);
        // router.replace("auth/signIn" as any);
    } else {
        router.replace("/auth/signIn" as any);
    }
    } catch (error) {
    console.error('Error loading saved barangay:', error);
    }
};