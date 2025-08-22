import { auth } from "@/lib/firebaseConfig";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import React, { useEffect } from "react";
import { Alert } from "react-native";
import { GoogleButtonComponent } from "./Button";

const GoogleButton = () => {
  useEffect(() => {
    // Configure Google Sign-In
    console.log("🔧 Configuring Google Sign-In with:");
    
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID, // From Firebase Console
      offlineAccess: true, // For refresh token
      hostedDomain: '', // Optional: specify a domain for G Suite
      forceCodeForRefreshToken: true, // Android only
    });
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      console.log("🚀 Starting Google Sign-In process...");
      
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();
      
      // Sign in and get user info
      console.log("📱 Attempting Google Sign-In...");
      const userInfo = await GoogleSignin.signIn();
      console.log("✅ Google Sign-In successful:", JSON.stringify(userInfo, null, 2));
      console.log("=========================================");
      
      // Get the ID token from tokens
      const tokens = await GoogleSignin.getTokens();
      console.log("tokens:", JSON.stringify(tokens, null, 2));
      const idToken = tokens.idToken;
      console.log("===========================================");
      console.log("idToken:", idToken);
      
      if (!idToken) {
        throw new Error("No ID token received from Google Sign-In");
      }
      
      // Store tokens securely
      // await unifiedStorage.set('authToken', idToken);
      // if (tokens.accessToken) {
      //   await unifiedStorage.set('googleAccessToken', tokens.accessToken);
      // }
      
      // Create Firebase credential
      const credential = GoogleAuthProvider.credential(idToken);
      
      // Sign in to Firebase
      const firebaseUser = await signInWithCredential(auth, credential);
      console.log("===========================================");
      console.log("✅ Firebase Sign-In successful:", JSON.stringify(firebaseUser.user, null, 2));

      // Store user info securely
      // await unifiedStorage.set('firebaseUid', firebaseUser.user.uid);
      // await unifiedStorage.set('userEmail', firebaseUser.user.email || '');
      
      // Alert.alert(
      //   "Welcome!",
      //   `Hello ${firebaseUser.user.displayName || 'User'}! You've successfully signed in.`,
      //   [{ text: "Continue" }]
      // );
      
    } catch (error: any) {
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

  return (
    <GoogleButtonComponent
      onPress={handleGoogleSignIn}
    />
  );
};

export default GoogleButton;
