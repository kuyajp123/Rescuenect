import { OverlayProvider } from '@gluestack-ui/overlay';
import { ToastProvider } from '@gluestack-ui/toast';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { View, ViewProps } from 'react-native';
import { config } from './config';

export type ModeType = 'light' | 'dark' | 'system';

export function GluestackUIProvider({
  mode = 'light',
  ...props
}: {
  mode?: ModeType;
  children?: React.ReactNode;
  style?: ViewProps['style'];
}) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [isMounted, setIsMounted] = useState(false);

  // Track mount status to prevent state updates during unmount
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    // Only update if component is mounted and mode actually changed
    if (isMounted && colorScheme !== mode) {
      // Use a microtask to defer the state update
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          setColorScheme(mode);
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isMounted]);

  return (
    <View
      style={[
        config[colorScheme!],
        { flex: 1, height: '100%', width: '100%' },
        props.style,
      ]}
    >
      <OverlayProvider>
        <ToastProvider>{props.children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
