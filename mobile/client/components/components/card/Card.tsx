import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { ColorCombinations, Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Platform, StyleSheet } from 'react-native';

type CardProps = {
  children?: React.ReactNode;
  style?: object;
};

export const Card = ({ children, style }: CardProps) => {
  const { isDark } = useTheme();

  const cardStyle = [
    styles.Container,
    {
      backgroundColor: isDark ? ColorCombinations.card_dark.background : '#FFFFFF',
      borderColor: isDark ? Colors.border.dark : Colors.border.light,
      ...(Platform.OS === 'ios' && {
        shadowColor: isDark ? '#FFFFFF' : '#000000',
        shadowOpacity: isDark ? 0.15 : 0.08,
      }),
    },
    style,
  ];

  return (
    <Box style={cardStyle}>
      <VStack>{children}</VStack>
    </Box>
  );
};

const styles = StyleSheet.create({
  Container: {
    // flex: 1,
    padding: 20,
    borderWidth: 1,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});

// Container: {
//     padding: 20,
//     borderWidth: 1,
//     borderRadius: 12,
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: {
//           width: 0,
//           height: 2,
//         },
//         shadowOpacity: 0.08,
//         shadowRadius: 4,
//       },
//       android: {
//         elevation: 3,
//       },
//     }),
//   },
