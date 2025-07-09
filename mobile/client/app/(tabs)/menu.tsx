import { FontSizeSwitch } from '@/components/FontSizeSwitch';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import Body from '@/components/ui/Body';
import { Text } from '@/components/ui/text';
import { StyleSheet } from 'react-native';

export default function MenuScreen() {
  return (
    <Body style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <FontSizeSwitch />
      {/* <ThemeSwitcher /> */}
    </Body>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
