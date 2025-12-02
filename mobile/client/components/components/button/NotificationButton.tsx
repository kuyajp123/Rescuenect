import { HoveredButton } from '@/components/components/button/Button';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Activity } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/components/button/Button';

const NotificationButton = () => {
  const { isDark } = useTheme();

  return (
    <HoveredButton style={styles.row} onPress={() => {}}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Activity color={isDark ? Colors.icons.dark : Colors.icons.light} />
        <Text size="sm" style={{ flexShrink: 1 }}>
          Test Button Test Button Test Button Test Button Test Button Test Button Test Button Test Button Test Button
          Test Button Test Button
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: 10,
        }}
      >
        <Button width='fit' style={{ padding: 10, marginTop: 10, marginRight: 10 }} onPress={() => {}}>
          <Text size="sm">Primary Button</Text>
        </Button>

        <HoveredButton
          style={{
            padding: 10,
            marginTop: 10,
            marginRight: 'auto',
          }}
          onPress={() => {}}
        >
          <Text size="sm">Secondary Button</Text>
        </HoveredButton>

        <Text emphasis="light" style={{ marginLeft: 'auto' }}>
          2:30 PM
        </Text>
      </View>
    </HoveredButton>
  );
};

export default NotificationButton;

const styles = StyleSheet.create({
  row: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
    marginLeft: 20,
  },
});
