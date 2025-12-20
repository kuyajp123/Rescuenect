import { getAddress } from '@/API/getAddress';
import { Button } from '@/components/components/button/Button';
import Modal from '@/components/components/Modal';
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
import { cleanAddress } from '@/helper/commonHelpers';
import { storageHelpers } from '@/helper/storage';
import { useAuth } from '@/store/useAuth';
import { useSavedLocationsStore } from '@/store/useSavedLocationsStore';
import { EvacuationCenter } from '@/types/components';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { ChevronRight, LocateFixed, MapPin, Plus, Trash } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

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
  isDark: boolean;
};

const Item = ({ item, onPress, isDark }: ItemProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.item,
      {
        backgroundColor: isDark ? Colors.background.dark : 'white',
        borderColor: isDark ? Colors.border.dark : Colors.border.light,
        opacity: pressed ? 0.7 : 1,
      },
    ]}
  >
    <HStack className="items-center gap-3">
      <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
        <MapPin size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
      </View>
      <VStack className="flex-1">
        <Text size="md" bold numberOfLines={1}>
          {item.label}
        </Text>
        <Text emphasis="light" size="xs" numberOfLines={1}>
          {item.location}
        </Text>
      </VStack>
      <ChevronRight size={16} color={isDark ? Colors.icons.dark : Colors.icons.light} />
    </HStack>
  </Pressable>
);

const SaveLocationScreen = () => {
  const [selectedId, setSelectedId] = useState<string>();
  const [label, setLabel] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [location, setLocation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Mode state: 'list' or 'form'
  const [mode, setMode] = useState<'list' | 'form'>('list');

  // Snap points
  const snapPoints = useMemo(() => ['30%', '60%', '90%'], []);

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

  // Map savedLocations to format expected by MapView (EvacuationCenter like structure)
  const mapMarkers: EvacuationCenter[] = useMemo(() => {
    return savedLocations.map(
      loc =>
        ({
          id: loc.id,
          name: loc.label, // borrowing name field
          coordinates: {
            lat: loc.lat,
            lng: loc.lng,
          },
          capacity: 0,
          current_population: 0,
          status: 'active',
          type: 'evacuation-center',
        } as any)
    );
  }, [savedLocations]);

  const handleItemPress = (itemId: string) => {
    const selectedLocation = savedLocations.find(location => location.id === itemId);

    if (selectedLocation) {
      setSelectedId(itemId);
      setLabel(selectedLocation.label);
      setLocation(selectedLocation.location);
      setCoords({ lat: selectedLocation.lat, lng: selectedLocation.lng });
      setErrMessage({ label: '', location: '', message: '' });

      // Switch to form mode
      setMode('form');
      bottomSheetRef.current?.snapToIndex(1); // Snap to 50%
    }
  };

  const handleAddNewLocation = () => {
    setSelectedId(undefined);
    setLabel('');
    setLocation('');
    setCoords(null);
    setErrMessage({ label: '', location: '', message: '' });

    setMode('form');
    // Snap to 50% to allow seeing the map
    bottomSheetRef.current?.snapToIndex(1);
  };

  const handleBackToList = () => {
    setMode('list');
    setSelectedId(undefined);
    setCoords(null);
    bottomSheetRef.current?.snapToIndex(0); // Snap to peek
    Keyboard.dismiss();
  };

  // Close Custom Alert
  const handleClose = () => {
    Animated.timing(scaleValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccessDialog(false);
    });
  };

  // Auto close alert
  useEffect(() => {
    if (showSuccessDialog) {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog]);

  const handleMapPress = useCallback(
    (event: any) => {
      // Only allow setting a pin if in 'form' mode
      if (mode !== 'form') return;

      let mapCoords = null;
      if (event && event.geometry && event.geometry.coordinates) {
        mapCoords = event.geometry.coordinates;
      } else if (event && event.coordinates) {
        mapCoords = event.coordinates;
      } else if (event && event.nativeEvent && event.nativeEvent.coordinate) {
        mapCoords = [event.nativeEvent.coordinate.longitude, event.nativeEvent.coordinate.latitude];
      }

      if (!mapCoords || mapCoords.length !== 2) return;

      const markerCoordinate: { lat: number; lng: number } = { lat: mapCoords[1], lng: mapCoords[0] };
      setCoords(markerCoordinate);

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
              setLocation(cleanAddress(address.address));
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
        setLocation(`${markerCoordinate.lat.toFixed(6)}, ${markerCoordinate.lng.toFixed(6)}`);
      }
    },
    [mode, authUser, errMessage]
  );

  // Track sheet index
  const [sheetIndex, setSheetIndex] = useState(0);

  // Handle hardware back
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (mode === 'form') {
          handleBackToList();
          return true;
        }
        if (sheetIndex > 0) {
          bottomSheetRef.current?.snapToIndex(0);
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [mode, sheetIndex])
  );

  const handleSaveLocation = async () => {
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
      newErrors.message = 'Please tap the map to select a location';
      hasErrors = true;
    }

    setErrMessage(newErrors);
    if (hasErrors) return;

    // ... (Use existing save logic logic but condensed)
    try {
      // Construct item
      const newItem: ItemData = {
        id: selectedId || `${label}-${Math.random()}`, // simplistic ID for local
        label,
        location,
        lat: coords!.lat,
        lng: coords!.lng,
      };

      if (!authUser) {
        // Local save only
        let updatedLocations = selectedId
          ? savedLocations.map(l => (l.id === selectedId ? newItem : l))
          : [...savedLocations, newItem];

        await storageHelpers.setData<ItemData[]>(STORAGE_KEYS.SAVED_LOCATIONS, updatedLocations);
        setSavedLocations(updatedLocations);
      } else {
        // Backend save
        const idToken = await authUser.getIdToken();
        const response = await axios.post(
          API_ROUTES.DATA.SAVE_LOCATION,
          { ...newItem, uid: authUser.uid, id: selectedId || undefined },
          { headers: { Authorization: `Bearer ${idToken}` } }
        );

        // Assume success and update local state to reflect what backend returned or just optimistic update
        // Ideally we use backend response ID
        const finalItem = { ...newItem, id: response.data.id || newItem.id };
        let updatedLocations = selectedId
          ? savedLocations.map(l => (l.id === selectedId ? finalItem : l))
          : [...savedLocations, finalItem];

        await storageHelpers.setData<ItemData[]>(STORAGE_KEYS.SAVED_LOCATIONS, updatedLocations);
        setSavedLocations(updatedLocations);
      }

      // Success
      setShowSuccessDialog(true);
      handleBackToList();
    } catch (e: any) {
      setErrMessage({ ...newErrors, message: e.message || 'Error saving' });
    }
  };

  const handleLocationDeletion = async (id: string) => {
    setDeleteLoading(true);
    try {
      const updatedLocations = savedLocations.filter(l => l.id !== id);
      if (authUser) {
        const idToken = await authUser.getIdToken();
        await axios.delete(API_ROUTES.DATA.DELETE_LOCATION, {
          data: { id, uid: authUser.uid },
          headers: { Authorization: `Bearer ${idToken}` },
        });
      }
      await storageHelpers.setData<ItemData[]>(STORAGE_KEYS.SAVED_LOCATIONS, updatedLocations);
      setSavedLocations(updatedLocations);

      setDeleteModalVisible(false);
      handleBackToList();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Body style={{ padding: 0 }}>
      {/* 1. Map Background - Full Screen */}
      <View style={StyleSheet.absoluteFill}>
        <MapView
          centerCoordinate={coords ? [coords.lng, coords.lat] : undefined}
          showButtons={false} // Hide map component buttons to avoid clutter using our own UI if needed
          hasAnimation={true}
          coords={coords || undefined} // This shows the 'green' pin for current selection
          data={mode === 'list' ? mapMarkers : undefined} // Show all pins in list mode
          handleMapPress={handleMapPress}
          interactive={true}
          onMarkerPress={handleItemPress}
        />
      </View>

      {/* 2. Floating Title/UI Elements if needed, e.g. Back button */}
      {/* We can rely on BottomSheet covering bottom part */}

      {/* 3. Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        enablePanDownToClose={false}
        onChange={setSheetIndex}
        backgroundStyle={{
          backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? Colors.border.light : Colors.border.dark,
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
        >
          {mode === 'list' ? (
            <VStack space="md">
              <HStack className="items-center justify-between mb-2">
                <Text size="xl" bold>
                  Saved Locations
                </Text>
                {/* Add Button in Header */}
              </HStack>
              {savedLocations.length === 0 ? (
                <View className="py-10 items-center">
                  <Text emphasis="light">No saved locations.</Text>
                  <Button onPress={handleAddNewLocation} style={{ marginTop: 10 }}>
                    <Text style={{ color: 'white' }}>Add Location</Text>
                  </Button>
                </View>
              ) : (
                savedLocations.map((item, idx) => (
                  <Item key={item.id || idx} item={item} onPress={() => handleItemPress(item.id)} isDark={isDark} />
                ))
              )}
            </VStack>
          ) : (
            /* FORM MODE */
            <VStack space="md">
              <HStack className="items-center justify-between mb-4">
                <HStack className="items-center gap-2">
                  <Pressable onPress={handleBackToList}>
                    <ChevronRight
                      size={24}
                      color={isDark ? Colors.text.dark : Colors.text.light}
                      style={{ transform: [{ rotate: '180deg' }] }}
                    />
                  </Pressable>
                  <Text size="xl" bold>
                    {selectedId ? 'Edit Location' : 'New Location'}
                  </Text>
                </HStack>
                {selectedId && (
                  <Pressable onPress={() => setDeleteModalVisible(true)}>
                    <Trash size={20} color={Colors.semantic.error} />
                  </Pressable>
                )}
              </HStack>

              {/* Inputs */}
              <VStack space="sm">
                <Text size="sm" bold>
                  Label
                </Text>
                <TextInput
                  placeholder="e.g. Home, Office"
                  value={label}
                  onChangeText={setLabel}
                  style={[
                    styles.input,
                    {
                      color: isDark ? Colors.text.dark : Colors.text.light,
                      borderColor: isDark ? Colors.border.dark : Colors.border.light,
                    },
                  ]}
                />
                {errMessage.label ? <Text style={styles.errorText}>{errMessage.label}</Text> : null}
              </VStack>

              <VStack space="sm">
                <Text size="sm" bold>
                  Location
                </Text>
                <TextInput
                  placeholder="Tap on map to select..."
                  value={location}
                  onChangeText={setLocation}
                  multiline
                  style={[
                    styles.input,
                    {
                      color: isDark ? Colors.text.dark : Colors.text.light,
                      borderColor: isDark ? Colors.border.dark : Colors.border.light,
                      minHeight: 60,
                    },
                  ]}
                />
                {errMessage.location ? <Text style={styles.errorText}>{errMessage.location}</Text> : null}
              </VStack>

              {errMessage.message ? <Text style={styles.errorText}>{errMessage.message}</Text> : null}

              <Button onPress={handleSaveLocation} style={{ marginTop: 10 }}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white' }} bold>
                    Save Location
                  </Text>
                )}
              </Button>

              <VStack className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <HStack className="gap-2 items-center">
                  <LocateFixed size={16} color={Colors.brand.light} />
                  <Text size="xs" style={{ color: Colors.brand.light }}>
                    Tip: Tap anywhere on the map to set the pin.
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          )}
        </BottomSheetScrollView>
      </BottomSheet>

      {/* FAB (Only in List Mode) */}
      {mode === 'list' && savedLocations.length > 0 && (
        <Fab size="lg" placement="bottom right" onPress={handleAddNewLocation} style={styles.fab}>
          <Plus size={30} color="white" />
        </Fab>
      )}

      <CustomAlertDialog
        showAlertDialog={showSuccessDialog}
        handleClose={handleClose}
        text={selectedId ? 'Location updated' : 'Location saved'}
      />

      <LoadingOverlay visible={deleteLoading} message="Deleting..." />

      <Modal
        modalVisible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        primaryText="Delete Location"
        secondaryText="Are you sure you want to delete this saved location?"
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        primaryButtonOnPress={() => handleLocationDeletion(selectedId!)}
        secondaryButtonOnPress={() => setDeleteModalVisible(false)}
        primaryButtonAction="error"
        primaryButtonVariant="solid"
      />
    </Body>
  );
};

const styles = StyleSheet.create({
  item: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  errorText: {
    color: Colors.semantic.error,
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 20, // Adjust based on bottom sheet snap if needed, but absolute works fine if sheet is peeked
    right: 20,
    backgroundColor: Colors.brand.light,
    elevation: 4,
  },
});

export default SaveLocationScreen;
