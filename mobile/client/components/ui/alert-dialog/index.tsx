
import React from 'react';
import { Modal as RNModal, View } from 'react-native';

export const AlertDialog = ({ isOpen, onClose, children, ...props }: any) => {
  return (
    <RNModal visible={isOpen} transparent onRequestClose={onClose} animationType="fade" {...props}>
      <View className="flex-1 justify-center items-center bg-black/50 p-4">
        {children}
      </View>
    </RNModal>
  );
};
export const AlertDialogBackdrop = () => null;
export const AlertDialogContent = ({ children, className }: any) => <View className={`bg-white dark:bg-zinc-800 rounded-xl w-full p-4 ${className || ''}`}>{children}</View>;
export const AlertDialogHeader = ({ children, className }: any) => <View className={`flex-row justify-between items-center mb-4 ${className || ''}`}>{children}</View>;
export const AlertDialogBody = ({ children, className }: any) => <View className={className}>{children}</View>;
export const AlertDialogFooter = ({ children, className }: any) => <View className={`flex-row justify-end mt-4 gap-2 ${className || ''}`}>{children}</View>;
export const AlertDialogCloseButton = ({ onPress, children }: any) => null;
