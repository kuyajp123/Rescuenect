import { Button, HoveredButton } from '@/components/components/button/Button';
import GoogleButton from '@/components/components/button/GoogleButton';
import { Card } from '@/components/components/card/Card';
import { handleLogout } from '@/components/auth/auth';
import ThemeSwitcher from '@/components/shared/hooks/ThemeSwitcher';
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
    <Body style={styles.bodyContainer}>
      <View>
        {/* <HoveredButton 
        onPress={() => alert('profile click')} 
        style={styles.HoveredButton}>
          <View style={styles.mainContainer}>
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

            <View style={styles.nameContainer}>
              <Text size='md' style={styles.nameSectionText}>John Doe</Text>
              <Text emphasis='light' style={styles.nameSectionText}>johndoe10@example.com</Text>
            </View>
          </View>

          <View>
            <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
          </View>
        </HoveredButton> */}

          <Card style={styles.card}>
            <Text className='text-center mb-4'>Continue with Google to save your progress</Text>
            <GoogleButton />
          </Card>

        <View style={styles.sectionTitle}>
          <Text emphasis='light'>System</Text>
        </View>
        
        <View style={[
          styles.sectionContainer,
          {
            borderColor: isDark ? Colors.border.dark : Colors.border.light,
            backgroundColor: isDark ? ColorCombinations.statusTemplate.dark : ColorCombinations.statusTemplate.light,
          }
        ]}>
          <HoveredButton style={styles.menuButton}
            onPress={() => router.push('settings' as any)}>
              <View style={styles.menuButtonContent}>
                <Settings size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <Text>Settings</Text>
              </View>
              <View>
                <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
              </View>
          </HoveredButton>
          <HoveredButton 
            onPress={toggleTheme}
            style={styles.menuButton}>
              <View style={styles.menuButtonContent}>
                {isDark ? <Moon size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} /> : <Sun size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />}
                <Text>Dark mode</Text>
              </View>
              <View>
                <View style={styles.themeSwitcherContainer}>
                  <ThemeSwitcher />
                </View>
              </View>
          </HoveredButton>
        </View>

        <View style={styles.legalSectionTitle}>
          <Text emphasis='light'>Legal</Text>
        </View>

          
        <View style={[
          styles.legalSectionContainer,
          {
            borderColor: isDark ? Colors.border.dark : Colors.border.light,
            backgroundColor: isDark ? ColorCombinations.statusTemplate.dark : ColorCombinations.statusTemplate.light,
          }
        ]}>
          <HoveredButton style={styles.menuButton}>
              <View style={styles.menuButtonContent}>
                <BadgeQuestionMark size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <Text>FAQ</Text>
              </View>
              <View>
                <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
              </View>
          </HoveredButton>
          <HoveredButton style={styles.menuButton}>
              <View style={styles.menuButtonContent}>
                <ReceiptText size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <Text>Terms and Condition</Text>
              </View>
              <View>
                <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
              </View>
          </HoveredButton>
          <HoveredButton style={styles.menuButton}>
              <View style={styles.menuButtonContent}>
                <BadgeInfo size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <Text>About us</Text>
              </View>
              <View>
                <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
              </View>
          </HoveredButton>
        </View>

        <Button 
        onPress={handleLogout}
        variant='outline' 
        style={[
          styles.logoutButton,
          {
            borderColor: isDark ? Colors.button.errorDark.pressed : Colors.button.error.default
          }
        ]}>
          <LogOut size={20} color={isDark ? Colors.button.errorDark.default : Colors.button.error.default} />
          <Text style={[
            styles.logoutText,
            {
              color: isDark ? Colors.button.errorDark.default : Colors.button.error.default
            }
          ]}>Logout</Text>
        </Button>

      </View>
    </Body>
  );
}

const styles = StyleSheet.create({
  bodyContainer: {
    paddingHorizontal: 0,
  },
  HoveredButton: {
    // marginTop: 20, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  card: {
    margin: 20
  },
  mainContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 10, 
  },
  nameContainer: { 
    width: '70%', 
    flexWrap: 'wrap', 
    marginTop: 5 
  },
  nameSectionText: {
    width: '100%'
  },
  sectionTitle: { 
    marginTop: 20, 
    marginLeft: 20
  },
  sectionContainer: {
    borderWidth: 1,
    marginTop: 10,
  },
  menuButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  menuButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeSwitcherContainer: {
    pointerEvents: 'none',
  },
  legalSectionTitle: {
    marginTop: 30,
    marginLeft: 20,
  },
  legalSectionContainer: {
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 30,
  },
  logoutButton: {
    marginHorizontal: 20,
    width: 'auto',
  },
  logoutText: {
    marginLeft: 5,
  },
});

export default MenuScreen;
