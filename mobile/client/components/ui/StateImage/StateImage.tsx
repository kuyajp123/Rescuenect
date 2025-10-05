import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { getStateImage, StateImageType } from "@/config/stateImages";

interface StateImageProps {
  type: StateImageType;
  style?: StyleProp<ImageStyle>;
  onLoad?: () => void;
  onError?: (error: any) => void;
}

export const StateImage: React.FC<StateImageProps> = ({
  type,
  style,
  onLoad,
  onError,
}) => {
  const { isDark } = useTheme();
  const imageSource = getStateImage(type, isDark);

  return (
    <Image
      source={imageSource}
      style={[
        {
          width: "100%",
          height: 300,
          resizeMode: "contain",
        },
        style,
      ]}
      onLoad={onLoad}
      onError={onError}
    />
  );
};

export default StateImage;
