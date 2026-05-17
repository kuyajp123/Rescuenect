
import React from 'react';
import { Modal as RNModal, View, TouchableOpacity, Text } from 'react-native';

export const Modal = ({ isOpen, onClose, children, ...props }: any) => {
  return (
    <RNModal visible={isOpen} transparent onRequestClose={onClose} animationType="fade" {...props}>
      <View className="flex-1 justify-center items-center bg-black/50 p-4">
        {children}
      </View>
    </RNModal>
  );
};
export const ModalBackdrop = () => null;
export const ModalContent = ({ children, className }: any) => <View className={`bg-white dark:bg-zinc-800 rounded-xl w-full p-4 ${className || ''}`}>{children}</View>;
export const ModalHeader = ({ children, className }: any) => <View className={`flex-row justify-between items-center mb-4 ${className || ''}`}>{children}</View>;
export const ModalBody = ({ children, className }: any) => <View className={className}>{children}</View>;
export const ModalFooter = ({ children, className }: any) => <View className={`flex-row justify-end mt-4 gap-2 ${className || ''}`}>{children}</View>;
export const ModalCloseButton = ({ onPress, children }: any) => <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>;
