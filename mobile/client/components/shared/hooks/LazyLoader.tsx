import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, View } from 'react-native';

// Loading fallback component
const LoadingFallback = () => {
  const { isDark } = useTheme();
  
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
    }}>
      <ActivityIndicator 
        size="large" 
        color={isDark ? Colors.brand.dark : Colors.brand.light} 
      />
    </View>
  );
};

// HOC for lazy loading screens
export const withLazyLoading = <P extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>
) => {
  const LazyComponent = lazy(importFunc);
  
  return (props: P) => (
    <Suspense fallback={<LoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export default withLazyLoading;
