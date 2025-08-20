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
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      
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
    }
  };

  return (
    <GoogleButtonComponent
      onPress={handleGoogleSignIn}
    />
  );
};

export default GoogleButton;
