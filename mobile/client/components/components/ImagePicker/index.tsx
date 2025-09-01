import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useActionSheet } from '../ActionSheet';
import { Button } from '../button/Button';

export const index = () => {
    const [image, setImage] = useState<string | null>(null);
    const { showActionSheet } = useActionSheet();

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
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Image source={imageSource} style={styles.placeholderImage} />
        )}
      </View>
      
      <Button 
        onPress={() => {}}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {image ? 'Change Photo' : 'Add Photo'}
        </Text>
      </Button>
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
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
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
    fontWeight: '600',
  },
})