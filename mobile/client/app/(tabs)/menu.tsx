import Body from '@/components/Body';
import { FontSizeSwitch } from '@/components/FontSizeSwitch';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { Text } from '@/components/ui/text';
import { StyleSheet } from 'react-native';

export default function MenuScreen() {
  return (
    <Body style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Welcome to the Menu Screen</Text>
      <FontSizeSwitch showLabel={false} variant="buttons" />
      <ThemeSwitcher />
    </Body>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
