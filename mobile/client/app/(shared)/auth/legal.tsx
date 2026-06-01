import { HeaderBackButton } from '@/components/components/button/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

const LegalScreen = () => {
  const { url, title } = useLocalSearchParams<{ url: string; title: string }>();
  const { isDark } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: title || 'Legal',
          headerLeft: () => <HeaderBackButton router={() => router.back()} />,
          headerStyle: {
             backgroundColor: isDark ? '#000' : '#fff',
          },
          headerTintColor: isDark ? '#fff' : '#000',
           headerShadowVisible: false,
        }}
      />
      <WebView 
        source={{ uri: url }} 
        style={{ flex: 1, backgroundColor: isDark ? '#000' : '#fff' }}
        startInLoadingState
      />
    </View>
  );
};

export default LegalScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
