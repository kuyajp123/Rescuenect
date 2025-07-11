import { FontSizeSwitch } from '@/components/shared/hooks/FontSizeSwitch';
import ThemeSwitcher from '@/components/shared/hooks/ThemeSwitcher';
import Body from '@/components/ui/layout/Body';
import { StyleSheet } from 'react-native';

export const MenuScreen = () => {
  return (
    <Body style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <FontSizeSwitch />
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

export default MenuScreen;
