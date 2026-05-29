import Announcement from '@/components/components/AnnouncementList/Announcement';
import { AdvancedCarousel } from '@/components/components/carousel/AdvancedCarousel';
import StatusIndicator from '@/components/components/data-display/StatusIndicator';
import QuickActions from '@/components/components/home/QuickActions';
import { CardWeather } from '@/components/components/weather/CardWeather';
import { Body } from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { Colors } from '@/constants/Colors';
import { storageHelpers } from '@/helper/storage';
import { syncAuthenticatedUserProfile } from '@/services/userProfileSync';
import { useAuth } from '@/store/useAuth';
import { useUserData } from '@/store/useBackendResponse';
import { useStatusFormStore } from '@/store/useStatusForm';
import { User, loggedInUser } from '@/types/components';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, View } from 'react-native';

export default function HomeScreen() {
  const [userData, setUserData] = useState<loggedInUser | null>(null);
  const [userStatus, setUserStatus] = useState({});
  const userAuth = useAuth(state => state.authUser);
  const formData = useStatusFormStore(state => state.formData);
  const userPhotoURL = userAuth?.photoURL || '';
  const userDataBackend = useUserData(state => state.userData);
  const deletionScheduled = userDataBackend.clientStatus === 'deletion_scheduled';
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (userAuth) {
        await syncAuthenticatedUserProfile(userAuth);
      }
      const data = await storageHelpers.getData(STORAGE_KEYS.USER);
      const latestUserData = useUserData.getState().userData;
      setUserData({ photoURL: userPhotoURL, ...data, ...latestUserData });
      setRefreshTrigger(prev => prev + 1);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [userAuth, userPhotoURL]);

  useEffect(() => {
    const getUser = async () => {
      const data = await storageHelpers.getData(STORAGE_KEYS.USER);

      return data;
    };

    getUser().then(res => {
      setUserData({ photoURL: userPhotoURL, ...res, ...userDataBackend });
    });
  }, [userPhotoURL, userDataBackend]);

  useEffect(() => {
    // Clear userStatus immediately if formData is null (user logged out or no status)
    if (!formData) {
      setUserStatus({});
      return;
    }

    // Combine user data with status data if status exists
    const userDataFiltered = {
      ...userData,
      ...formData, // This includes condition, expirationDuration, and other status fields
    };
    setUserStatus(userDataFiltered);
  }, [userData, formData]);

  return (
    <Body style={{ paddingBottom: 110 }} gap={20} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {deletionScheduled && (
        <View
          style={{
            borderWidth: 1,
            borderColor: Colors.semantic.warning,
            backgroundColor: '#FFF7E6',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <Text size="sm" bold style={{ color: Colors.semantic.warning }}>
            Client deletion scheduled
          </Text>
          <Text size="xs" style={{ color: Colors.semantic.warning, marginTop: 4 }}>
            Resident updates are read-only until deletion is cancelled or processed.
          </Text>
        </View>
      )}
      <StatusIndicator userStatus={userStatus as User | undefined} loggedInUser={userData || undefined} />
      <CardWeather />

      <QuickActions />

      <Announcement refreshTrigger={refreshTrigger} />

      <View>
        <AdvancedCarousel />
      </View>
    </Body>
  );
}
