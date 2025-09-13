import { auth } from "@/lib/firebaseConfig";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signInWithCustomToken } from "firebase/auth";
import { Alert } from "react-native";
import axios from 'axios';
import { create } from "zustand";
import { storage } from "./storage";
import { convertToE164Format } from '@/components/helper/commonHelpers';
import { useAuth } from "@/components/store/useAuth";
import { navigateToBarangayForm, navigateToNameAndContactForm } from "./navigation";


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

    const hasBarangay = response.data?.user?.barangay;
    const hasPhoneNumber = response.data?.user?.phoneNumber;

    console.log("✅ Backend response received", { 
      isNewUser: response.data.isNewUser,
      hasUser: !!response.data?.user,
      userKeys: response.data?.user ? Object.keys(response.data.user) : [],
      hasBarangay: hasBarangay,
      hasPhoneNumber: hasPhoneNumber,
      barangayValue: response.data?.user?.barangay,
      phoneNumberValue: response.data?.user?.phoneNumber,
      firstName: response.data?.user?.firstName,
      secondName: response.data?.user?.lastName,
    });

    // Set user state BEFORE Firebase auth to avoid race condition
    
    // Sign in to Firebase with custom token FIRST
    await signInWithCustomToken(auth, response.data.token);
    await auth.currentUser?.reload();
    console.log("✅ Firebase authentication successful");
    
    // Now handle navigation and data saving AFTER authentication
    if (response.data.isNewUser) {
      // New users will be handled by the auth state listener
      console.log("🆕 New user - navigation will be handled by auth listener");
    } else {
      // Existing users - check what data they're missing

      // Save user data for returning users - with null checks
      const userData = response.data?.user;
      if (userData) {
        
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
          lastName: userData.lastName || '',
          phoneNumber: userData.phoneNumber || '',
          e164PhoneNumber: e164PhoneNumber || ''
        });
        
        if (response.data.user.barangay) {
          await storage.set('@barangay', response.data.user.barangay);
        }
        
        if (!hasBarangay) {
          console.log("❌ User is missing barangay information");
          navigateToBarangayForm();
          setLoading?.(false);
          return;
        }

        if (!hasPhoneNumber) {
          console.log("❌ User is missing phone number information");
          navigateToNameAndContactForm();
          setLoading?.(false);
          return;
        }
        
        console.log("✅ User data saved to storage");
      } else {
        console.warn("⚠️ No user data received from backend");
      }
    }
    
    if (response.data.isNewUser) {
      setNewUser?.(true);
    } else {
      setNewUser?.(false);
    }
    
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
      await GoogleSignin.signOut();
    } catch (e) {
      console.error("Failed to sign out from Google:", e);
    }
    
    Alert.alert("Logout Error", "Failed to log out completely. Please try again.");
  }
};
