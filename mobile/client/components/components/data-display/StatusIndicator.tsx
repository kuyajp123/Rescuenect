import { Card } from '@/components/components/card/Card';
import { Avatar, AvatarFallbackText, AvatarImage } from '@/components/ui/avatar';
import { Badge, BadgeIcon, BadgeText } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { ColorCombinations } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { loggedInUser, User } from '@/types/components';
import { useRouter } from 'expo-router';
import { CircleCheck, CircleQuestionMark, Info, ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface StatusIndicatorProps {
  userStatus?: User;
  loggedInUser?: loggedInUser;
}

export const StatusIndicator = ({ userStatus, loggedInUser }: StatusIndicatorProps) => {
  const { isDark } = useTheme();
  const router = useRouter();

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
                  {userStatus.profileImage && (
                    <Avatar size="md">
                      <AvatarImage
                        source={{
                          uri: userStatus.profileImage,
                        }}
                        alt={`${userStatus.firstName} ${userStatus.lastName}`}
                      />
                      <AvatarFallbackText>
                        {userStatus.firstName?.charAt(0)}
                        {userStatus.lastName?.charAt(0)}
                      </AvatarFallbackText>
                    </Avatar>
                  )}
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
                <Badge
                  size="sm"
                  action={
                    userStatus.condition == 'evacuated'
                      ? 'info'
                      : userStatus.condition == 'safe'
                      ? 'success'
                      : userStatus.condition == 'missing'
                      ? 'error'
                      : userStatus.condition == 'affected'
                      ? 'warning'
                      : 'muted'
                  }
                  variant="solid"
                  style={styles.statusBadge}
                >
                  <BadgeIcon
                    as={
                      userStatus.condition == 'evacuated'
                        ? ShieldCheck
                        : userStatus.condition == 'safe'
                        ? CircleCheck
                        : userStatus.condition == 'affected'
                        ? Info
                        : userStatus.condition == 'missing'
                        ? CircleQuestionMark
                        : undefined
                    }
                  />
                  <BadgeText>{userStatus.condition}</BadgeText>
                </Badge>
              </Box>
            </Box>
          </Card>
        </TouchableOpacity>
      ) : (
        // Hello component when no active status
        <View style={styles.helloContainer}>
          <Box style={styles.avatarContainer}>
            {loggedInUser?.profileImage && (
              <Avatar size="md">
                <AvatarImage
                  source={{
                    uri: loggedInUser.profileImage,
                  }}
                  alt={`${loggedInUser.firstName} ${loggedInUser.lastName}`}
                />
                <AvatarFallbackText>
                  {loggedInUser?.firstName?.charAt(0) || ''}
                  {loggedInUser?.lastName?.charAt(0) || ''}
                </AvatarFallbackText>
              </Avatar>
            )}
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
    width: 'auto',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexDirection: 'row',
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
