import ThemeSwitcher from '@/components/shared/hooks/ThemeSwitcher';
import { Avatar, AvatarFallbackText, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button/Button';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { ColorCombinations, Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { BadgeInfo, BadgeQuestionMark, ChevronRight, LogOut, Moon, ReceiptText, Settings, Sun } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

export const MenuScreen = () => {
  const { isDark } = useTheme();

  return (
    <Body style={{ paddingHorizontal: 0 }}>
      <View>
        <View style={{ marginLeft: 20 }}><Text size='3xl' bold>Menu</Text></View>
        <View style={{ marginTop: 40, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, }}>
            <View>
              <Avatar size="lg">
                <AvatarFallbackText>Jane Doe</AvatarFallbackText>
                <AvatarImage
                  source={{
                    uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
                  }}
                />
              </Avatar>
            </View>

            {/* name */}
            <View style={{ width: '70%', flexWrap: 'wrap', marginTop: 5 }}>
              <Text size='md' style={{ width: '100%'}}>Jane Doe</Text>
              <Text emphasis='light' style={{ width: '100%'}}>janedoe10@example.com</Text>
            </View>
          </View>

          {/* chevron */}
          <View>
            <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
          </View>
        </View>

        <View style={{ marginTop: 20, marginLeft: 20}}>
          <Text emphasis='light'>System</Text>
        </View>
        
        <View style={{ 
          borderWidth: 1, 
          borderColor: isDark 
                ? Colors.border.dark 
                : Colors.border.light, 
          gap: 30, 
          marginTop: 10, 
          padding: 20, 
          backgroundColor: isDark
                ? ColorCombinations.statusTemplate.dark
                : ColorCombinations.statusTemplate.light, 
          }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',}}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10,}}>
                <Settings size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <Text>Settings</Text>
              </View>
              <View>
                <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
              </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10}}>
                {isDark ? <Moon size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} /> : <Sun size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />}
                <Text>Dark mode</Text>
              </View>
              <View>
                <ThemeSwitcher />
              </View>
          </View>
        </View>

        <View style={{ marginTop: 30, marginLeft: 20}}>
          <Text emphasis='light'>Legal</Text>
        </View>

          
        <View style={{ 
          borderWidth: 1, 
          borderColor: isDark 
                ? Colors.border.dark 
                : Colors.border.light, 
          gap: 30, 
          marginTop: 10, 
          padding: 20, 
          marginBottom: 30,
          backgroundColor: isDark
                ? ColorCombinations.statusTemplate.dark
                : ColorCombinations.statusTemplate.light, 
          }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',}}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10,}}>
                <BadgeQuestionMark size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <Text>FAQ</Text>
              </View>
              <View>
                <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
              </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',}}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10,}}>
                <ReceiptText size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <Text>Terms and Condition</Text>
              </View>
              <View>
                <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
              </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',}}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10,}}>
                <BadgeInfo size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <Text>About us</Text>
              </View>
              <View>
                <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
              </View>
          </View>
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
