import { auth } from "@/lib/firebaseConfig"; // your Firebase config
import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import React, { useEffect } from "react";
import { Alert } from "react-native";
import { GoogleButtonComponent } from "./Button"; // your custom button

WebBrowser.maybeCompleteAuthSession();

const GoogleButton = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID, // from Firebase
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID, // for Expo Go / web testing
    redirectUri: makeRedirectUri({
      scheme: "client", // matches app.config.ts
    }),
    scopes: ["openid", "profile", "email"],
  });

  useEffect(() => {
    // Debug environment variables
    console.log("🔧 Android Client ID:", process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID);
    console.log("🔧 Web Client ID:", process.env.EXPO_PUBLIC_WEB_CLIENT_ID);
    console.log("🔧 Redirect URI:", makeRedirectUri({ scheme: "client" }));

    if (response?.type === "success") {
      console.log("✅ Google OAuth Success:", response.params);
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);

      signInWithCredential(auth, credential)
        .then((userCredential) => {
          console.log("✅ Google Sign-In success:", userCredential.user);
          Alert.alert("Welcome!", `Hello ${userCredential.user.displayName}!`);
        })
        .catch((error) => {
          console.error("❌ Firebase Sign-In error:", error);
          Alert.alert("Sign-In Error", error.message);
        });
    } else if (response?.type === "error") {
      console.error("❌ Google OAuth Error:", response.error);
      
      let errorMessage = "Authentication failed. Please try again.";
      
      if (response.error?.message?.includes("access_blocked")) {
        errorMessage = "Access blocked. Please ensure:\n\n1. You're added as a test user in Google Cloud Console\n2. OAuth consent screen is properly configured\n3. App is in Testing mode";
      }
      
      Alert.alert("Google Sign-In Error", errorMessage);
    } else if (response?.type === "cancel") {
      console.log("ℹ️ Google Sign-In cancelled");
    }
  }, [response]);

  const handleSignIn = () => {
    if (!request) {
      Alert.alert("Loading", "Google Sign-In is initializing. Please wait a moment.");
      return;
    }
    
    console.log("🚀 Starting Google Sign-In...");
    promptAsync();
  };

  return (
    <GoogleButtonComponent
      onPress={handleSignIn}
    />
  );
};

export default GoogleButton;
