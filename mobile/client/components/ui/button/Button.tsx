import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronRight } from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View, Animated } from 'react-native';

type ButtonProps = {
  style?: object;
  onPress?: () => void;
  action?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  variant?: 'solid' | 'outline' | 'link';
  children?: React.ReactNode;
  className?: string;
  isDark?: boolean; // <--- optional theme flag for outline mode
  context?: boolean;
};

export const Button = ({
  style,
  onPress,
  action = 'primary',
  variant = 'solid',
  children,
  className = '',
  isDark = false,
}: ButtonProps) => {
  let baseStyle = 'w-full px-4 py-3 flex-row items-center justify-center gap-1 rounded-lg font-semibold';

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
    variantStyle = `bg-transparent border-2 ${
      isDark ? 'border-text_dark-500' : 'border-zinc-400'
    }`;
  } else if (variant === 'link') {
    variantStyle = 'bg-transparent';
  }

  return (
    <TouchableOpacity
      className={`${baseStyle} ${actionStyle} ${variantStyle} ${className}`}
      style={style}
      onPress={onPress}
    >
      {children}
    </TouchableOpacity>
  );
};

// Predefined Button Components
export const OutlineButton = ({ 
  onPress, 
  children, 
  isDark = false,
  style,
  className = ''
}: { 
  onPress?: () => void; 
  children?: React.ReactNode; 
  isDark?: boolean;
  style?: object;
  className?: string;
}) => (
  <Button
    variant="outline"
    onPress={onPress}
    isDark={isDark}
    style={style}
    className={className}
  >
    <Text className={'dark:text-text_dark-500 text-text_light-500'}>
      {children || 'Outline Button'}
    </Text>
  </Button>
);

export const PrimaryButton = ({ 
  onPress, 
  children, 
  style,
  className = ''
}: { 
  onPress?: () => void; 
  children?: React.ReactNode; 
  style?: object;
  className?: string;
}) => (
  <Button
    action="primary"
    variant="solid"
    style={style}
    onPress={onPress}
    className={className}
  >
    <Text className="text-white font-semibold">
      {children || 'Primary Button'}
    </Text>
  </Button>
);

export const ErrorButton = ({ 
  onPress, 
  children, 
  style,
  className = ''
}: { 
  onPress?: () => void; 
  children?: React.ReactNode; 
  style?: object;
  className?: string;
}) => (
  <Button
    action="error"
    variant="solid"
    style={style}
    onPress={onPress}
    className={className}
  >
    <Text className="text-white font-semibold">
      {children || 'Error Button'}
    </Text>
  </Button>
);

export const WarningButton = ({ 
  onPress, 
  children, 
  style,
  className = ''
}: { 
  onPress?: () => void; 
  children?: React.ReactNode; 
  style?: object;
  className?: string;
}) => (
  <Button
    action="warning"
    variant="solid"
    style={style}
    onPress={onPress}
    className={className}
  >
    <Text className="text-white font-semibold">
      {children || 'Warning Button'}
    </Text>
  </Button>
);

export const SuccessButton = ({ 
  onPress, 
  children, 
  style,
  className = '',
  showIcon = true
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
    <Text className="text-white font-semibold">
      {children || 'Success Button'}
    </Text>
    {showIcon && <ChevronRight size={24} color={'#FFFFFF'} />}
  </Button>
);

export const CustomOutlineButton = ({ 
  onPress, 
  children, 
  color = Colors.semantic?.success || '#4CAF50',
  style,
  className = ''
}: { 
  onPress?: () => void; 
  children?: React.ReactNode; 
  color?: string;
  style?: object;
  className?: string;
}) => (
  <Button
    variant='outline'
    style={{ borderColor: color, borderWidth: 2, ...style }}
    onPress={onPress}
    className={className}
  >
    <Text style={{ color }}>
      {children || 'Custom Button'}
    </Text>
  </Button>
);

export const HoveredButton = ({ children, style, onPress }: ButtonProps) => {
  const { isDark } = useTheme();
    const [isPressed, setIsPressed] = useState(false);
    
    return (
      <TouchableOpacity 
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onPress={onPress}
        style={[
          {
            width: 'auto',
            backgroundColor: isPressed 
              ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)')
              : 'transparent',
          },
          style
        ]}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    );
  };

export const ToggleButton = ({ 
  isEnabled, 
  onToggle, 
  style 
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
        ? (isDark ? Colors.brand.dark : Colors.brand.light)
        : (isDark ? Colors.border.dark : '#767577'),
    },
    style
  ];

  const toggleIndicatorStyle = {
    width: 26,
    height: 26,
    borderRadius: 13,
    position: 'absolute' as const,
    backgroundColor: isEnabled
      ? '#f4f3f4'
      : (isDark ? Colors.text.dark : '#f4f3f4'),
    transform: [{ translateX: isEnabled ? 22 : 2 }],
  };

  return (
    <TouchableOpacity 
      style={toggleButtonStyle}
      onPress={onToggle}
      activeOpacity={1}
    >
      <View style={toggleIndicatorStyle} />
    </TouchableOpacity>
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