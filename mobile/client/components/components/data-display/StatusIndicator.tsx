import { LogedInUser, User } from '@/components/shared/types/components';
import {
    Avatar,
    AvatarFallbackText,
    AvatarImage
} from "@/components/ui/avatar";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/components/card/Card";
import { Text } from '@/components/ui/text';
import { ColorCombinations } from "@/constants/Colors";
import { useTheme } from "@/contexts/ThemeContext";
import { CircleCheck, CircleQuestionMark, Info, ShieldCheck } from "lucide-react-native";
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';


interface StatusIndicatorProps {
  user?: User;
  logedInUser?: LogedInUser;
}

export const StatusIndicator = ({ user, logedInUser }: StatusIndicatorProps) => {
    const { isDark } = useTheme();

  // Dynamic styles based on theme
    const dynamicStyles = {
      container: {
        backgroundColor: isDark
          ? ColorCombinations.statusTemplate.dark
          : ColorCombinations.statusTemplate.light,
      },
      ellipsisIcon: {
        color: isDark ? '#A6A6A6' : '#5B5B5B',
      },
      avatarBadge: {
        backgroundColor: isDark ? '#4CAF50' : '#81C784',
      },
    }

  return (
    <View>
      {user ? (
        <>
          <TouchableOpacity
          onPress={() => alert('Card pressed')}
          activeOpacity={1}
          >
            <Card style={{ ...dynamicStyles.container }}>
                {/* Main content row */}
                <Box style={styles.mainContent}>
                  {/* User info section */}
                  <Box style={styles.userSection}>
                    <Box style={styles.avatarContainer}>
                      {user.profileImage && (
                        <Avatar size='md'>
                        <AvatarImage
                          source={{
                            uri: user.profileImage,
                          }}
                          alt={`${user.firstName} ${user.lastName}`}
                        />
                        <AvatarFallbackText>
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </AvatarFallbackText>
                      </Avatar>
                      )}
                    </Box>
                    
                    <Box style={styles.userInfo}>
                      <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
                      <Text style={styles.timestamp} size="2xs" emphasis="light">
                        {user.date} • {user.time}
                      </Text>
                    </Box>
                  </Box>

                  {/* Status badge section */}
                  <Box style={styles.statusSection}>
                    <Badge
                      size='sm'
                      action={user.status == 'evacuated' ? 'info' : user.status == 'safe' ? 'success' : user.status == 'missing' ? 'error' : user.status == 'affected' ? 'warning' : 'muted'}
                      variant='solid'
                      style={styles.statusBadge}
                    >
                      <BadgeIcon as={
                        user.status == 'evacuated' ? ShieldCheck
                        : user.status == 'safe' ? CircleCheck
                        : user.status == 'affected' ? Info
                        : user.status == 'missing' ? CircleQuestionMark
                        : undefined
                      } />
                      <BadgeText>{user.status}</BadgeText>
                    </Badge>
                  </Box>
                </Box>
            </Card>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Box style={styles.avatarContainer}>
              {logedInUser?.profileImage && (
                <Avatar size='md'>
                <AvatarImage
                  source={{
                    uri: logedInUser.profileImage,
                  }}
                  alt={`${logedInUser.firstName} ${logedInUser.lastName}`}
                />
                <AvatarFallbackText>
                  {logedInUser.firstName.charAt(0)}{logedInUser.lastName.charAt(0)}
                </AvatarFallbackText>
              </Avatar>
              )}
            </Box>
            <Box>
              <Text size="sm">Hello</Text>
              <Text size="sm">{logedInUser?.firstName} {logedInUser?.lastName}</Text>
            </Box>
          </View>
        </>
      )}
    </View>
  )
}

export default StatusIndicator

const styles = StyleSheet.create({
    avatarContainer: {
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    height: 'auto',
    width: '100%',
  },
  userSection: {
    width: '70%',
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
    width: '30%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexDirection: 'row',
  },
  statusBadge: {
    gap: 4,
    height: 24,
  },
})