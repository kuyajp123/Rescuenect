// import { handleGoogleSignIn } from "@/components/helper/auth";
import { handleGoogleSignIn } from '@/components/auth/auth';
import { LoadingOverlay } from "@/components/ui/loading/LoadingOverlay";
import { useLoading } from "@/hooks/useLoading";
import React from "react";
import { GoogleButtonComponent } from "./Button";

const GoogleButton = () => {
  const { isLoading, setIsLoading } = useLoading();

  const handleSignIn = async () => {
    console.log("🔘 GoogleButton: Button pressed, starting sign-in");
    console.log("🔘 GoogleButton: isLoading state:", isLoading);
    console.log("🔘 GoogleButton: Environment variables:", {
      webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL
    });
    
    try {
      await handleGoogleSignIn(setIsLoading);
    } catch (error) {
      console.error("🔘 GoogleButton: Error in handleSignIn:", error);
    }
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
