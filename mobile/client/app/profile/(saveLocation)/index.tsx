import { getAddress } from '@/API/getAddress';
import { Button, HoveredButton } from '@/components/components/button/Button';
import Modal from '@/components/components/Modal';
import { cleanAddress } from '@/components/helper/commonHelpers';
import { storageHelpers } from '@/components/helper/storage';
import { useAuth } from '@/components/store/useAuth';
import { useSavedLocationsStore } from '@/components/store/useSavedLocationsStore';
import CustomAlertDialog from '@/components/ui/CustomAlertDialog';
import { Fab } from '@/components/ui/fab';
import { HStack } from '@/components/ui/hstack';
import Body from '@/components/ui/layout/Body';
import { LoadingOverlay } from '@/components/ui/loading';
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
import { Plus, Trash, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, BackHandler, Keyboard, StyleSheet, TextInput, View } from 'react-native';

type ItemData = {
  id: string;
  label: string;
  location: string;
  lat: number;
  lng: number;
};

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
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null); // lat lng
  const [location, setLocation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [bottomSheetIndex, setBottomSheetIndex] = useState<number>(-1);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const scrollViewRef = useRef<any>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const { isDark } = useTheme();
  const authUser = useAuth(state => state.authUser);
  const scaleValue = useRef(new Animated.Value(0)).current;
  const savedLocations = useSavedLocationsStore(state => state.savedLocations);
  const setSavedLocations = useSavedLocationsStore(state => state.setSavedLocations);
  const [errMessage, setErrMessage] = useState<{ label: string; location: string; message: string }>({
    label: '',
    location: '',
    message: '',
  });
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const getSavedLocations = await storageHelpers.getData<ItemData[]>(STORAGE_KEYS.SAVED_LOCATIONS);
        setSavedLocations(getSavedLocations ?? []);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', event => {
      setKeyboardHeight(event.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      // Scroll back to top when keyboard hides
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: 0,
          animated: true,
        });
      }
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  useEffect(() => {
    if (coords?.lat !== null && coords?.lng !== null) {
      setErrMessage({ ...errMessage, location: '', message: '' });
    }
  }, [coords]);

  const handleItemPress = (itemId: string) => {
    setSelectedId(itemId);

    // Find the selected location data
    const selectedLocation = savedLocations.find(location => location.id === itemId);

    if (selectedLocation) {
      // Populate the form with existing data
      setLabel(selectedLocation.label);
      setLocation(selectedLocation.location);
      setCoords({ lat: selectedLocation.lat, lng: selectedLocation.lng });

      // Clear any existing error messages
      setErrMessage({ label: '', location: '', message: '' });
    }

    // Open bottom sheet to 100% when item is clicked
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleAddNewLocation = () => {
    setSelectedId(undefined);

    // Clear all form data when creating new location
    setLabel('');
    setLocation('');
    setCoords(null);
    setErrMessage({ label: '', location: '', message: '' });

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

  const handleInputFocus = (inputType: 'label' | 'location') => {
    setTimeout(() => {
      if (scrollViewRef.current && keyboardHeight > 0) {
        // Scroll to different positions based on which input is focused
        const scrollOffset = inputType === 'label' ? 200 : 600;
        scrollViewRef.current.scrollTo({
          y: scrollOffset,
          animated: true,
        });
      }
    }, 300); // Wait for keyboard animation
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

      const markerCoordinate: { lat: number; lng: number } = { lat: mapCoords[1], lng: mapCoords[0] };
      setCoords(markerCoordinate);

      // Clear error message when user selects a location
      if (errMessage.location) {
        setErrMessage({ ...errMessage, location: '' });
      }

      if (authUser) {
        setLoading(true);
        const fetchAddress = async () => {
          try {
            const idToken = await authUser.getIdToken();
            const address = await getAddress(markerCoordinate.lat, markerCoordinate.lng, idToken);
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
        // If bottom sheet is actively open (index > -1), close it and prevent default back action
        if (bottomSheetIndex > -1) {
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
    // Create a new error object to track validation errors
    let newErrors = { label: '', location: '', message: '' };
    let hasErrors = false;

    if (!label) {
      newErrors.label = 'Label is required';
      hasErrors = true;
    }

    if (!location) {
      newErrors.location = 'Location is required';
      hasErrors = true;
    }

    if (!coords) {
      newErrors.message = 'Please select a location on the map';
      hasErrors = true;
    }

    // Update the error state
    setErrMessage(newErrors);

    // If there are validation errors, stop execution
    if (hasErrors) {
      console.log('Validation errors exist, not saving location', newErrors);
      return;
    }

    // Handle unauthenticated users - save to local storage only
    if (!authUser) {
      try {
        let updatedLocations: ItemData[];

        if (selectedId) {
          // Update existing location
          const updatedLocation: ItemData = {
            id: selectedId,
            label,
            location,
            lat: coords!.lat,
            lng: coords!.lng,
          };

          updatedLocations = savedLocations.map(loc => (loc.id === selectedId ? updatedLocation : loc));
        } else {
          // Create new location
          const newLocation: ItemData = {
            id: `${label}-${coords!.lat.toFixed(6)}-${coords!.lng.toFixed(6)}-${Math.random()
              .toString(36)
              .substring(2, 8)}`,
            label,
            location,
            lat: coords!.lat,
            lng: coords!.lng,
          };
          updatedLocations = [...savedLocations, newLocation];
        }

        // Save to AsyncStorage and update state
        await storageHelpers.setData<ItemData[]>(STORAGE_KEYS.SAVED_LOCATIONS, updatedLocations);
        setSavedLocations(updatedLocations);

        // Clear form and show success
        setLabel('');
        setCoords(null);
        setLocation('');
        setSelectedId(undefined);
        setShowSuccessDialog(true);
        bottomSheetRef.current?.close();
      } catch (error) {
        console.error('Error saving location locally:', error);
        setErrMessage({
          ...errMessage,
          message: 'Error saving location locally: ' + (error instanceof Error ? error.message : 'Unknown error'),
        });
      }

      return;
    }

    try {
      const idToken = await authUser?.getIdToken();
      const response = await axios.post(
        API_ROUTES.DATA.SAVE_LOCATION,
        {
          id: selectedId ? selectedId : undefined,
          label,
          location,
          lat: coords!.lat,
          lng: coords!.lng,
          uid: authUser?.uid,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (response.status === 200) {
        if (selectedId) {
          // Update existing location
          const updatedLocation: ItemData = {
            id: selectedId,
            label,
            location,
            lat: coords!.lat,
            lng: coords!.lng,
          };

          const updatedSavedLocations = savedLocations.map(loc => (loc.id === selectedId ? updatedLocation : loc));

          await storageHelpers.setData<ItemData[]>(STORAGE_KEYS.SAVED_LOCATIONS, updatedSavedLocations);
          setSavedLocations(updatedSavedLocations);
        } else {
          // Create new location
          const newLocation: ItemData = {
            id: response.data.id,
            label,
            location,
            lat: coords!.lat,
            lng: coords!.lng,
          };

          const currentSavedLocations = Array.isArray(savedLocations) ? savedLocations : [];
          const updatedSavedLocations = [...currentSavedLocations, newLocation];

          await storageHelpers.setData<ItemData[]>(STORAGE_KEYS.SAVED_LOCATIONS, updatedSavedLocations);
          setSavedLocations(updatedSavedLocations);
        }
      }

      setLabel('');
      setCoords(null);
      setLocation('');
      setSelectedId(undefined);
      setShowSuccessDialog(true);
      bottomSheetRef.current?.close();
    } catch (error) {
      setErrMessage({
        ...errMessage,
        message: 'Error saving location: ' + (error instanceof Error ? error.message : 'Unknown error'),
      });
      console.error('Error saving location:', error);
    }
  };

  const handleLocationDeletion = async (id: ItemData['id']) => {
    if (!id) return;

    try {
      setDeleteLoading(true);
      const updatedLocations = savedLocations.filter(location => location.id !== id);

      if (authUser) {
        const idToken = await authUser.getIdToken();
        const response = await axios.delete(API_ROUTES.DATA.DELETE_LOCATION, {
          data: { id, uid: authUser.uid },
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (response.status === 200) {
          await storageHelpers.setData<ItemData[]>(STORAGE_KEYS.SAVED_LOCATIONS, updatedLocations);
          setSavedLocations(updatedLocations);
        }
      } else {
        // For unauthenticated users, delete from local storage only
        await storageHelpers.setData<ItemData[]>(STORAGE_KEYS.SAVED_LOCATIONS, updatedLocations);
        setSavedLocations(updatedLocations);
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      setErrMessage({
        ...errMessage,
        message: 'Error deleting location: ' + (error instanceof Error ? error.message : 'Unknown error'),
      });

      setDeleteModalVisible(false);
      setDeleteLoading(false);
      return;
    }

    setDeleteLoading(false);
    setDeleteModalVisible(false);
    bottomSheetRef.current?.close();
  };

  return (
    <>
      <Body style={{ padding: 0 }}>
        <View style={{ padding: 20 }}>
          <Text size="3xl" bold>
            Saved Locations
          </Text>
        </View>
        {savedLocations.length === 0 ? (
          <View style={{ flex: 1, height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <Text size="sm" emphasis="light">
              No Save Locations yet.
            </Text>
          </View>
        ) : (
          <View style={styles.container}>
            {savedLocations.map((item, index) => (
              <Item key={`${item.id}-${index}`} item={item} onPress={() => handleItemPress(item.id)} />
            ))}
          </View>
        )}
      </Body>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['100%']}
        onChange={handleSheetChanges}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        enableContentPanningGesture={false}
        backgroundStyle={{
          backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
        }}
      >
        <BottomSheetScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 0,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          <View style={{ display: 'flex', justifyContent: 'flex-end', gap: 15, flexDirection: 'row', width: '100%' }}>
            {selectedId && (
              <Trash
                size={24}
                color={isDark ? Colors.icons.dark : Colors.icons.light}
                onPress={() => setDeleteModalVisible(true)}
              />
            )}
            <X
              size={24}
              color={isDark ? Colors.icons.dark : Colors.icons.light}
              onPress={() => bottomSheetRef.current?.close()}
            />
          </View>
          <View>
            {selectedId ? (
              <VStack>
                <HStack style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text size="lg">Update Location</Text>
                  {/* <Text size="sm" emphasis="light">
                    ID: {selectedId.slice(-8)}
                  </Text> */}
                </HStack>
                <View style={{ marginTop: 15 }}>
                  <HStack style={{ gap: 10 }}>
                    <Text size="sm">Label</Text>
                    <Text style={styles.errorMessage}>{errMessage.label}</Text>
                  </HStack>
                  <TextInput
                    placeholder="Enter Label"
                    value={label}
                    onChangeText={text => {
                      setLabel(text);
                      // Clear error message when user starts typing
                      if (errMessage.label) {
                        setErrMessage({ ...errMessage, label: '' });
                      }
                    }}
                    onFocus={() => {
                      handleInputFocus('label');
                    }}
                    style={{
                      borderWidth: 1,
                      borderRadius: 8,
                      borderColor: isDark ? Colors.border.dark : Colors.border.light,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      fontSize: 16,
                    }}
                  />
                </View>
                <View style={styles.mapWrapper}>
                  <MapView
                    centerCoordinate={coords ? [coords.lng, coords.lat] : undefined}
                    showButtons={false}
                    hasAnimation={false}
                    coords={coords || undefined}
                    handleMapPress={handleMapPress}
                  />
                </View>
                {loading ? (
                  <ActivityIndicator size="small" color={isDark ? Colors.icons.dark : Colors.icons.light} />
                ) : (
                  <View style={{ marginTop: 15 }}>
                    <HStack style={{ gap: 10 }}>
                      <Text size="sm">Location</Text>
                      <Text style={styles.errorMessage}>{errMessage.location}</Text>
                    </HStack>
                    <TextInput
                      placeholder={'Enter your Location'}
                      value={location}
                      onChangeText={text => {
                        setLocation(text);
                        // Clear error message when user starts typing
                        if (errMessage.location) {
                          setErrMessage({ ...errMessage, location: '' });
                        }
                      }}
                      onFocus={() => {
                        handleInputFocus('location');
                      }}
                      numberOfLines={2}
                      style={{
                        borderWidth: 1,
                        borderRadius: 8,
                        borderColor: isDark ? Colors.border.dark : Colors.border.light,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        fontSize: 16,
                        textAlignVertical: 'top',
                      }}
                    />
                  </View>
                )}
                {coords && (
                  <Text style={{ marginTop: 10 }}>
                    Lat: {Number(coords.lat).toFixed(6)}, Lng: {Number(coords.lng).toFixed(6)}
                  </Text>
                )}
              </VStack>
            ) : (
              <VStack>
                <Text size="lg">Add new Location</Text>
                <View style={{ marginTop: 15 }}>
                  <HStack style={{ gap: 10 }}>
                    <Text size="sm">Label</Text>
                    <Text style={styles.errorMessage}>{errMessage.label}</Text>
                  </HStack>
                  <TextInput
                    placeholder="Enter Label"
                    value={label}
                    onChangeText={text => {
                      setLabel(text);
                      // Clear error message when user starts typing
                      if (errMessage.label) {
                        setErrMessage({ ...errMessage, label: '' });
                      }
                    }}
                    onFocus={() => {
                      handleInputFocus('label');
                    }}
                    style={{
                      borderWidth: 1,
                      borderRadius: 8,
                      borderColor: isDark ? Colors.border.dark : Colors.border.light,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      fontSize: 16,
                    }}
                  />
                </View>
                <View style={styles.mapWrapper}>
                  <MapView
                    hasAnimation={false}
                    showButtons={false}
                    coords={coords || undefined}
                    handleMapPress={handleMapPress}
                  />
                </View>
                {loading ? (
                  <ActivityIndicator size="small" color={isDark ? Colors.icons.dark : Colors.icons.light} />
                ) : (
                  <View style={{ marginTop: 15 }}>
                    <HStack style={{ gap: 10 }}>
                      <Text size="sm">Location</Text>
                      <Text style={styles.errorMessage}>{errMessage.location}</Text>
                    </HStack>
                    <TextInput
                      placeholder={'Enter your Location'}
                      value={location}
                      onChangeText={text => {
                        setLocation(text);
                        // Clear error message when user starts typing
                        if (errMessage.location) {
                          setErrMessage({ ...errMessage, location: '' });
                        }
                      }}
                      onFocus={() => {
                        handleInputFocus('location');
                      }}
                      numberOfLines={2}
                      style={{
                        borderWidth: 1,
                        borderRadius: 8,
                        borderColor: isDark ? Colors.border.dark : Colors.border.light,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        fontSize: 16,
                        textAlignVertical: 'top',
                      }}
                    />
                  </View>
                )}
                {coords && (
                  <Text style={{ marginTop: 10 }}>
                    Lat: {Number(coords.lat).toFixed(6)}, Lng: {Number(coords.lng).toFixed(6)}
                  </Text>
                )}
              </VStack>
            )}
            <Text>
              <Text style={[styles.errorMessage, { marginTop: 10 }]}>{errMessage.message}</Text>
            </Text>
            <Button onPress={handleSaveLocation}>
              <Text style={{ color: 'white' }} size="sm">
                {selectedId ? 'Update Location' : 'Save Location'}
              </Text>
            </Button>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
      {FABisVisible && (
        <Fab
          size="lg"
          placement="bottom right"
          onPress={handleAddNewLocation}
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
            backgroundColor: '#3b82f6',
            zIndex: 10,
          }}
        >
          <Plus size={30} color="white" />
        </Fab>
      )}
      <CustomAlertDialog
        showAlertDialog={showSuccessDialog}
        handleClose={handleClose}
        text={selectedId ? 'Location updated successfully' : 'Location saved successfully'}
      />
      <LoadingOverlay
        visible={deleteLoading}
        width={300}
        message="Deleting location..."
        onRequestClose={() => setDeleteLoading(false)}
      />
      <Modal
        modalVisible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        primaryText="Delete Location"
        secondaryText="Are you sure you want to delete this location?"
        primaryButtonText="Confirm"
        secondaryButtonText="No"
        primaryButtonOnPress={() => handleLocationDeletion(selectedId!)}
        secondaryButtonOnPress={() => setDeleteModalVisible(false)}
      />
    </>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
