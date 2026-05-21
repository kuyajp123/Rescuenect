import Body from '@/components/ui/layout/Body';
import { MapView } from '@/components/ui/map/MapView';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const cityReports = () => {
  const insets = useSafeAreaInsets();

  return (
    <Body
      style={[
        styles.body,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <MapView />
    </Body>
  );
};

export default cityReports;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
});
