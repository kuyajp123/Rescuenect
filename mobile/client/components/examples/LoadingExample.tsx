// Example usage of the loading components

import React from 'react';
import { View, Button } from 'react-native';
import { LoadingOverlay, InlineLoading } from '@/components/ui/loading';
import { useLoading } from '@/hooks/useLoading';

export const LoadingExample = () => {
  const { isLoading, setIsLoading } = useLoading();

  const simulateAsync = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      {/* Modal Overlay Loading */}
      <Button 
        title="Test Modal Loading" 
        onPress={simulateAsync} 
      />
      
      <LoadingOverlay 
        visible={isLoading} 
        message="Processing..." 
      />

      {/* Inline Loading */}
      <InlineLoading 
        visible={isLoading} 
        message="Loading inline..." 
      />
    </View>
  );
};
