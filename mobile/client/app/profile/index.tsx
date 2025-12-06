import { Button } from '@/components/components/button/Button';
import { StatusTemplate } from '@/components/components/PostTemplate/StatusTemplate';
import { useAuth } from '@/components/store/useAuth';
import { useStatusStore } from '@/components/store/useCurrentStatusStore';
import { Avatar, AvatarFallbackText, AvatarImage } from '@/components/ui/avatar';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { Ellipsis, MapPinPlus } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const index = () => {
  const authUser = useAuth(state => state.authUser)!;
  const currentStatus = useStatusStore(state => state.statusData.find(status => status.uid === authUser.uid));
  const { isDark } = useTheme();
  const router = useRouter();

  return (
    <Body>
      <View style={styles.profile}>
        <View style={{ marginTop: 40 }}>
          <Avatar size="2xl">
            <AvatarFallbackText></AvatarFallbackText>
            <AvatarImage
              source={{
                uri: 'https://randomuser.me/api/portraits/men/11.jpg',
              }}
            />
          </Avatar>
        </View>
        <View style={{ marginTop: 10 }}>
          <Text size="2xl" bold>
            John Doe
          </Text>
          <Text size="sm" emphasis="light">
            johndoe@example.com
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
        <Button action="secondary" width="fit" style={{ marginLeft: 10, marginTop: 20 }} onPress={() => {}}>
          <Ellipsis size={24} color={isDark ? Colors.text.dark : Colors.text.light} />
        </Button>
      </View>
      <View style={styles.lists}>
        {currentStatus ? <StatusTemplate {...currentStatus} /> : <Text>No current status available.</Text>}
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
  },
});
