import { Button, HoveredButton } from '@/components/components/button/Button';
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { X } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

type ModalProps = {
  modalVisible: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'full' | 'xs';
  iconOnPress?: () => void;
  sizeIcon?: number;
  primaryText?: string;
  secondaryText?: string;
  primaryButtonOnPress?: () => void;
  secondaryButtonOnPress?: () => void;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  renderImage?: () => React.ReactNode;
  items?: Array<{ label: string; name?: string; onPress?: () => void }>;
  textAlign?: 'left' | 'center' | 'right';
  primaryButtonAction?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  primaryButtonVariant?: 'solid' | 'outline' | 'link';
};

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
  items = [],
  textAlign,
  primaryButtonAction = 'primary',
  primaryButtonVariant = 'link',
}: ModalProps) => {
  const { isDark } = useTheme();

  return (
    <Modal isOpen={modalVisible} onClose={onClose} size={size || 'md'}>
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <View></View>
          <ModalCloseButton>
            <X onPress={iconOnPress} size={sizeIcon || 20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody style={{ maxHeight: 500 }}>
          {renderImage && renderImage()}
          {items && items.length > 0 && (
            <ScrollView>
              {items.map((item, index) => (
                <HoveredButton key={index} onPress={item.onPress} style={styles.items}>
                  <Text size="md">{item.label}</Text>
                  {item.name && <Text size="sm">{item.name}</Text>}
                </HoveredButton>
              ))}
            </ScrollView>
          )}
          {primaryText && (
            <Text size="sm" style={{ textAlign: textAlign || 'center', marginBottom: 10 }}>
              {primaryText}
            </Text>
          )}
          {secondaryText && (
            <Text size="sm" style={{ textAlign: textAlign || 'center' }}>
              {secondaryText}
            </Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="link" width="fit" onPress={secondaryButtonOnPress}>
            <Text size="sm">{secondaryButtonText}</Text>
          </Button>
          <Button
            action={primaryButtonAction}
            variant={primaryButtonVariant}
            width="fit"
            onPress={primaryButtonOnPress}
            style={primaryButtonVariant === 'solid' ? { borderRadius: 20 } : undefined}
          >
            <Text size="sm" style={primaryButtonVariant === 'solid' ? { color: 'white' } : undefined}>
              {primaryButtonText}
            </Text>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const styles = StyleSheet.create({
  items: {
    padding: 20,
    height: 'auto',
    width: '100%',
    borderRadius: 8,
  },
});

export default index;
