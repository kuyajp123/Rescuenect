
import React from 'react';
import { Modal, View, TouchableOpacity, Text } from 'react-native';

export const Actionsheet = ({ isOpen, onClose, children, ...props }: any) => {
  return (
    <Modal visible={isOpen} transparent onRequestClose={onClose} animationType="slide" {...props}>
      <View className="flex-1 justify-end bg-black/50">
         {children}
      </View>
    </Modal>
  );
};
export const ActionsheetBackdrop = ({ onPress }: any) => <TouchableOpacity className="absolute inset-0" onPress={onPress} />;
export const ActionsheetContent = ({ children, className }: any) => <View className={`bg-white dark:bg-zinc-800 rounded-t-xl w-full p-4 pb-8 ${className || ''}`}>{children}</View>;
export const ActionsheetDragIndicatorWrapper = ({ children }: any) => <View className="items-center pb-2">{children}</View>;
export const ActionsheetDragIndicator = () => <View className="w-10 h-1 bg-gray-300 rounded-full" />;
export const ActionsheetItem = ({ onPress, children, className }: any) => <TouchableOpacity onPress={onPress} className={`py-3 ${className || ''}`}>{children}</TouchableOpacity>;
export const ActionsheetItemText = ({ children, className }: any) => <Text className={`text-base ${className || ''}`}>{children}</Text>;
export const ActionsheetIcon = ({ as: As, ...props }: any) => As ? <As {...props} /> : null;
