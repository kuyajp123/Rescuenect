import GoogleIMG from '@/assets/images/google/google.svg';
import { Colors, getButtonColor } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Button as HeroButton, Switch } from 'heroui-native';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

type ButtonProps = {
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  action?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  variant?: 'solid' | 'outline' | 'link';
  children?: React.ReactNode;
  className?: string;
  isDark?: boolean; // optional theme override
  context?: boolean;
  size?: 'md' | 'lg' | 'xl';
  justify?: 'start' | 'center' | 'end';
  width?: 'full' | 'auto' | 'fit';
};

export const Button = ({
  style,
  onPress,
  action = 'primary',
  variant = 'solid',
  children,
  className = '',
  isDark,
  size = 'lg',
  justify = 'center',
  width = 'full',
}: ButtonProps) => {
  const { isDark: themeIsDark } = useTheme();
  const resolvedIsDark = isDark ?? themeIsDark;

  let sizeStyle = 'py-3';
  if (size === 'lg') {
    sizeStyle = 'py-4';
  } else if (size === 'xl') {
    sizeStyle = 'py-6';
  }

  let widthStyle = '';
  if (width === 'auto') {
    widthStyle = 'w-auto';
  } else if (width === 'fit') {
    widthStyle = 'w-fit';
  } else if (width === 'full') {
    widthStyle = 'w-full';
  }

  let baseStyle = ` ${widthStyle} px-4 ${sizeStyle} flex-row items-center justify-${justify} gap-1 rounded-lg font-semibold`;

  // Action color styles (for solid variant)
  let actionStyle = '';
  if (variant === 'solid') {
    switch (action) {
      case 'primary':
        actionStyle = 'bg-button-primary-default active:bg-button-primary-pressed';
        break;
      case 'secondary':
        actionStyle = 'bg-button-secondary-default active:bg-button-secondary-pressed';
        break;
      case 'success':
        actionStyle = 'bg-button-success-default active:bg-button-success-pressed';
        break;
      case 'error':
        actionStyle = 'bg-button-error-default active:bg-button-error-pressed';
        break;
      case 'warning':
        actionStyle = 'bg-button-warning-default active:bg-button-warning-pressed';
        break;
      default:
        actionStyle = 'bg-button-primary-default active:bg-button-primary-pressed';
    }
  }

  // Variant styles
  let variantStyle = '';
  if (variant === 'outline') {
    variantStyle = `bg-transparent border-2 ${resolvedIsDark ? 'border-text_dark-500' : 'border-zinc-400'}`;
  } else if (variant === 'link') {
    variantStyle = 'bg-transparent';
  }

  const flattenedStyle = StyleSheet.flatten(style as any) as ViewStyle | undefined;
  const borderColor = (flattenedStyle as any)?.borderColor;

  // Press feedback: use highlight overlay tuned to our tokens.
  const highlightBackgroundColor =
    variant === 'solid'
      ? getButtonColor(action, 'pressed', resolvedIsDark)
      : typeof borderColor === 'string'
        ? borderColor
        : resolvedIsDark
          ? Colors.button.overlay.mediumDark
          : Colors.button.overlay.medium;

  const highlightOpacity = variant === 'solid' ? 1 : typeof borderColor === 'string' ? 0.2 : 1;

  return (
    <HeroButton
      // We provide our own colors via className + animation, so keep the underlying variant neutral.
      variant="ghost"
      feedbackVariant="scale-highlight"
      animation={{
        // Slightly stronger than the default for clearer press feedback
        scale: { value: 0.98 },
        highlight: {
          backgroundColor: { value: highlightBackgroundColor },
          opacity: { value: [0, highlightOpacity], timingConfig: { duration: 120 } },
        },
      }}
      className={`${baseStyle} ${actionStyle} ${variantStyle} ${className}`}
      style={style}
      onPress={onPress}
    >
      {children}
    </HeroButton>
  );
};

export const HoveredButton = ({
  children,
  style,
  onPress,
  onLongPress,
}: ButtonProps & { onLongPress?: () => void }) => {
  const { isDark } = useTheme();
  const pressedBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <Pressable
      android_ripple={{ color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
      onPress={onPress}
      style={({ pressed }) => [
        style as any,
        pressed && {
          backgroundColor: pressedBg,
        },
      ]}
      onLongPress={onLongPress}
    >
      {children}
    </Pressable>
  );
};

export const IconButton = ({
  children,
  onPress,
  style,
}: {
  children?: React.ReactNode;
  onPress: () => void;
  style?: object;
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const { isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        {
          borderRadius: 50,
          padding: 8,
          backgroundColor: isPressed ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)') : 'transparent',
          transform: [{ scale: isPressed ? 0.95 : 1 }],
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
};

export const ToggleButton = ({
  isEnabled,
  onToggle,
  style,
}: {
  isEnabled: boolean;
  onToggle: () => void;
  style?: StyleProp<ViewStyle>;
}) => {
  const { isDark } = useTheme();

  const offColor = isDark ? Colors.border.dark : '#767577';
  const onColor = isDark ? Colors.brand.dark : Colors.brand.light;

  return (
    <Switch
      isSelected={isEnabled}
      onSelectedChange={() => onToggle()}
      style={[
        {
          width: 50,
          height: 30,
        },
        style,
      ]}
      animation={{
        backgroundColor: { value: [offColor, onColor] },
        // More noticeable press feedback for small controls
        scale: { value: [1, 0.9], timingConfig: { duration: 120 } },
      }}
    >
      <Switch.Thumb
        animation={{
          left: { value: 2 },
          backgroundColor: { value: ['#f4f3f4', '#f4f3f4'] },
        }}
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
        }}
      />
    </Switch>
  );
};

export const GoogleButtonComponent = ({ onPress, disabled = false }: { onPress: () => void; disabled?: boolean }) => {
  return (
    <HeroButton
      onPress={disabled ? undefined : onPress}
      style={{
        opacity: disabled ? 0.6 : 1,
        width: '100%',
        borderRadius: 10,
      }}
    >
      <GoogleIMG />
      <Text style={{ color: 'white' }}>{disabled ? 'Signing in...' : 'Sign in with Google'}</Text>
    </HeroButton>
  );
};

// header back button
export const HeaderBackButton = ({ router }: { router: any }) => {
  const { isDark } = useTheme();

  return (
    <IconButton onPress={router}>
      <ChevronLeft size={24} color={isDark ? Colors.text.dark : Colors.text.light} />
    </IconButton>
  );
};

// Usage Examples:
/*
import { 
  PrimaryButton, 
  ErrorButton, 
  WarningButton, 
  SuccessButton, 
  OutlineButton, 
  CustomOutlineButton,
  ToggleButton,
  HoveredButton
} from '@/components/ui/button/Button';
import { Phone, Mail, Download, Heart, User, Settings } from 'lucide-react-native';

// Simple usage:
<PrimaryButton onPress={() => alert('Primary pressed!')}>
  Click Me
</PrimaryButton>

<ErrorButton onPress={() => alert('Error pressed!')}>
  Delete Item
</ErrorButton>

<WarningButton onPress={() => alert('Warning pressed!')}>
  Proceed with Caution
</WarningButton>

<SuccessButton onPress={() => alert('Success pressed!')} showIcon={false}>
  Complete Action
</SuccessButton>

<OutlineButton onPress={() => alert('Outline pressed!')} isDark={true}>
  Secondary Action
</OutlineButton>

<CustomOutlineButton 
  onPress={() => alert('Custom pressed!')} 
  color="#FF6B6B"
  style={{ marginTop: 20 }}
>
  Custom Color
</CustomOutlineButton>

// Toggle Button usage:
<ToggleButton 
  isEnabled={isToggleOn}
  onToggle={() => setIsToggleOn(!isToggleOn)}
/>

// Hovered Button usage:
<HoveredButton 
  onPress={() => alert('Hovered pressed!')}
  style={{ padding: 16 }}
>
  <Text>Hover Effect Button</Text>
</HoveredButton>
*/
