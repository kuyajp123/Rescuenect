import { AdvancedCarousel } from '@/components/components/carousel/AdvancedCarousel';
import StatusIndicator from '@/components/components/data-display/StatusIndicator';
import { CardWeather } from '@/components/components/weather/CardWeather';
import { storageHelpers } from '@/components/helper/storage';
import { useAuth } from '@/components/store/useAuth';
import { useStatusFormStore } from '@/components/store/useStatusForm';
import { Body } from '@/components/ui/layout/Body';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { User, loggedInUser } from '@/types/components';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

export const HomeScreen = React.memo(() => {
  const [userData, setUserData] = useState<loggedInUser | null>(null);
  const [userStatus, setUserStatus] = useState({});
  const userAuth = useAuth(state => state.authUser);
  const statusData = useStatusFormStore(state => state.formData);
  const userPhotoURL = userAuth?.photoURL || '';

  useEffect(() => {
    const getUser = async () => {
      const data = await storageHelpers.getData(STORAGE_KEYS.USER);

      return data;
    };

    getUser().then(res => {
      setUserData({ photoURL: userPhotoURL, ...res });
    });
  }, [userPhotoURL]);

  useEffect(() => {
    // Combine user data with status data if status exists
    const userDataFiltered = {
      ...userData,
      ...statusData, // This includes condition, expirationDuration, and other status fields
    };
    setUserStatus(userDataFiltered);
  }, [userData, statusData]);

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
