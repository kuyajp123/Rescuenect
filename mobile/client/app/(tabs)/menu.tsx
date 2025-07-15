import ThemeSwitcher from '@/components/shared/hooks/ThemeSwitcher';
import { Avatar, AvatarFallbackText, AvatarImage } from '@/components/ui/avatar';
import { Button, HoveredButton } from '@/components/ui/button/Button';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { ColorCombinations, Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { BadgeInfo, BadgeQuestionMark, ChevronRight, LogOut, Moon, ReceiptText, Settings, Sun } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

export const MenuScreen = () => {
  const { isDark, setColorMode } = useTheme();
  const router = useRouter();

  const toggleTheme = () => {
    setColorMode(isDark ? 'light' : 'dark');
  };

  return (
    <Body style={{ paddingHorizontal: 0 }}>
      <View>
        <HoveredButton 
        onPress={() => alert('profile click')} 
        style={{ 
          // marginTop: 20, 
          padding: 20, 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, }}>
            <View>
              <Avatar size="lg">
                <AvatarFallbackText>John Doe</AvatarFallbackText>
                <AvatarImage
                  source={{
                    uri: "https://randomuser.me/api/portraits/men/11.jpg",
                  }}
                />
              </Avatar>
            </View>

            {/* name */}
            <View style={{ width: '70%', flexWrap: 'wrap', marginTop: 5 }}>
              <Text size='md' style={{ width: '100%'}}>John Doe</Text>
              <Text emphasis='light' style={{ width: '100%'}}>johndoe10@example.com</Text>
            </View>
          </View>

          {/* chevron */}
          <View>
            <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
          </View>
        </HoveredButton>

        <View style={{ marginTop: 20, marginLeft: 20}}>
          <Text emphasis='light'>System</Text>
        </View>
        
        <View style={{ 
          borderWidth: 1, 
          borderColor: isDark 
                ? Colors.border.dark 
                : Colors.border.light, 
          marginTop: 10, 
          backgroundColor: isDark
                ? ColorCombinations.statusTemplate.dark
                : ColorCombinations.statusTemplate.light, 
          }}>
          <HoveredButton style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, }}
            onPress={() => router.push('settings' as any)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10,}}>
                <Settings size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <Text>Settings</Text>
              </View>
              <View>
                <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
              </View>
          </HoveredButton>
          <HoveredButton 
            onPress={toggleTheme}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10}}>
                {isDark ? <Moon size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} /> : <Sun size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />}
                <Text>Dark mode</Text>
              </View>
              <View>
                <View style={{ pointerEvents: 'none' }}>
                  <ThemeSwitcher />
                </View>
              </View>
          </HoveredButton>
        </View>

        <View style={{ marginTop: 30, marginLeft: 20}}>
          <Text emphasis='light'>Legal</Text>
        </View>

          
        <View style={{ 
          borderWidth: 1, 
          borderColor: isDark 
                ? Colors.border.dark 
                : Colors.border.light, 
          marginTop: 10,  
          marginBottom: 30,
          backgroundColor: isDark
                ? ColorCombinations.statusTemplate.dark
                : ColorCombinations.statusTemplate.light, 
          }}>
          <HoveredButton style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20,}}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10,}}>
                <BadgeQuestionMark size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <Text>FAQ</Text>
              </View>
              <View>
                <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
              </View>
          </HoveredButton>
          <HoveredButton style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20,}}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10,}}>
                <ReceiptText size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <Text>Terms and Condition</Text>
              </View>
              <View>
                <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
              </View>
          </HoveredButton>
          <HoveredButton style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20,}}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10,}}>
                <BadgeInfo size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <Text>About us</Text>
              </View>
              <View>
                <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
              </View>
          </HoveredButton>
        </View>

        <Button variant='outline' style={{ marginHorizontal: 20, width: 'auto', borderColor: isDark ? Colors.button.errorDark.pressed : Colors.button.error.default }}>
          <LogOut size={20} color={isDark ? Colors.button.errorDark.default : Colors.button.error.default} />
          <Text style={{ color: isDark ? Colors.button.errorDark.default : Colors.button.error.default, marginLeft: 5 }}>Logout</Text>
        </Button>

      </View>
    </Body>
  );
}

const styles = StyleSheet.create({

});

export default MenuScreen;
