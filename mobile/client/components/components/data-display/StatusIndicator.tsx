import { Card } from '@/components/components/card/Card';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { ColorCombinations } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { auth } from '@/lib/firebaseConfig';
import { loggedInUser, User } from '@/types/components';
import { useRouter } from 'expo-router';
import { Avatar, Chip } from 'heroui-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface StatusIndicatorProps {
  userStatus?: User;
  loggedInUser?: loggedInUser;
}

export const StatusIndicator = ({ userStatus, loggedInUser }: StatusIndicatorProps) => {
  const { isDark } = useTheme();
  const router = useRouter();
  const activeAvatarUri = userStatus?.profileImage || auth.currentUser?.photoURL || loggedInUser?.profileImage;
  const activeAvatarFallback = `${userStatus?.firstName?.charAt(0) ?? ''}${userStatus?.lastName?.charAt(0) ?? ''}`;
  const helloAvatarUri = loggedInUser?.profileImage || auth.currentUser?.photoURL;
  const helloAvatarFallback = `${loggedInUser?.firstName?.charAt(0) ?? ''}${loggedInUser?.lastName?.charAt(0) ?? ''}`;

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? ColorCombinations.statusTemplate.dark : ColorCombinations.statusTemplate.light,
    },
    ellipsisIcon: {
      color: isDark ? '#A6A6A6' : '#5B5B5B',
    },
    avatarBadge: {
      backgroundColor: isDark ? '#4CAF50' : '#81C784',
    },
  };

  // Check if user has an active status (condition and other required fields)
  const hasActiveStatus =
    userStatus &&
    userStatus.condition &&
    (userStatus.firstName || loggedInUser?.firstName) &&
    (userStatus.lastName || loggedInUser?.lastName);

  return (
    <View>
      {hasActiveStatus ? (
        <TouchableOpacity onPress={() => router.push('/status/createStatus')} activeOpacity={1}>
          <Card style={{ ...dynamicStyles.container }}>
            {/* Main content row */}
            <Box style={styles.mainContent}>
              {/* User info section */}
              <Box style={styles.userSection}>
                <Box style={styles.avatarContainer}>
                  <Avatar alt="Profile avatar">
                    <Avatar.Fallback color="default">{activeAvatarFallback}</Avatar.Fallback>
                    {activeAvatarUri ? <Avatar.Image source={{ uri: activeAvatarUri }} /> : null}
                  </Avatar>
                </Box>

                <Box style={styles.userInfo}>
                  <Text size="sm" style={styles.userName}>
                    {userStatus.firstName} {userStatus.lastName}
                  </Text>
                  <Text style={styles.timestamp} size="xs" emphasis="light">
                    {userStatus.location}
                  </Text>
                </Box>
              </Box>

              {/* Status badge section */}
              <Box style={styles.statusSection}>
                <Chip
                  size="sm"
                  color={
                    userStatus.condition == 'evacuated'
                      ? 'accent'
                      : userStatus.condition == 'safe'
                        ? 'success'
                        : userStatus.condition == 'missing'
                          ? 'danger'
                          : userStatus.condition == 'affected'
                            ? 'danger'
                            : 'default'
                  }
                  variant="primary"
                  style={styles.statusBadge}
                >
                  <Chip.Label className="text-white">{userStatus.condition}</Chip.Label>
                </Chip>
              </Box>
            </Box>
          </Card>
        </TouchableOpacity>
      ) : (
        // Hello component when no active status
        <View style={styles.helloContainer}>
          <Box style={styles.avatarContainer}>
            <Avatar alt="Profile avatar">
              <Avatar.Fallback color="default">{helloAvatarFallback}</Avatar.Fallback>
              {helloAvatarUri ? <Avatar.Image source={{ uri: helloAvatarUri }} /> : null}
            </Avatar>
          </Box>
          <Box style={styles.helloTextContainer}>
            <Text size="sm" style={styles.helloText}>
              Hello
            </Text>
            <Text size="sm" style={styles.userName}>
              {loggedInUser?.firstName} {loggedInUser?.lastName}
            </Text>
          </Box>
        </View>
      )}
    </View>
  );
};

export default StatusIndicator;

const styles = StyleSheet.create({
  avatarContainer: {},
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    height: 'auto',
    width: '100%',
  },
  userSection: {
    width: '75%',
    flexWrap: 'wrap',
    gap: 8,
    flexDirection: 'row',
  },
  userInfo: {
    width: '70%',
    flexWrap: 'wrap',
  },
  userName: {
    maxWidth: '100%',
  },
  timestamp: {
    maxWidth: '100%',
  },
  statusSection: {
    flex: 1,
    width: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  statusBadge: {
    gap: 4,
    height: 24,
  },
  helloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  helloTextContainer: {
    flex: 1,
  },
  helloText: {
    opacity: 0.7,
  },
});
