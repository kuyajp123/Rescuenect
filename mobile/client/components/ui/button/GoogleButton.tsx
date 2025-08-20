import { auth } from "@/lib/firebaseConfig";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import React, { useEffect } from "react";
import { Alert } from "react-native";
import { GoogleButtonComponent } from "./Button";

const GoogleButton = () => {
  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID, // From Firebase Console
      offlineAccess: true, // For refresh token
      hostedDomain: '', // Optional: specify a domain for G Suite
      forceCodeForRefreshToken: true, // Android only
    });

    console.log("🔧 Google Sign-In configured");
    console.log("🔧 Web Client ID:", process.env.EXPO_PUBLIC_WEB_CLIENT_ID);
    console.log("🔧 Android Client ID:", process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID);
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      console.log("� Starting Google Sign-In...");
      
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();
      
      // Sign in and get user info
      const userInfo = await GoogleSignin.signIn();
      console.log("✅ Google Sign-In successful:", userInfo);
      
      // Get the ID token from tokens
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;
      
      if (!idToken) {
        throw new Error("No ID token received from Google Sign-In");
      }
      
      // Create Firebase credential
      const credential = GoogleAuthProvider.credential(idToken);
      
      // Sign in to Firebase
      const firebaseUser = await signInWithCredential(auth, credential);
      console.log("✅ Firebase Sign-In successful:", firebaseUser.user);
      
      Alert.alert(
        "Welcome!",
        `Hello ${firebaseUser.user.displayName || 'User'}! You've successfully signed in.`,
        [{ text: "Continue" }]
      );
      
    } catch (error: any) {
      console.error("❌ Google Sign-In error:", error);
      
      let errorMessage = "Authentication failed. Please try again.";
      
      if (error.code === 'sign_in_cancelled') {
        console.log("ℹ️ User cancelled Google Sign-In");
        return; // Don't show error for user cancellation
      } else if (error.code === 'sign_in_required') {
        errorMessage = "Sign-in required. Please try again.";
      } else if (error.code === 'play_services_not_available') {
        errorMessage = "Google Play Services not available on this device.";
      } else if (error.message?.includes("DEVELOPER_ERROR")) {
        errorMessage = "Configuration Error!\n\nThe SHA-1 certificate in Google Cloud Console doesn't match your app.\n\nPlease check the setup guide in docs/DEVELOPER_ERROR_FIX.md";
      } else if (error.message?.includes("access_blocked")) {
        errorMessage = "Access blocked. Please ensure:\n\n1. You're added as a test user in Google Cloud Console\n2. OAuth consent screen is properly configured\n3. App is in Testing mode";
      } else if (error.code === "auth/account-exists-with-different-credential") {
        errorMessage = "An account already exists with this email using a different sign-in method.";
      }
      
      Alert.alert("Sign-In Error", errorMessage);
    }
  };

  return (
    <GoogleButtonComponent
      onPress={handleGoogleSignIn}
    />
  );
};

export default GoogleButton;
