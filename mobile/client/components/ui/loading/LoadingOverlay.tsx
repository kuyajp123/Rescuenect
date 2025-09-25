import React from 'react';
import { 
  View, 
  ActivityIndicator, 
  StyleSheet, 
  Modal, 
  Text 
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/components/button/Button'

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  width?: number | string;
  onRequestClose?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible, 
  message = "Signing in...", 
  width,
  onRequestClose
}) => {
  const { isDark } = useTheme();

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.container, 
          { width: width as any },
          { 
            backgroundColor: isDark 
              ? 'rgba(30, 30, 30, 0.9)' 
              : 'rgba(255, 255, 255, 0.9)' 
          }
        ]}>
          <ActivityIndicator 
            size="large" 
            color={isDark ? Colors.brand.dark : Colors.brand.light}
          />
          <Text style={[
            styles.message,
            { 
              color: isDark ? Colors.text.dark : Colors.text.light 
            }
          ]}>
            {message}
          </Text>
          {onRequestClose && (
            <View
                style={{ marginTop: 20, alignItems: 'flex-end' }}
            >
              <Button 
                onPress={onRequestClose}
                width='fit'
                variant='link'
              >
                <Text>Close</Text>
              </Button>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
    borderRadius: 15,
    // alignItems: 'center',
    // justifyContent: 'center',
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
