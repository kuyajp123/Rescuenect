import { AdvancedCarousel } from '@/components/components/carousel/AdvancedCarousel';
import StatusIndicator from '@/components/components/data-display/StatusIndicator';
import { CardWeather } from '@/components/components/weather/CardWeather';
import { storageHelpers } from '@/helper/storage';
import { useAuth } from '@/store/useAuth';
import { useStatusFormStore } from '@/store/useStatusForm';
import { Body } from '@/components/ui/layout/Body';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { User, loggedInUser } from '@/types/components';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useUserData } from '@/store/useBackendResponse';

export const HomeScreen = React.memo(() => {
  const [userData, setUserData] = useState<loggedInUser | null>(null);
  const [userStatus, setUserStatus] = useState({});
  const userAuth = useAuth(state => state.authUser);
  const formData = useStatusFormStore(state => state.formData);
  const userPhotoURL = userAuth?.photoURL || '';
  const userDataBackend = useUserData(state => state.userData);

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
    <Body gap={20}>
      <StatusIndicator userStatus={userStatus as User | undefined} loggedInUser={userData || undefined} />
      <CardWeather />

      <View style={{ marginTop: 20 }}>
        <AdvancedCarousel />
      </View>
    </Body>
  );
});

export default HomeScreen;
