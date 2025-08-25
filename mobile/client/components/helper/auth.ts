import { auth } from "@/lib/firebaseConfig";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signInWithCustomToken } from "firebase/auth";
import { Alert } from "react-native";
import axios from 'axios';
import { create } from "zustand";
import { storage } from "./storage";
import { convertToE164Format } from '@/components/helper/converter';

interface UserState {
  newUser: boolean | null;
  setNewUser: (user: boolean | null) => void;
  reset: () => void;
}

export const useNewUser = create<UserState>((set) => ({
  newUser: false,
  setNewUser: (user) => set({ newUser: user }),
  reset: () => set({ newUser: null })
}));

export const handleGoogleSignIn = async (
  setLoading?: (loading: boolean) => void,
  setNewUser?: (user: boolean | null) => void
) => {
  try {
    setLoading?.(true);
    
    // Check Google Play Services
    await GoogleSignin.hasPlayServices();
    console.log("✅ Google Play Services available");
    
    // Perform Google Sign-In
    const userInfo = await GoogleSignin.signIn();
    console.log("✅ Google Sign-In successful", { 
      email: userInfo.data?.user.email 
    });
    
    const idToken = userInfo.data?.idToken;
    if (!idToken) {
      throw new Error("No ID token received from Google Sign-In");
    }

    // Get existing user data from storage
    const asyncBarangay = await storage.get('@barangay');
    const asyncUser = await storage.get('@user');

    // Send to backend for verification and user creation/retrieval
    const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/auth/signin`, {
      idToken,
      user: {
        email: userInfo.data?.user.email,
        familyName: userInfo.data?.user.familyName,
        givenName: userInfo.data?.user.givenName,
        name: userInfo.data?.user.name,
        photo: userInfo.data?.user.photo,
        barangay: asyncBarangay ? asyncBarangay : null,
        phoneNumber: asyncUser?.phoneNumber ? asyncUser?.phoneNumber : null
      }
    });

    console.log("✅ Backend response received", { 
      isNewUser: response.data.isNewUser,
      hasUser: !!response.data?.user,
      userKeys: response.data?.user ? Object.keys(response.data.user) : [],
      hasBarangay: !!response.data?.barangay
    });

    // Set user state BEFORE Firebase auth to avoid race condition
    if (response.data.isNewUser) {
      console.log("🆕 Setting user as new user");
      setNewUser?.(true);
    } else {
      console.log("🔄 User is returning user");
      setNewUser?.(false);
      
      // Save user data for returning users - with null checks
      const userData = response.data?.user;
      if (userData) {
        console.log("💾 Saving user data to storage");
        
        // Only convert phone number if it exists
        let e164PhoneNumber = null;
        if (userData.phoneNumber) {
          try {
            e164PhoneNumber = convertToE164Format(userData.phoneNumber);
          } catch (phoneError) {
            console.warn("⚠️ Error converting phone number:", phoneError);
            e164PhoneNumber = userData.phoneNumber; // Fallback to original
          }
        }
        
        await storage.set('@user', {
          firstName: userData.firstName || '', 
          secondName: userData.secondName || '',
          phoneNumber: userData.phoneNumber || '',
          e164PhoneNumber: e164PhoneNumber || ''
        });
        
        if (response.data?.barangay) {
          await storage.set('@barangay', response.data.barangay);
        }
        
        console.log("✅ User data saved to storage");
      } else {
        console.warn("⚠️ No user data received from backend");
      }
    }

    // Sign in to Firebase with custom token
    await signInWithCustomToken(auth, response.data.token);
    await auth.currentUser?.reload();
    
    console.log("✅ Firebase authentication successful");
    setLoading?.(false);
    
    // Note: Navigation will be handled by the auth state listener in firebaseAuth.ts
    
  } catch (error: any) {
    setLoading?.(false);
    
    console.error("❌ Google Sign-In error:", error);
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      toString: error.toString()
    });
    
    // Show user-friendly error
    Alert.alert(
      "Sign-In Error",
      `Failed to sign in: ${error.message || 'Unknown error'}`,
      [{ text: "OK" }]
    );
  }
};

export const handleLogout = async () => {
  try {
    console.log("🚪 Starting logout process");
    
    // Clear user data from storage
    await storage.remove('@barangay');
    await storage.remove('@user');
    console.log("✅ Storage cleared");

    // Sign out from Firebase (this will trigger the auth state listener)
    await auth.signOut();
    console.log("✅ Firebase sign out successful");
    
    // Sign out from Google
    await GoogleSignin.signOut();
    console.log("✅ Google sign out successful");
    
    Alert.alert("Logged Out", "You have been logged out successfully.");
    
    // Note: Navigation will be handled by the auth state listener in firebaseAuth.ts
    
  } catch (error) {
    console.error("❌ Logout error:", error);
    
    // Even if there's an error, try to clear Google state
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      console.error("Failed to sign out from Google:", e);
    }
    
    Alert.alert("Logout Error", "Failed to log out completely. Please try again.");
  }
};
