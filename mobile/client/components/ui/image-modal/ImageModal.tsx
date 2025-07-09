import { Image } from '@/components/ui/image';
import { useTheme } from '@/contexts/ThemeContext';
import { X } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ImageModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  alt?: string;
}

const { width, height } = Dimensions.get('window');

export const ImageModal: React.FC<ImageModalProps> = ({
  visible,
  imageUri,
  onClose,
  alt = 'Full size image'
}) => {
  const { isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalOverlay}>
        {/* Background touchable to close */}
        <TouchableOpacity 
          style={styles.backgroundTouchable} 
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.modalContainer}>
            {/* Close button */}
            <TouchableOpacity 
              style={[
                styles.closeButton,
               
              ]} 
              onPress={onClose}
            >
              <X 
                size={24} 
                color={'#FFFFFF'} 
              />
            </TouchableOpacity>

            {/* Full size image */}
            <Image
              source={{ uri: imageUri }}
              alt={alt}
              style={styles.fullImage}
              resizeMode="contain"
              size='full'
            />
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  backgroundTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10000,
    padding: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
});
