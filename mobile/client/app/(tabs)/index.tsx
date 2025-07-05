import Body from '@/components/ui/Body';
import { Text } from '@/components/ui/text';
import { StyleSheet } from 'react-native';

export default function HomeScreen() {

  return (
    <Body>
        <Text style={styles.title}>Welcome to the Home Screen</Text>
        <Text style={styles.subtitle}>Explore the app and enjoy!</Text>
    </Body>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 10,
  },
});