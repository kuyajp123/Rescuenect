import { getStateImage, StateImageType } from '@/config/stateImages';
import { useTheme } from '@/contexts/ThemeContext';
import { Image } from 'expo-image';
import React from 'react';
import { ImageStyle, StyleProp } from 'react-native';

interface StateImageProps {
  type: StateImageType;
  style?: StyleProp<ImageStyle>;
  onLoad?: () => void;
  onError?: (error: any) => void;
}

export const StateImage: React.FC<StateImageProps> = ({ type, style, onLoad, onError }) => {
  const { isDark } = useTheme();
  const imageSource = getStateImage(type, isDark);

  return (
    <Image
      source={imageSource}
      style={[
        {
          width: '100%',
          height: 300,
        },
        style,
      ]}
      contentFit="contain"
      onLoad={onLoad}
      onError={onError}
    />
  );
};

export default StateImage;
