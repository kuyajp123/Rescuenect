import { handleGoogleSignIn } from "@/components/helper/auth";
import { LoadingOverlay } from "@/components/ui/loading/LoadingOverlay";
import { useLoading } from "@/hooks/useLoading";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { GoogleButtonComponent } from "./Button";

const GoogleButton = () => {
  const router = useRouter();
  const { isLoading, setIsLoading } = useLoading();

  useEffect(() => {
    // Configure Google Sign-In
    console.log("🔧 Configuring Google Sign-In with:");
    
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
      offlineAccess: true, 
      hostedDomain: '', 
      forceCodeForRefreshToken: true,
    });
  }, []);

  const handleSignIn = async () => {
    await handleGoogleSignIn(setIsLoading);
  };

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
