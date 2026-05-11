
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

export const Fab = ({ children, className, onPress, ...props }: any) => {
  return (
    <TouchableOpacity onPress={onPress} className={`absolute bottom-4 right-4 bg-blue-500 rounded-full p-4 shadow-lg flex-row items-center justify-center ${className || ''}`} {...props}>
      {children}
    </TouchableOpacity>
  );
};
export const FabLabel = ({ children, className }: any) => <Text className={`text-white ml-2 ${className || ''}`}>{children}</Text>;
export const FabIcon = ({ as: As, ...props }: any) => As ? <As {...props} /> : null;
