import React from 'react';
import { TouchableOpacity } from 'react-native';

type ButtonProps = {
  style?: object;
  onPress?: () => void;
  action?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  variant?: 'solid' | 'outline' | 'link';
  children?: React.ReactNode;
  className?: string;
  isDark?: boolean; // <--- optional theme flag for outline mode
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

// example usage
{/* <Button
  variant="outline"

  onPress={() => alert('Outline Pressed')}
>
  <Text
    className={'dark:text-text_dark-500 text-text_light-500'}
  >
    Outline Button
  </Text>
</Button>

<Button
  action="primary"
  variant="solid"
  style={{ marginTop: 20 }}
  onPress={() => alert('Button Pressed')}
>
  <Text className="text-white font-semibold">Solid Button</Text>
</Button>

<Button
  action="error"
  variant="solid"
  style={{ marginTop: 20 }}
  onPress={() => alert('Button Pressed')}
>
  <Text className="text-white font-semibold">Solid Button</Text>
</Button>

<Button
  action="warning"
  variant="solid"
  style={{ marginTop: 20 }}
  onPress={() => alert('Button Pressed')}
>
  <Text className="text-white font-semibold">Solid Button</Text>
</Button>

<Button
  action="success"
  variant="solid"
  style={{ marginTop: 20, borderRadius: 50 }}
  onPress={() => alert('Button Pressed')}
>
  <Text className="text-white font-semibold">Solid Button</Text>
  <ChevronRight size={24} color={'#FFFFFF'} />
</Button> 

<Button
  variant='outline'
  style={{ marginTop: 20, borderColor: Colors.semantic.success, borderWidth: 2 }}
  onPress={() => alert('Button Pressed')}
>
  <Text style={{ color: Colors.semantic.success }}>Solid Button</Text>
</Button> */}