import { ImageModal } from '@/components/components/image-modal/ImageModal';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as Network from 'expo-network';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text as RNText, StyleSheet, View } from 'react-native';
import { useImagePickerStore } from '@/store/useImagePicker';
import { Button } from 'heroui-native/button';

interface CustomImagePickerProps {
  id?: string;
}

export const index = ({ id = 'image-picker-actionSheet' }: CustomImagePickerProps) => {
    const { image, setImage } = useImagePickerStore();
    const [isImageModalVisible, setIsImageModalVisible] = useState(false)
    const [isOptimizing, setIsOptimizing] = useState(false);
    
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

    const optimizeImageForUpload = async (asset: ImagePicker.ImagePickerAsset) => {
      const networkState = await Network.getNetworkStateAsync().catch(() => null);
      const isCellular = networkState?.type === Network.NetworkStateType.CELLULAR;

      const MAX_DIMENSION = isCellular ? 1080 : 1280; // Standard size for faster uploads
      const JPEG_QUALITY = isCellular ? 0.68 : 0.75; // Keep it recognizable while shrinking size

      const width = asset.width ?? 0;
      const height = asset.height ?? 0;
      const largestSide = Math.max(width, height);
      const fileSize = asset.fileSize ?? 0;

      // If it's already small enough, skip re-encoding to keep quality and save time.
      if (fileSize > 0 && fileSize <= 600 * 1024 && (largestSide === 0 || largestSide <= MAX_DIMENSION)) {
        return asset.uri;
      }

      // For faster uploads on slow networks, standardize to JPEG for picked images.
      // (We already early-return for small files above, so we avoid pointless re-encoding.)
      const format = SaveFormat.JPEG;
      const compress = JPEG_QUALITY;

      const context = ImageManipulator.manipulate(asset.uri);
      if (width > 0 && height > 0 && largestSide > MAX_DIMENSION) {
        context.resize(width >= height ? { width: MAX_DIMENSION } : { height: MAX_DIMENSION });
      }

      const imageRef = await context.renderAsync();
      const saved = await imageRef.saveAsync({ compress, format });
      return saved.uri;
    };

    const handlePickedAsset = async (asset: ImagePicker.ImagePickerAsset) => {
      setIsOptimizing(true);
      try {
        const optimizedUri = await optimizeImageForUpload(asset);
        setImage(optimizedUri);
      } catch (error) {
        console.warn('Failed to optimize image, using original:', error);
        setImage(asset.uri);
      } finally {
        setIsOptimizing(false);
        try {
          const sheet = require("react-native-actions-sheet").SheetManager;
          sheet.hide(id);
        } catch {}
      }
    };

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
      await handlePickedAsset(result.assets[0]);
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
      await handlePickedAsset(result.assets[0]);
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
        {isOptimizing && (
          <View style={[StyleSheet.absoluteFill, styles.optimizingOverlay]}>
            <ActivityIndicator size="small" color={isDark ? Colors.icons.dark : Colors.icons.light} />
            <Text emphasis="light" size="2xs">
              Optimizing image…
            </Text>
          </View>
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
        onPress={() => {
          if (isOptimizing) return;
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
  optimizingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
})
