import { getAddress } from '@/API/getAddress';
import { Button, HoveredButton } from '@/components/components/button/Button';
import { cleanAddress } from '@/components/helper/commonHelpers';
import { storageHelpers } from '@/components/helper/storage';
import { useAuth } from '@/components/store/useAuth';
import CustomAlertDialog from '@/components/ui/CustomAlertDialog';
import { Fab } from '@/components/ui/fab';
import { HStack } from '@/components/ui/hstack';
import Body from '@/components/ui/layout/Body';
import { MapView } from '@/components/ui/map/MapView';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { API_ROUTES } from '@/config/endpoints';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { Plus, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  FlatList,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

type ItemData = {
  id: string;
  label: string;
  location: string;
  coordinates: [number, number]; // [lng, lat]
};

const DATA: ItemData[] = [
  {
    id: 'bd7acbea-c1b1-sdfg3abb28ba',
    label: 'Home',
    location: '22nd Street, Conchu (Lagundian), Trece Martires City',
    coordinates: [120.875959, 14.2701184],
  },
  {
    id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
    label: 'Work',
    location: 'Banaba-Malainen Road, Naic Country Homes, Naic',
    coordinates: [120.7752839, 14.2919325],
  },
];

type ItemProps = {
  item: ItemData;
  onPress: () => void;
};

const Item = ({ item, onPress }: ItemProps) => (
  <HoveredButton onPress={onPress} style={styles.item}>
    <Text size="md">{item.label}</Text>
    <Text emphasis="light" size="sm">
      {item.location}
    </Text>
  </HoveredButton>
);

const index = () => {
  const [selectedId, setSelectedId] = useState<string>();
  const [FABisVisible, setFABisVisible] = useState<boolean>(true);
  const [label, setLabel] = useState<string>('');
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [location, setLocation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [bottomSheetIndex, setBottomSheetIndex] = useState<number>(0);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const { isDark } = useTheme();
  const authUser = useAuth(state => state.authUser);
  const scaleValue = useRef(new Animated.Value(0)).current;
  const [savedLocations, setSavedLocations] = useState<ItemData[]>([]);
  const [fetchedLocations, setFetchedLocations] = useState<ItemData[]>([]);

  useEffect(() => {
    const getData = async () => {
      const getLocations = await storageHelpers.getData<ItemData[]>(STORAGE_KEYS.SAVED_LOCATIONS);
      return getLocations || [];
    };
    getData().then(locations => {
      setSavedLocations(locations);
    });
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!authUser) return;

      try {
        const response = await axios.get(API_ROUTES.DATA.GET_LOCATIONS);
        if (response.status === 200 && response.data.locations) {
          setFetchedLocations(response.data.locations);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, [authUser]);

  const handleItemPress = (itemId: string) => {
    setSelectedId(itemId);
    // Open bottom sheet to 100% when item is clicked
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleAddNewLocation = () => {
    setSelectedId(undefined);
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleSheetChanges = (index: number) => {
    setBottomSheetIndex(index);
    if (index === -1) {
      setFABisVisible(true);
    } else {
      setFABisVisible(false);
    }
  };

  const renderItem = ({ item }: { item: ItemData }) => {
    return (
      <Item
        item={item}
        onPress={() => handleItemPress(item.id)}
        // mapContainer={mapContainer}
      />
    );
  };

  useEffect(() => {
    if (showSuccessDialog) {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog]);

  const handleClose = () => {
    // Scale out animation
    Animated.timing(scaleValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccessDialog(false);
    });
  };

  const handleMapPress = useCallback(
    (event: any) => {
      let mapCoords = null;

      if (event && event.geometry && event.geometry.coordinates) {
        mapCoords = event.geometry.coordinates;
      } else if (event && event.coordinates) {
        mapCoords = event.coordinates;
      } else if (event && event.nativeEvent && event.nativeEvent.coordinate) {
        mapCoords = [event.nativeEvent.coordinate.longitude, event.nativeEvent.coordinate.latitude];
      }

      if (
        !mapCoords ||
        mapCoords.length !== 2 ||
        typeof mapCoords[0] !== 'number' ||
        typeof mapCoords[1] !== 'number'
      ) {
        return;
      }

      const markerCoordinate: [number, number] = [mapCoords[0], mapCoords[1]];
      setCoords(markerCoordinate);

      if (authUser) {
        setLoading(true);
        const fetchAddress = async () => {
          try {
            const idToken = await authUser.getIdToken();
            const address = await getAddress(markerCoordinate[1], markerCoordinate[0], idToken);
            if (address.success && address.address) {
              const cleanedAddress = cleanAddress(address.address);
              setLocation(cleanedAddress);
            } else {
              setLocation('');
            }
          } catch (error) {
            console.error('Error fetching address:', error);
            setLocation('');
          }
          setLoading(false);
        };
        fetchAddress();
      } else {
        setLocation('');
      }
    },
    [setCoords, authUser, setLocation]
  );

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // If bottom sheet is open (index >= 0), close it and prevent default back action
        if (bottomSheetIndex >= 0) {
          bottomSheetRef.current?.close();
          return true; // Prevent default back action
        }
        return false; // Allow default back action (navigate to previous screen)
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [bottomSheetIndex])
  );

  const handleSaveLocation = async () => {
    try {
      const idToken = await authUser?.getIdToken();
      const response = await axios.post(
        API_ROUTES.DATA.SAVE_LOCATION,
        {
          label,
          location,
          coordinates: coords,
          uid: authUser?.uid,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      console.log('Location saved successfully:', response.data);

      if (response.status === 200) {
        // Close bottom sheet
        await storageHelpers.setData<ItemData[]>(STORAGE_KEYS.SAVED_LOCATIONS, [
          ...savedLocations,
          {
            id: response.data.locationId,
            label,
            location,
            coordinates: coords!,
          },
        ]);
        setSavedLocations(prevLocations => [
          ...prevLocations,
          {
            id: response.data.locationId,
            label,
            location,
            coordinates: coords!,
          },
        ]);

        bottomSheetRef.current?.close();
        // Optionally, refresh the list of saved locations here
        // Reset form fields
        setLabel('');
        setCoords(null);
        setLocation('');
        setShowSuccessDialog(true);
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  return (
    <>
      <Body style={{ padding: 0 }}>
        <View style={{ padding: 20 }}>
          <Text size="3xl" bold>
            Saved Locations
          </Text>
        </View>
        {/* <View style={{ flex: 1, height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <Text size='sm' emphasis='light'>
            No Save Locations yet.
          </Text>
        </View> */}
        <SafeAreaProvider>
          <SafeAreaView style={styles.container}>
            <FlatList
              data={fetchedLocations}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              extraData={selectedId}
              scrollEnabled={false}
            />
          </SafeAreaView>
        </SafeAreaProvider>
      </Body>
      <BottomSheet
        ref={bottomSheetRef}
        // index={-1}
        index={0}
        snapPoints={['100%']}
        onChange={handleSheetChanges}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustPan"
        enableContentPanningGesture={false}
        backgroundStyle={{
          backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
        }}
      >
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          <View style={{ alignItems: 'flex-end' }}>
            <X
              size={24}
              color={isDark ? Colors.icons.dark : Colors.icons.light}
              onPress={() => bottomSheetRef.current?.close()}
            />
          </View>
          <View>
            {/* need to modify this */}
            {selectedId ? (
              <>
                <Text size="lg" bold style={{ marginBottom: 10 }}>
                  {DATA.find(item => item.id === selectedId)?.label}
                </Text>
                <Text size="md" style={{ marginBottom: 20 }}>
                  {DATA.find(item => item.id === selectedId)?.location}
                </Text>
                <Text size="sm" emphasis="light">
                  Coordinates: {DATA.find(item => item.id === selectedId)?.coordinates.join(', ')}
                </Text>
              </>
            ) : (
              <VStack>
                <Text size="lg">Create new Location</Text>
                <View style={{ marginTop: 15 }}>
                  <HStack style={{ gap: 10 }}>
                    <Text size="sm">Label</Text>
                    <Text style={styles.errorMessage}>Error message here</Text>
                  </HStack>
                  <TextInput
                    placeholder="Enter Label"
                    value={label}
                    onChangeText={setLabel}
                    style={{
                      borderWidth: 1,
                      borderRadius: 8,
                      borderColor: isDark ? Colors.border.dark : Colors.border.light,
                    }}
                  />
                </View>
                <View style={styles.mapWrapper}>
                  <MapView showButtons={false} coords={coords || undefined} handleMapPress={handleMapPress} />
                </View>
                {loading ? (
                  <ActivityIndicator size="small" color={isDark ? Colors.icons.dark : Colors.icons.light} />
                ) : (
                  <View style={{ marginTop: 15 }}>
                    <HStack style={{ gap: 10 }}>
                      <Text size="sm">Location</Text>
                      <Text style={styles.errorMessage}>Error message here</Text>
                    </HStack>
                    <TextInput
                      placeholder={'Enter your Location'}
                      value={location}
                      onChangeText={setLocation}
                      style={{
                        borderWidth: 1,
                        borderRadius: 8,
                        borderColor: isDark ? Colors.border.dark : Colors.border.light,
                      }}
                    />
                  </View>
                )}
                {coords && (
                  <Text style={{ marginTop: 10 }}>
                    Lat: {Number(coords[1]).toFixed(6)}, Lng: {Number(coords[0]).toFixed(6)}
                  </Text>
                )}
              </VStack>
            )}
            <Button
              onPress={() => {
                handleSaveLocation;
              }}
              style={{ marginTop: 20 }}
            >
              <Text size="sm">Save Location</Text>
            </Button>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
      {FABisVisible && (
        <Fab
          size="lg"
          placement="bottom right"
          onPress={() => {
            handleAddNewLocation();
          }}
          isHovered={false}
          isDisabled={false}
          isPressed={false}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            elevation: 8,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            backgroundColor: '#3b82f6', // Green when location selected
            zIndex: 10,
          }}
        >
          <Plus size={30} color="white" />
        </Fab>
      )}
      <CustomAlertDialog
        showAlertDialog={showSuccessDialog}
        handleClose={handleClose}
        text="Location saved successfully"
      />
    </>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: (StatusBar.currentHeight || 0) + 10,
    height: '100%',
    width: '100%',
  },
  mapWrapper: {
    flex: 1,
    width: '100%',
    marginTop: 20,
    height: 400,
  },
  item: {
    padding: 20,
    height: 'auto',
    width: '100%',
    borderRadius: 8,
  },
  title: {
    fontSize: 32,
  },
  errorMessage: {
    color: Colors.semantic.error,
  },
});
