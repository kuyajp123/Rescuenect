import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function DetailsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Details Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.light,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
