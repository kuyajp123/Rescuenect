import { handleGoogleSignIn } from '@/auth/auth';
import { LoadingOverlay } from '@/components/ui/loading/LoadingOverlay';
import { useLoading } from '@/hooks/useLoading';
import React from 'react';
import { GoogleButtonComponent } from './Button';

const GoogleButton = () => {
  const { isLoading, setIsLoading } = useLoading();

  const handleSignIn = async () => {
    try {
      await handleGoogleSignIn(setIsLoading);
    } catch (error) {
      console.error('🔘 GoogleButton: Error in handleSignIn:', error);
    }
  };

  return (
    <>
      <GoogleButtonComponent onPress={handleSignIn} disabled={isLoading} />
      <LoadingOverlay visible={isLoading} message="Signing in with Google..." />
    </>
  );
};

export default GoogleButton;
