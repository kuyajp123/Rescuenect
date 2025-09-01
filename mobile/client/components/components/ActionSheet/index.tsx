import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { Pressable, View } from 'react-native';
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";

export interface ActionSheetItemType {
  id: string;
  name: string;
  icon?: React.ReactNode;
  onPress: () => void;
}

interface ActionSheetProps {
  sheetId: string;
  payload?: {
    items: ActionSheetItemType[];
  };
}

export const MyActionSheet = React.forwardRef<ActionSheetRef, ActionSheetProps>((props, ref) => {
  const { isDark } = useTheme();
  const items = props.payload?.items || [];

  return (
    <ActionSheet
      id={props.sheetId}
      ref={ref}
      containerStyle={{
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        backgroundColor: isDark ? Colors.border.dark : Colors.border.light,
        paddingTop: 12,
        paddingHorizontal: 10,
        paddingBottom: 20,
      }}
    >
      {/* 🔹 Indicator Bar */}
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <View
          style={{
            width: 30,
            height: 4,
            borderRadius: 3,
            backgroundColor: isDark ? Colors.background.light : Colors.background.dark,
          }}
        />
      </View>

      <View>
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              item.onPress();
              if (ref && 'current' in ref) {
                ref.current?.hide();
              }
            }}
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
            style={{
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {item.icon}
            <Text size='sm'>{item.name}</Text>
          </Pressable>
        ))}
      </View>
    </ActionSheet>
  );
});

export default MyActionSheet;