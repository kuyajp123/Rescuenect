import { Button } from '@/components/components/button/Button';
import { StatusTemplate } from '@/components/components/PostTemplate/StatusTemplate';
import { useAuth } from '@/store/useAuth';
import { useUserData } from '@/store/useBackendResponse';
import { Avatar, AvatarFallbackText, AvatarImage } from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import Body from '@/components/ui/layout/Body';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { API_ROUTES } from '@/config/endpoints';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { auth } from '@/lib/firebaseConfig';
import { StatusData } from '@/types/components';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { Ellipsis, MapPinPlus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const index = () => {
  const authUser = useAuth(state => state.authUser)!;
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDark } = useTheme();
  const router = useRouter();
  const userData = useUserData(state => state.userData);

  useEffect(() => {
    const fetchStatuses = async () => {
      const idToken = await auth.currentUser?.getIdToken();
      try {
        setIsLoading(true);
        const response = await axios.get<any>(API_ROUTES.STATUS.GET_ALL_MY_STATUSES, {
          params: { residentId: authUser.uid },
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        setStatuses(response.data.statuses || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching resident statuses:', error);
        setError('Failed to fetch statuses.');
        setIsLoading(false);
      }
    };

    fetchStatuses();
  }, []);

  return (
    <Body>
      <View style={styles.profile}>
        <View style={{ marginTop: 40 }}>
          <Avatar size="2xl">
            <AvatarFallbackText></AvatarFallbackText>
            <AvatarImage
              source={{
                uri:
                  auth.currentUser?.photoURL ||
                  'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
              }}
            />
          </Avatar>
        </View>
        <View style={{ marginTop: 10 }}>
          <Text size="2xl" bold>
            {userData.firstName} {userData.lastName}
          </Text>
          <Text size="sm" emphasis="light">
            {auth.currentUser?.email}
          </Text>
        </View>
      </View>
      <View style={styles.buttons}>
        <Button
          variant="solid"
          width="full"
          style={{ marginTop: 20, flex: 1 }}
          onPress={() => router.push('profile/(saveLocation)' as any)}
        >
          <MapPinPlus size={16} style={{ marginRight: 8 }} color={'white'} />
          <Text style={{ color: 'white' }} size="sm">
            Save Locations
          </Text>
        </Button>
        <Button
          action="secondary"
          width="fit"
          style={{ marginLeft: 10, marginTop: 20 }}
          onPress={() => {
            router.push('profile/profileDetails' as any);
          }}
        >
          <Ellipsis size={24} color={isDark ? Colors.text.dark : Colors.text.light} />
        </Button>
      </View>
      <View style={styles.lists}>
        {isLoading ? (
          <Box className="w-full gap-4 p-3 rounded-md bg-background-100">
            <HStack>
              <Skeleton variant="circular" className="h-[50px] w-[50px] mr-2" />
              <SkeletonText _lines={2} gap={1} className="h-5 w-3/5" />
            </HStack>
            <Skeleton variant="sharp" className="h-[200px]" />
            <SkeletonText _lines={2} className="h-5" />
            <HStack className="gap-1 align-middle"></HStack>
          </Box>
        ) : statuses.length > 0 ? (
          statuses.map(status => <StatusTemplate key={status.versionId} {...status} style={{ marginBottom: 10 }} />)
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text size="lg" bold style={{ marginBottom: 8 }}>
              No statuses yet
            </Text>
            <Text size="sm" emphasis="light" style={{ textAlign: 'center', paddingHorizontal: 20 }}>
              Your status updates will appear here
            </Text>
          </View>
        )}

        {error && (
          <Text size="sm" emphasis="light" style={styles.errorText}>
            {error}
          </Text>
        )}
      </View>
    </Body>
  );
};

export default index;

const styles = StyleSheet.create({
  profile: {},
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  lists: {
    marginTop: 20,
    marginBottom: 40,
  },
  errorText: {
    color: Colors.semantic.error,
    textAlign: 'center',
    marginTop: 20,
  },
});
