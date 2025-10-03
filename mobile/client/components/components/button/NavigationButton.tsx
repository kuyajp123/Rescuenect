import { StyleSheet, View } from 'react-native';
import React from 'react';
import { HoveredButton } from './Button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

type Props = {
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  label: string;
  description?: string;
  onPress: () => void;
};

const NavigationButton = ({ iconLeft, iconRight, label, description, onPress }: Props) => {
  const { isDark } = useTheme();
  return (
    <View>
      <HoveredButton style={styles.buttons} onPress={onPress}>
        <View style={styles.menuButtonContent}>
          {iconLeft}
          <Text size="sm">{label}</Text>
        </View>
        <View>{iconRight ?? <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />}</View>
      </HoveredButton>
      {description && (
        <Text emphasis="light" size="xs" style={styles.description}>
          {description}
        </Text>
      )}
    </View>
  );
};

export default NavigationButton;

const styles = StyleSheet.create({
  buttons: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    width: '100%',
    // marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
  },
  description: {
    marginHorizontal: 20,
    width: '80%',
    marginBottom: 10,
  },
  menuButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
