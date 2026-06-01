import { HoveredButton } from '@/components/components/button/Button';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Button as HeroButton } from 'heroui-native/button';
import { Dialog as HeroDialog } from 'heroui-native/dialog';
import React, { useMemo } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type DialogSize = 'sm' | 'md' | 'lg' | 'full' | 'xs';

type DialogItem = {
  label: string;
  name?: string;
  onPress?: () => void;
};

type DialogProps = {
  // Visibility (match old Modal API)
  modalVisible?: boolean;
  // Alias for easier migration from other modal libs
  isOpen?: boolean;

  onClose: () => void;

  // Layout
  size?: DialogSize;
  portalStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;

  // Header
  headerTitle?: string;
  iconOnPress?: () => void;
  sizeIcon?: number;
  showCloseButton?: boolean;

  // Content
  primaryText?: string;
  secondaryText?: string;
  textAlign?: 'left' | 'center' | 'right';
  renderImage?: () => React.ReactNode;
  items?: DialogItem[];
  children?: React.ReactNode;

  // Footer actions (match old Modal API)
  primaryButtonOnPress?: () => void;
  secondaryButtonOnPress?: () => void;
  primaryButtonDisabled?: boolean;
  secondaryButtonDisabled?: boolean;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  primaryButtonAction?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  primaryButtonVariant?:
    | 'solid'
    | 'link'
    | 'primary'
    | 'outline'
    | 'ghost'
    | 'secondary'
    | 'tertiary'
    | 'danger'
    | 'danger-soft';

  // HeroUI native Dialog.Content behavior
  isSwipeable?: boolean;
  closeOnOverlayPress?: boolean;
};

const getSizeStyle = (size: DialogSize): ViewStyle => {
  switch (size) {
    case 'xs':
      return { width: '75%', maxWidth: 360 };
    case 'sm':
      return { width: '82%', maxWidth: 420 };
    case 'md':
      return { width: '90%', maxWidth: 520 };
    case 'lg':
      return { width: '94%', maxWidth: 640 };
    case 'full':
      // Match the old Gluestack `Modal` behavior: full width, auto height
      return { width: 1000, maxWidth: '100%' };
    default:
      return { width: '90%', maxWidth: 520 };
  }
};

const Dialog = ({
  modalVisible,
  isOpen,
  onClose,
  size = 'md',
  portalStyle,
  contentStyle,
  headerTitle,
  iconOnPress,
  sizeIcon = 20,
  showCloseButton = true,
  primaryText,
  secondaryText,
  primaryButtonOnPress,
  secondaryButtonOnPress,
  primaryButtonDisabled = false,
  secondaryButtonDisabled = false,
  primaryButtonText,
  secondaryButtonText,
  renderImage,
  items = [],
  textAlign = 'center',
  primaryButtonAction = 'primary',
  primaryButtonVariant = 'ghost',
  children,
  isSwipeable = false,
  closeOnOverlayPress = true,
}: DialogProps) => {
  const { isDark } = useTheme();
  const open = isOpen ?? modalVisible ?? false;

  const sizeStyle = useMemo(() => getSizeStyle(size), [size]);
  const hasFooter = Boolean(primaryButtonText) || Boolean(secondaryButtonText);
  const heroPrimaryButtonVariant = useMemo(() => {
    if (primaryButtonVariant === 'solid') {
      if (primaryButtonAction === 'error') return 'danger';
      if (primaryButtonAction === 'secondary') return 'secondary';
      return 'primary';
    }

    if (primaryButtonVariant === 'link') {
      return 'ghost';
    }

    return primaryButtonVariant;
  }, [primaryButtonAction, primaryButtonVariant]);

  const itemsHeight = useMemo(() => {
    if (!items || items.length === 0) return 0;
    const rowHeight = 72;
    const minHeight = 140;
    const maxHeight = 360;
    return Math.min(maxHeight, Math.max(minHeight, items.length * rowHeight));
  }, [items]);

  return (
    <HeroDialog
      isOpen={open}
      onOpenChange={nextOpen => {
        if (!nextOpen) onClose();
      }}
    >
      <HeroDialog.Portal style={[styles.portal, portalStyle]}>
        <HeroDialog.Overlay isCloseOnPress={closeOnOverlayPress} />
        <HeroDialog.Content
          isSwipeable={isSwipeable}
          style={[
            styles.content,
            sizeStyle,
            {
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
              borderColor: isDark ? Colors.border.dark : Colors.border.light,
            },
            contentStyle,
          ]}
        >
          {showCloseButton && (
            <View style={styles.header}>
              <Text size="md">{headerTitle}</Text>
              <HeroDialog.Close
                variant="ghost"
                iconProps={{
                  size: sizeIcon,
                  color: isDark ? Colors.icons.dark : Colors.icons.light,
                }}
                onPress={iconOnPress}
              />
            </View>
          )}

          <View style={styles.body}>
            {renderImage && renderImage()}
            {children}

            {items && items.length > 0 && (
              <View style={[styles.itemsContainer, { height: itemsHeight }]}>
                <ScrollView showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
                  {items.map((item, idx) => (
                    <HoveredButton
                      key={`${item.label}-${item.name ?? ''}-${idx}`}
                      onPress={item.onPress}
                      style={[
                        styles.item,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                          borderColor: isDark ? Colors.border.dark : Colors.border.light,
                        },
                      ]}
                    >
                      <Text size="md">{item.label}</Text>
                      {item.name && (
                        <Text size="sm" style={{ opacity: 0.8 }}>
                          {item.name}
                        </Text>
                      )}
                    </HoveredButton>
                  ))}
                </ScrollView>
              </View>
            )}

            {primaryText && (
              <Text size="sm" style={{ textAlign, marginBottom: secondaryText ? 10 : 0, fontWeight: '600' }}>
                {primaryText}
              </Text>
            )}
            {secondaryText && (
              <Text size="sm" style={{ textAlign, opacity: 0.9 }}>
                {secondaryText}
              </Text>
            )}
          </View>

          {hasFooter && (
            <View style={styles.footer}>
              {secondaryButtonText && (
                <HeroButton
                  variant="secondary"
                  style={[styles.footerButton, { borderRadius: 8 }]}
                  isDisabled={secondaryButtonDisabled}
                  onPress={secondaryButtonDisabled ? undefined : secondaryButtonOnPress}
                >
                  <Text size="sm">{secondaryButtonText}</Text>
                </HeroButton>
              )}
              {primaryButtonText && (
                <HeroButton
                  variant={heroPrimaryButtonVariant}
                  isDisabled={primaryButtonDisabled}
                  onPress={primaryButtonDisabled ? undefined : primaryButtonOnPress}
                  style={styles.footerButton}
                >
                  <HeroButton.Label
                    style={['primary', 'danger'].includes(heroPrimaryButtonVariant) ? { color: 'white' } : undefined}
                  >
                    {primaryButtonText}
                  </HeroButton.Label>
                </HeroButton>
              )}
            </View>
          )}
        </HeroDialog.Content>
      </HeroDialog.Portal>
    </HeroDialog>
  );
};

const styles = StyleSheet.create({
  portal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  content: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    maxHeight: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  body: {
    maxHeight: 520,
  },
  itemsContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  item: {
    padding: 14,
    height: 'auto',
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  footer: {
    width: '100%',
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    borderRadius: 8,
  },
});

export default Dialog;
