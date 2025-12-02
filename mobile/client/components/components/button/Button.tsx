import GoogleIMG from '@/assets/images/google/google.svg';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

type ButtonProps = {
  style?: object;
  onPress?: () => void;
  action?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  variant?: 'solid' | 'outline' | 'link';
  children?: React.ReactNode;
  className?: string;
  isDark?: boolean; // <--- optional theme flag for outline mode
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
  isDark = false,
  size = 'md',
  justify = 'center',
  width = 'full',
}: ButtonProps) => {
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
        actionStyle = 'bg-button-primary-default';
        break;
      case 'secondary':
        actionStyle = 'bg-button-secondary-default';
        break;
      case 'success':
        actionStyle = 'bg-button-success-default';
        break;
      case 'error':
        actionStyle = 'bg-button-error-default';
        break;
      case 'warning':
        actionStyle = 'bg-button-warning-default';
        break;
      default:
        actionStyle = 'bg-button-primary-default';
    }
  }

  // Variant styles
  let variantStyle = '';
  if (variant === 'outline') {
    variantStyle = `bg-transparent border-2 ${isDark ? 'border-text_dark-500' : 'border-zinc-400'}`;
  } else if (variant === 'link') {
    variantStyle = 'bg-transparent';
  }

  return (
    <Pressable
      className={`${baseStyle} ${actionStyle} ${variantStyle} ${className}`}
      style={style}
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
    >
      {children}
    </Pressable>
  );
};

// Predefined Button Components
export const OutlineButton = ({
  onPress,
  children,
  isDark = false,
  style,
  className = '',
}: {
  onPress?: () => void;
  children?: React.ReactNode;
  isDark?: boolean;
  style?: object;
  className?: string;
}) => (
  <Button variant="outline" onPress={onPress} isDark={isDark} style={style} className={className}>
    <Text className={'dark:text-text_dark-500 text-text_light-500'}>{children || 'Outline Button'}</Text>
  </Button>
);

export const PrimaryButton = ({
  onPress,
  children,
  style,
  className = '',
}: {
  onPress?: () => void;
  children?: React.ReactNode;
  style?: object;
  className?: string;
}) => (
  <Button action="primary" variant="solid" style={style} onPress={onPress} className={className}>
    <Text className="text-white font-semibold">{children || 'Primary Button'}</Text>
  </Button>
);

export const ErrorButton = ({
  onPress,
  children,
  style,
  className = '',
}: {
  onPress?: () => void;
  children?: React.ReactNode;
  style?: object;
  className?: string;
}) => (
  <Button action="error" variant="solid" style={style} onPress={onPress} className={className}>
    <Text className="text-white font-semibold">{children || 'Error Button'}</Text>
  </Button>
);

export const WarningButton = ({
  onPress,
  children,
  style,
  className = '',
}: {
  onPress?: () => void;
  children?: React.ReactNode;
  style?: object;
  className?: string;
}) => (
  <Button action="warning" variant="solid" style={style} onPress={onPress} className={className}>
    <Text className="text-white font-semibold">{children || 'Warning Button'}</Text>
  </Button>
);

export const SuccessButton = ({
  onPress,
  children,
  style,
  className = '',
  showIcon = true,
}: {
  onPress?: () => void;
  children?: React.ReactNode;
  style?: object;
  className?: string;
  showIcon?: boolean;
}) => (
  <Button
    action="success"
    variant="solid"
    style={{ borderRadius: 50, ...style }}
    onPress={onPress}
    className={className}
  >
    <Text className="text-white font-semibold">{children || 'Success Button'}</Text>
    {showIcon && <ChevronRight size={24} color={'#FFFFFF'} />}
  </Button>
);

export const CustomOutlineButton = ({
  onPress,
  children,
  color = Colors.semantic?.success || '#4CAF50',
  style,
  className = '',
  width = 'auto',
  variant = 'outline',
}: {
  onPress?: () => void;
  children?: React.ReactNode;
  color?: string;
  style?: object;
  className?: string;
  width?: 'full' | 'auto' | 'fit';
  variant?: 'solid' | 'outline' | 'link';
}) => (
  <Button
    variant={variant}
    style={{ borderColor: color, width: width, borderWidth: 2, ...style }}
    onPress={onPress}
    className={className}
  >
    <Text style={{ color }}>{children || 'Custom Button'}</Text>
  </Button>
);

export const HoveredButton = ({ children, style, onPress, onLongPress }: ButtonProps & { onLongPress?: () => void }) => {
  const { isDark } = useTheme();

  return (
    <Pressable
      android_ripple={{ color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
      onPress={onPress}
      style={[style]}
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
  style?: object;
}) => {
  const { isDark } = useTheme();

  const toggleButtonStyle = [
    {
      width: 50,
      height: 30,
      borderRadius: 15,
      justifyContent: 'center' as const,
      position: 'relative' as const,
      backgroundColor: isEnabled
        ? isDark
          ? Colors.brand.dark
          : Colors.brand.light
        : isDark
        ? Colors.border.dark
        : '#767577',
    },
    style,
  ];

  const toggleIndicatorStyle = {
    width: 26,
    height: 26,
    borderRadius: 13,
    position: 'absolute' as const,
    backgroundColor: isEnabled ? '#f4f3f4' : isDark ? Colors.text.dark : '#f4f3f4',
    transform: [{ translateX: isEnabled ? 22 : 2 }],
  };

  return (
    <Pressable style={toggleButtonStyle} onPress={onToggle} android_ripple={{ color: 'rgba(0,0,0,0.1)' }}>
      <View style={toggleIndicatorStyle} />
    </Pressable>
  );
};

export const GoogleButtonComponent = ({ onPress, disabled = false }: { onPress: () => void; disabled?: boolean }) => {
  return (
    <Button
      onPress={disabled ? undefined : onPress}
      style={{
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <GoogleIMG />
      <Text style={{ color: 'white' }}>{disabled ? 'Signing in...' : 'Sign in with Google'}</Text>
    </Button>
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
