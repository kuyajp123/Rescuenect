import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import type { ComponentProps } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView } from 'react-native';
import { VStack, } from './vstack';

type VStackProps = ComponentProps<typeof VStack>;

interface ContainerProps extends VStackProps {
  style?: StyleProp<ViewStyle>;
  gap?: number | string;
}

const Body = ({ children, style, ...props }: ContainerProps) => {
  const { isDark } = useTheme();
  
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <VStack
        style={[{ flex: 1, padding: 20, backgroundColor: isDark ? Colors.background.dark : Colors.background.light }, style]}
        {...props} 
        >
          {children}
        </VStack>
    </ScrollView>
  )
}

export default Body;
