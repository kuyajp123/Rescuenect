import { create } from "zustand";
import { convertToE164Format } from '@/components/helper/commonHelpers';
import { storage } from "@/components/helper/storage";
import axios from 'axios';
import { auth } from "@/lib/firebaseConfig";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signInWithCustomToken } from "firebase/auth";
import { Alert } from "react-native";

type AuthUser = {
    isNewUser: boolean | null;
    userResponse: {  // ✅ Changed from 'user' to 'userResponse'
        firstName: string;
        lastName: string;
        barangay: string;
        phoneNumber: string;
    };
}

type BackendResponse = {
    isNewUser: boolean | null;
    userResponse: {
        firstName: string;
        lastName: string;
        barangay: string;
        phoneNumber: string;
    };
    setBackendResponse: (response: AuthUser) => void;
    resetResponse: () => void;
}

export const useBackendResponse = create<BackendResponse>((set) => ({
    isNewUser: null,
    userResponse: {
        firstName: '',
        lastName: '',
        barangay: '',
        phoneNumber: '',
    },
    setBackendResponse: (response) => set({ ...response }),
    resetResponse: () => set({ isNewUser: null, userResponse: { firstName: '', lastName: '', barangay: '', phoneNumber: '' } })
}));

export const handleGoogleSignIn = async (setLoading?: (loading: boolean) => void,) => {
    
    try {
        const { setBackendResponse } = useBackendResponse.getState();
        setLoading?.(true);

        // Check Google Play Services
        await GoogleSignin.hasPlayServices();
        
        // Perform Google Sign-In
        const userInfo = await GoogleSignin.signIn();
        
        const idToken = userInfo.data?.idToken;

        // Send to backend for verification and user creation/retrieval
        const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/auth/signin`, {
        idToken,
        user: {
            email: userInfo.data?.user.email,
            familyName: userInfo.data?.user.familyName,
            givenName: userInfo.data?.user.givenName,
            photo: userInfo.data?.user.photo,
        }
        });

        console.log("✅ Backend response received", JSON.stringify(response.data.user, null, 2));
        console.log("✅ isNewUser?", JSON.stringify(response.data.isNewUser, null, 2));

        // Store backend response BEFORE Firebase auth state changes
        setBackendResponse({
        isNewUser: response.data.isNewUser,
        userResponse: {  // ✅ Changed from 'user' to 'userResponse'
            firstName: response.data.user.firstName,  
            lastName: response.data.user.lastName,     
            barangay: response.data.user.barangay,     
            phoneNumber: response.data.user.phoneNumber 
        }
        });

        // Sign in to Firebase with custom token AFTER storing response
        await signInWithCustomToken(auth, response.data.token);
        await auth.currentUser?.reload();
        
        setLoading?.(false);
        // Note: Navigation for complete users will be handled by the auth state listener in firebaseAuth.ts

    } catch (error: any) {
        setLoading?.(false);
        
        console.error("❌ Google Sign-In error:", error);
        console.error("❌ Error details:", {
          message: error.message,
          code: error.code,
          toString: error.toString()
        });

        const isSignedIn = await GoogleSignin.getCurrentUser();

        // Sign out from Google
        if (isSignedIn) {
          console.log("🔄 User is signed in with Google, proceeding to sign out");
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
        }
        
        // Show user-friendly error
        Alert.alert(
          "Sign-In Error",
          `Failed to sign in: ${error.message || 'Unknown error'}`,
          [{ text: "OK" }]
        );
    }
}

export const handleLogout = async () => {
  try {
    // Clear user data from storage
    await storage.remove('@barangay');
    await storage.remove('@user');
    console.log("✅ Storage cleared");

    // Sign out from Firebase (this will trigger the auth state listener)
    await auth.signOut();
    console.log("✅ Firebase sign out successful");
    
    const isSignedIn = await GoogleSignin.getCurrentUser();

    // Sign out from Google
    if (isSignedIn) {
      console.log("🔄 User is signed in with Google, proceeding to sign out");
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    }

    console.log("✅ Google sign out successful");
    
    Alert.alert("Logged Out", "You have been logged out successfully.");
    
    // Note: Navigation will be handled by the auth state listener in firebaseAuth.ts
    
  } catch (error) {
    console.error("❌ Logout error:", error);
    
    // Even if there's an error, try to clear Google state
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    } catch (e) {
      console.error("Failed to sign out from Google:", e);
    }
    
    Alert.alert("Logout Error", "Failed to log out completely. Please try again.");
  }
};