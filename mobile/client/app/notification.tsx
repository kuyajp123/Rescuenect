import { HoveredButton } from '@/components/components/button/Button';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Activity } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const notification = () => {
  const { isDark } = useTheme();

  return (
    <Body style={{ padding: 0 }}>
      <Text size="3xl" bold style={styles.header}>
        Notification
      </Text>
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
            borderWidth: 1,
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: 10,
          }}
        >
          <HoveredButton style={{ padding: 10, marginTop: 10 }} onPress={() => {}}>
            <Text size="sm">Nested Button</Text>
          </HoveredButton>

          <HoveredButton
            style={{
              padding: 10,
              marginTop: 10,
              marginRight: 'auto', // ⭐ pushes the 3rd child to the right
            }}
            onPress={() => {}}
          >
            <Text size="sm">Nested Button</Text>
          </HoveredButton>

          <Text emphasis={'light'}>2:30 PM</Text>
        </View>
      </HoveredButton>
    </Body>
  );
};

export default notification;

const styles = StyleSheet.create({
  row: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
    marginLeft: 20,
  },
});
