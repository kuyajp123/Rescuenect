import Body from '@/components/Body';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { StyleSheet } from 'react-native';

export default function HomeScreen() {

  return (
    <Body>
      {/* Example usage with different base sizes */}
      <Box>
        <Text size="3xl">Large Title (3xl base)</Text>
        <Text size="2xl">Subtitle (2xl base)</Text>
        <Text size="xl">Section Header (xl base)</Text>
        <Text size="lg">Large Text (lg base)</Text>
        <Text size="md">Medium Text (md base)</Text>
        <Text size="sm">Small Text (sm base)</Text>
        <Text size="xs">Extra Small Text (xs base)</Text>
      </Box>

      {/* Different content with same base sizes */}
      <Box>
        <Text size="2xl">News Article Title</Text>
        <Text size="md">This is a paragraph of text that shows how the font multiplier affects all text uniformly. When you change the font size using the switcher above, this entire paragraph will scale proportionally.</Text>
        <Text size="sm">Published on January 1, 2024</Text>
      </Box>

      <Box>
        <Text size="xl">Features List</Text>
        <Text size="md">• Feature one description</Text>
        <Text size="md">• Feature two description</Text>
        <Text size="md">• Feature three description</Text>
        <Text size="sm">All features scale together</Text>
      </Box>

      {/* Mixed content showing consistency */}
      <Box>
        <Text size="lg">Contact Information</Text>
        <Text size="md">Email: contact@example.com</Text>
        <Text size="md">Phone: (555) 123-4567</Text>
        <Text size="sm">Available 24/7</Text>
      </Box>
    </Body>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#000000',
    borderWidth: 1,
    backgroundColor: '#F8FAFC', // light background color
  },
  box: {
    padding: 10,
    marginVertical: 10,
    borderColor: '#D1D5DB', // light gray border color
    borderWidth: 1,
    backgroundColor: '#FFFFFF', // white background color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000', // dark text color
  },
});
