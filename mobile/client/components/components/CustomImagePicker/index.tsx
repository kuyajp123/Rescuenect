import { ImageModal } from '@/components/components/image-modal/ImageModal';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, Pressable, Text as RNText, StyleSheet, View } from 'react-native';
import { useImagePickerStore } from '@/components/store/useImagePicker';
import { Button } from '../button/Button';

interface CustomImagePickerProps {
  id?: string;
}

export const index = ({ id = 'image-picker-actionSheet' }: CustomImagePickerProps) => {
    const { image, setImage } = useImagePickerStore();
    const [isImageModalVisible, setIsImageModalVisible] = useState(false)
    
    const handleImagePress = () => {
      setIsImageModalVisible(true)
    }
    const handleCloseModal = () => {
      setIsImageModalVisible(false)
    }

    const { isDark } = useTheme();
    const imageSource = isDark 
        ? require('@/assets/images/states/noImage-dark.png') 
        : require('@/assets/images/states/noImage-light.png');

    const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      alert("Permission to access gallery is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      const sheet = require("react-native-actions-sheet").SheetManager;
      sheet.hide(id);
      console.log(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      alert("Permission to access camera is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      const sheet = require("react-native-actions-sheet").SheetManager;
      sheet.hide(id);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {image ? (
          <Pressable onPress={handleImagePress}>
            <Image source={{ uri: image }} style={styles.image} />
          </Pressable>
        ) : (
          <Image source={imageSource} style={styles.placeholderImage} />
        )}
      </View>

      {image && (
        <View style={styles.removeButtonContainer}>
          <Pressable style={styles.removeButton} onPress={() => setImage(null)}>
            <Text emphasis='light' size='2xs'>Remove Photo</Text>
          </Pressable>
        </View>
      )}
      
      <Button 
        width='fit'
        onPress={() => {
          console.log('Button pressed, trying to show ActionSheet with id:', id);
          const sheet = require("react-native-actions-sheet").SheetManager;
          sheet.show(id, {
            payload: {
              items: [
                {
                  id: 'camera',
                  name: 'Take Photo',
                  icon: <Camera size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />,
                  onPress: takePhoto,
                },
                {
                  id: 'gallery',
                  name: 'Choose from Gallery',
                  icon: <ImageIcon size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />,
                  onPress: pickImage,
                },
              ]
            }
          });
        }}
        style={styles.button}
      >
        <RNText style={styles.buttonText}>
          {image ? 'Change Photo' : 'Add Photo'}
        </RNText>
      </Button>
      {/* Image Modal */}
        {image && (
          <ImageModal
            visible={isImageModalVisible}
            imageUri={image}
            onClose={handleCloseModal}
          />
        )}  
    </View>
  )
}

export default index

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
  },
  removeButtonContainer: {
    width: '100%',
  },
  removeButton: {
    alignSelf: 'flex-end'
  },
})