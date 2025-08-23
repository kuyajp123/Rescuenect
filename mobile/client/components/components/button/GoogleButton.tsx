import { auth } from "@/lib/firebaseConfig";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signInWithCredential, signInWithCustomToken  } from "firebase/auth";
import React, { useEffect } from "react";
import { Alert } from "react-native";
import { GoogleButtonComponent } from "./Button";
import axios from 'axios'
import { useRouter } from "expo-router";
import { handleGoogleSignIn } from "@/components/helper/auth";
import { LoadingOverlay } from "@/components/ui/overlay/LoadingOverlay";
import { useLoading } from "@/hooks/useLoading";

const GoogleButton = () => {
  const router = useRouter();
  const { isLoading, setIsLoading } = useLoading();

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

  const handleSignIn = async () => {
    await handleGoogleSignIn(setIsLoading);
  };
  
  // const handleGoogleSignIn = async () => {
  //   try {
  //     await GoogleSignin.hasPlayServices();
      
  //     // Get the ID token from tokens
  //     const tokens = await GoogleSignin.getTokens();
  //     const idToken = tokens.idToken;
  //     const userInfo = await GoogleSignin.signIn();
      
  //     if (!idToken) {
  //       throw new Error("No ID token received from Google Sign-In");
  //     }


  //     try {
  //       const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/auth/signin`, {
  //         idToken,
  //         user: {
  //           email: userInfo.data?.user.email,
  //           familyName: userInfo.data?.user.familyName,
  //           givenName: userInfo.data?.user.givenName,
  //           name: userInfo.data?.user.name,
  //           photo: userInfo.data?.user.photo
  //         }
  //       })

  //       await signInWithCustomToken(auth, response.data.token);
  //       await auth.currentUser?.reload();
  //       router.replace('(tabs)/' as any);
  //     } catch (error) {
  //       console.error("❌ Backend authentication error:", error);
  //       throw new Error("Backend authentication failed");
  //     }
      
  //     // Store tokens securely
  //     // await unifiedStorage.set('authToken', idToken);
  //     // if (tokens.accessToken) {
  //     //   await unifiedStorage.set('googleAccessToken', tokens.accessToken);
  //     // }
      
  //     // Create Firebase credential
  //     // const credential = GoogleAuthProvider.credential(idToken);
      
  //     // // Sign in to Firebase
  //     // const firebaseUser = await signInWithCredential(auth, credential);
  //     // console.log("===========================================");
  //     // console.log("✅ Firebase Sign-In successful:", JSON.stringify(firebaseUser.user, null, 2));

  //     // Store user info securely
  //     // await unifiedStorage.set('firebaseUid', firebaseUser.user.uid);
  //     // await unifiedStorage.set('userEmail', firebaseUser.user.email || '');
      
  //     // Alert.alert(
  //     //   "Welcome!",
  //     //   `Hello ${firebaseUser.user.displayName || 'User'}! You've successfully signed in.`,
  //     //   [{ text: "Continue" }]
  //     // );
      
  //   } catch (error: any) {
  //     console.error("❌ Google Sign-In error:", error);
  //     console.error("❌ Error details:", {
  //       message: error.message,
  //       code: error.code,
  //       toString: error.toString()
  //     });
      
  //     // Show user-friendly error
  //     Alert.alert(
  //       "Sign-In Error",
  //       `Failed to sign in: ${error.message || 'Unknown error'}`,
  //       [{ text: "OK" }]
  //     );
  //   }
  // };

  return (
    <>
      <GoogleButtonComponent
        onPress={handleSignIn}
        disabled={isLoading}
      />
      <LoadingOverlay 
        visible={isLoading} 
        message="Signing in with Google..." 
      />
    </>
  );
};

export default GoogleButton;
