import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { Mail, Wrench } from 'lucide-react-native';

export default function MaintenanceScreen() {
  const handleContact = () => {
    Linking.openURL('mailto:reserveexample@gmail.com');
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Wrench color="#006FEE" size={64} />
      </View>
      <Text style={styles.title}>We'll be right back.</Text>
      <Text style={styles.subtitle}>
        We're currently performing some scheduled maintenance to improve your experience. 
        We apologize for the inconvenience and appreciate your patience.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleContact}>
        <Mail color="#fff" size={20} style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Contact Support</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    padding: 24,
    backgroundColor: 'rgba(0, 111, 238, 0.1)',
    borderRadius: 100,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#11181C',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#006FEE',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
