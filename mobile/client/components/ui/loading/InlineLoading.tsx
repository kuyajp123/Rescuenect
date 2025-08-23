import React from 'react';
import { 
  View, 
  ActivityIndicator, 
  StyleSheet,
  Text 
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface InlineLoadingProps {
  visible: boolean;
  message?: string;
  size?: 'small' | 'large';
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({ 
  visible, 
  message = "Loading...",
  size = 'small'
}) => {
  const { isDark } = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <ActivityIndicator 
        size={size} 
        color={isDark ? Colors.brand.dark : Colors.brand.light}
      />
      {message && (
        <Text style={[
          styles.message,
          { 
            color: isDark ? Colors.text.dark : Colors.text.light 
          }
        ]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  message: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
  },
});
