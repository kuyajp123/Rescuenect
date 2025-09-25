import { StyleSheet, View } from 'react-native'
import React from 'react'
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { Button } from "@/components/components/button/Button";
import { X } from "lucide-react-native";
import { Colors } from '@/constants/Colors';
import { Text } from '@/components/ui/text';
import { useTheme } from "@/contexts/ThemeContext";

type ModalProps = {
    modalVisible: boolean;
    onClose: () => void;
    size?: "sm" | "md" | "lg" | "full" | "xs";
    iconOnPress?: () => void;
    sizeIcon?: number;
    primaryText?: string;
    secondaryText?: string;
    primaryButtonOnPress?: () => void;
    secondaryButtonOnPress?: () => void;
    primaryButtonText?: string;
    secondaryButtonText?: string;
    renderImage?: () => React.ReactNode;
    textAlign?: "left" | "center" | "right";
}

const index = ({ 
    modalVisible, 
    onClose, 
    size, 
    iconOnPress, 
    sizeIcon, 
    primaryButtonOnPress,
    secondaryButtonOnPress, 
    primaryButtonText, 
    secondaryButtonText,
    renderImage, 
    primaryText, 
    secondaryText, 
    textAlign 
}: ModalProps) => {
    const { isDark } = useTheme();

  return (
    <Modal
        isOpen={modalVisible}
        onClose={onClose}
        size={size || "md"}
    >
        <ModalBackdrop />
        <ModalContent>
        <ModalHeader>
            <View></View>
            <ModalCloseButton>
            <X
                onPress={iconOnPress}
                size={sizeIcon || 20}
                color={isDark ? Colors.icons.dark : Colors.icons.light}
            />
            </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
            {renderImage && renderImage()}
            <Text bold size="sm" style={{ textAlign: textAlign || "center" }}>{primaryText}</Text>
            <Text style={{ textAlign: textAlign || "center" }}>{secondaryText}</Text>
        </ModalBody>
        <ModalFooter>
            <Button
                variant="link"
                width="fit"
                onPress={secondaryButtonOnPress}
            >
                <Text>{secondaryButtonText}</Text>
            </Button>
            <Button
                variant="link"
                width="fit"
                onPress={primaryButtonOnPress}
            >
                <Text>{primaryButtonText}</Text>
            </Button>
        </ModalFooter>
        </ModalContent>
    </Modal>
  )
}

export default index

