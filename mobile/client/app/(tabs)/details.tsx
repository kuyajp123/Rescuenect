import Body from '@/components/ui/Body';
import { Button } from '@/components/ui/button/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';
import {Colors} from '@/constants/Colors';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function DetailsScreen() {
  const { isDark } = useTheme();
  return (
    <Body>
      <Text style={styles.title} className={isDark ? 'text-text_dark-500' : 'text-text_light-500'} >Welcome to the Details Screen</Text>

        <Button
  variant="outline"

  onPress={() => alert('Outline Pressed')}
>
  <Text
    className={`font-semibold ${
      isDark ? 'text-text_dark-500' : 'text-zinc-600'
    }`}
  >
    Outline Button
  </Text>
</Button>

<Button
  action="primary"
  variant="solid"
  style={{ marginTop: 20 }}
  onPress={() => alert('Button Pressed')}
>
  <Text className="text-white font-semibold">Solid Button</Text>
</Button>

<Button
  action="error"
  variant="solid"
  style={{ marginTop: 20 }}
  onPress={() => alert('Button Pressed')}
>
  <Text className="text-white font-semibold">Solid Button</Text>
</Button>

<Button
  action="warning"
  variant="solid"
  style={{ marginTop: 20 }}
  onPress={() => alert('Button Pressed')}
>
  <Text className="text-white font-semibold">Solid Button</Text>
</Button>

<Button
  variant="outline"
  style={{ marginTop: 20, borderRadius: 50 }}
  onPress={() => alert('Button Pressed')}
>
  <Text className='dark:text-text_dark-500 text-text_light-500 '>Solid Button</Text>
  <ChevronRight size={24} color={isDark ? '#FFFFFF' : '#000000'} />
</Button>

<Button
  variant='outline'
  style={{ marginTop: 20, borderColor: Colors.semantic.success, borderWidth: 2 }}
  onPress={() => alert('Button Pressed')}
>
  <Text style={{ color: Colors.semantic.success }}>Solid Button</Text>
</Button>
    <ThemeSwitcher/>
    </Body>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: Colors.background.light,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
