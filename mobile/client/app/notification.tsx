import Body from '@/components/ui/layout/Body';
import React from 'react';
import { StyleSheet } from 'react-native';
import { checkInternetConnectionOnce } from '@/components/helper/commonHelpers';
import { Button } from '@/components/components/button/Button';
import { Text } from '@/components/ui/text';

export const notification = () => {
  const [isOnline, setIsOnline] = React.useState(false);

  const handleCheckConnection = async () => {
    const isConnected = await checkInternetConnectionOnce();
    console.log('Internet connection status:', isConnected);
    setIsOnline(isConnected);
  }

  return (
      <Body>
        <Button onPress={handleCheckConnection}><Text>Check Internet Connection</Text></Button>
        <Text style={{ textAlign: 'center', marginTop: 20 }}>
          {isOnline ? "You are online" : "You are offline"}
        </Text>
      </Body>
  )
}

const styles = StyleSheet.create({})

export default notification;