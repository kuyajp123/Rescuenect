import type { ComponentProps } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView } from 'react-native';
import { VStack, } from './ui/vstack';
import { Colors } from '@/constants/Colors';

type VStackProps = ComponentProps<typeof VStack>;

interface ContainerProps extends VStackProps {
  style?: StyleProp<ViewStyle>;
}

const Body = ({ children, style, ...props }: ContainerProps) => {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <VStack 
        style={[{ flex: 1, padding: 20, backgroundColor: Colors.background.light }, style]} 
        {...props} 
        >
          {children}
        </VStack>
    </ScrollView>
  )
}

export default Body;
