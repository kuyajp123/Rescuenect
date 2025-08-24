import { auth } from '@/lib/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';

export const loadSavedBarangay = async () => {
    try {
    const savedBarangay = await AsyncStorage.getItem('@barangay');
    const savedUser = await AsyncStorage.getItem('@user');

    if (savedBarangay && savedUser) {
        router.replace("(tabs)" as any);
        return;
    } else {
        router.replace("/auth/signIn" as any);
    }
    } catch (error) {
    console.error('Error loading saved barangay:', error);
    }
};

export const loadUserAuth = async () => {
    const user = auth.currentUser;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            router.replace("(tabs)" as any);
            return;
        } else {
            loadSavedBarangay();
        }
    });
}