import Map from '@/components/components/Map';
import { storage } from '@/components/helper/storage';
import Body from '@/components/ui/layout/Body';
import React, { useEffect, useState } from "react";
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const createStatus = () => {
  const insets = useSafeAreaInsets();
  const [isMapReady, setIsMapReady] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const getStorage = async () => {
        const user = await storage.get('@user');
        const barangay = await storage.get('@barangay');
        console.log('Stored user:', user);
        console.log('Stored barangay:', barangay);

        return { user, barangay };
      }

  useEffect(() => {
    // Ensure component is fully mounted and contexts are ready
    const timer = setTimeout(() => {
      setIsMapReady(true);
    }, 1000); // Reduced from 3000ms

    getStorage().then(data => {
      setUserData(data);
    });

    return () => clearTimeout(timer);

  }, []);

  return (
    <Body style={[
      styles.container,
      {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }
      ]}>

      {isMapReady && 
      <Map 
        hasBottomSheet={true}  
        hasMarker={true} 
        isMapReady={isMapReady} 
        firstName={userData.user.firstName}
        lastName={userData.user.lastName}
        phoneNumber={userData.user.phoneNumber}
      />}

    </Body>
  );
}

export default createStatus

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    padding: 0 
  },
  map: { 
    flex: 1 
  },
});