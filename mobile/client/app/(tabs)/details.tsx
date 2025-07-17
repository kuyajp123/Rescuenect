import Body from '@/components/ui/layout/Body';
import React, { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { Text } from '@/components/ui/text'
import { useTheme } from '@/contexts/ThemeContext';

export const DetailsScreen = () => {
  const [name, setName] = useState('');
  const { isDark } = useTheme();

  return (
    <Body>
      <TextInput
      style={[styles.input, { borderColor: isDark ? '#444' : '#ccc', color: isDark ? '#fff' : '#000' }]}
      placeholder="Enter your name"
      placeholderTextColor={isDark ? '#888' : '#666'}
      value={name}
      onChangeText={setName}
      />
      <Text>Hello, {name}</Text>

      
    </Body>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 50,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
});

export default DetailsScreen;
