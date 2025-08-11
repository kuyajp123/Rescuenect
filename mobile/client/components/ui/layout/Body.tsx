import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import type { ComponentProps } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView } from 'react-native';
import { VStack, } from '../vstack';
import { StyleSheet } from 'react-native';

type VStackProps = ComponentProps<typeof VStack>;

interface ContainerProps extends VStackProps {
  style?: StyleProp<ViewStyle>;
  gap?: number | string;
}

export const Body = ({ children, style, ...props }: ContainerProps) => {
  const { isDark } = useTheme();
  
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <VStack
        style={[
          styles.container, {
            backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
          },
          style
        ]}
        {...props}
        >
          {children}
        </VStack>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
});

export default Body;
