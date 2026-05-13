import { handleLogout } from '@/auth/auth';
import { HoveredButton } from '@/components/components/button/Button';
import GoogleButton from '@/components/components/button/GoogleButton';
import NavigationButton from '@/components/components/button/NavigationButton';
import { Card } from '@/components/components/card/Card';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { ColorCombinations, Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/store/useAuth';
import { useUserData } from '@/store/useBackendResponse';
import { useRouter } from 'expo-router';
import { Avatar } from 'heroui-native';
import { Button } from 'heroui-native/button';
import { BadgeInfo, ChevronRight, FileText, LogOut, Moon, ReceiptText, Settings, Sun } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export const MenuScreen = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const authUser = useAuth(state => state.authUser);
  const userData = useUserData(state => state.userData);

  return (
    <Body style={styles.bodyContainer}>
      <View>
        {authUser ? (
          <HoveredButton onPress={() => router.push('profile' as any)} style={styles.HoveredButton}>
            <View style={styles.mainContainer}>
              <View>
                <Avatar alt="Profile avatar">
                  <Avatar.Fallback>
                    {userData.firstName?.charAt(0) ?? ''}
                    {userData.lastName?.charAt(0) ?? ''}
                  </Avatar.Fallback>
                  {authUser?.photoURL ? <Avatar.Image source={{ uri: authUser.photoURL }} /> : null}
                </Avatar>
              </View>

              <View style={styles.nameContainer}>
                <Text size="md" style={styles.nameSectionText}>
                  {userData.firstName} {userData.lastName}
                </Text>
                <Text emphasis="light" style={styles.nameSectionText}>
                  {authUser?.email}
                </Text>
              </View>
            </View>

            <View>
              <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
            </View>
          </HoveredButton>
        ) : (
          <Card style={styles.card}>
            <Text className="text-center mb-4">Continue with Google to save your progress</Text>
            <GoogleButton />
          </Card>
        )}

        <View style={styles.sectionTitle}>
          <Text emphasis="light">System</Text>
        </View>

        <View
          style={[
            styles.sectionContainer,
            {
              borderColor: isDark ? Colors.border.dark : Colors.border.light,
              backgroundColor: isDark ? ColorCombinations.statusTemplate.dark : ColorCombinations.statusTemplate.light,
            },
          ]}
        >
          <NavigationButton
            label="Settings"
            onPress={() => router.push('settings' as any)}
            iconLeft={<Settings size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />}
          />
          <NavigationButton
            label="Dark mode"
            onPress={() => router.push('settings/darkMode' as any)}
            iconLeft={
              isDark ? (
                <Moon size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
              ) : (
                <Sun size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
              )
            }
          />
        </View>

        <View style={styles.legalSectionTitle}>
          <Text emphasis="light">Legal</Text>
        </View>

        <View
          style={[
            styles.legalSectionContainer,
            {
              borderColor: isDark ? Colors.border.dark : Colors.border.light,
              backgroundColor: isDark ? ColorCombinations.statusTemplate.dark : ColorCombinations.statusTemplate.light,
            },
          ]}
        >
          <NavigationButton
            label="Terms and Condition"
            onPress={() =>
              router.push({
                pathname: '/auth/legal',
                params: {
                  url: 'https://rescuenect.vercel.app/terms-and-condition',
                  title: 'Terms and Conditions',
                },
              })
            }
            iconLeft={<ReceiptText size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />}
          />
          <NavigationButton
            label="Privacy Policy"
            onPress={() =>
              router.push({
                pathname: '/auth/legal',
                params: {
                  url: 'https://rescuenect.vercel.app/privacy-policy',
                  title: 'Privacy Policy',
                },
              })
            }
            iconLeft={<FileText size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />}
          />
          <NavigationButton
            label="About us"
            onPress={() => router.push('/auth/about' as any)}
            iconLeft={<BadgeInfo size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />}
          />
        </View>

        <Button
          onPress={handleLogout}
          variant="danger-soft"
          style={[
            styles.logoutButton,
            {
              borderColor: isDark ? Colors.button.errorDark.pressed : Colors.button.error.default,
            },
          ]}
        >
          <LogOut size={20} color={isDark ? Colors.button.errorDark.default : Colors.button.error.default} />

          <Button.Label>
            <Text
              size="sm"
              style={[
                styles.logoutText,
                {
                  color: isDark ? Colors.button.errorDark.default : Colors.button.error.default,
                },
              ]}
            >
              Logout
            </Text>
          </Button.Label>
        </Button>
      </View>
    </Body>
  );
};

const styles = StyleSheet.create({
  bodyContainer: {
    paddingHorizontal: 0,
  },
  HoveredButton: {
    // marginTop: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  card: {
    margin: 20,
  },
  mainContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  nameContainer: {
    width: '70%',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  nameSectionText: {
    width: '100%',
  },
  sectionTitle: {
    marginTop: 20,
    marginLeft: 20,
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
    borderRadius: 8,
    width: 'auto',
  },
  logoutText: {
    marginLeft: 5,
  },
});

export default MenuScreen;
