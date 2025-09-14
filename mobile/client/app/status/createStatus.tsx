import CustomImagePicker, { useImagePickerStore } from '@/components/components/CustomImagePicker';
import Map, { CustomButton, RadioField, TextInputField, ToggleField } from '@/components/components/Map';
import { formatContactNumber, formatName, getCurrentPositionOnce, isValidContactNumber } from '@/components/helper/commonHelpers';
import { storage } from '@/components/helper/storage';
import { StatusForm } from '@/components/shared/types/components';
import { ButtonRadio } from '@/components/ui/CustomRadio';
import { HStack } from '@/components/ui/hstack';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useCoords } from '@/contexts/MapContext';
import { Bookmark, Info, Navigation } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { useAuth } from '@/components/store/useAuth';
import { LoadingOverlay } from '@/components/ui/loading/LoadingOverlay';

export const createStatus = () => {
  const insets = useSafeAreaInsets();
  const { image } = useImagePickerStore();
  const [formErrors, setFormErrors] = useState<Partial<StatusForm>>({});
  const { coords, setCoords, oneTimeLocationCoords, setOneTimeLocationCoords, setFollowUserLocation } = useCoords();
  const savedLocation: [number, number] = [120.7752839, 14.2919325]; // simulate saved location
  // const savedLocation: [number, number] | null = null; // simulate saved location
  const [locationName, setLocationName] = useState<string>('Location Name must be here'); // simulate openCage response
  const [selectedCoords, setSelectedCoords] = useState<[number, number]>([0, 0]);
  const [hasUserTappedMap, setHasUserTappedMap] = useState(false); // Track if user has tapped on map
  const [isManualSelection, setIsManualSelection] = useState(false); // Track if user is making manual ButtonRadio selection
  const [isGPSselection, setIsGPSselection] = useState(false); // Track if user has selected GPS option
  const { authUser } = useAuth();
  const [submitStatusLoading, setSubmitStatusLoading] = useState(false);
  
  const [statusForm, setStatusForm] = useState<StatusForm>({
    uid: authUser?.uid || '',
    firstName: '',
    lastName: '',
    statusType: '',
    phoneNumber: '',
    lat: null,
    lng: null,
    loc: null,
    image: '',
    note: '',
    shareLocation: true,
    shareContact: true,
  });

  const getStorage = async () => {
    const user = await storage.get('@user');
    return user;
  }

  useEffect(() => {
    getStorage().then(data => {
      if (data) {
        setStatusForm(prev => ({
          ...prev,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phoneNumber: data.phoneNumber || '',
        }));
      }
    });

  }, []);

  // Update form coordinates and handle default selection priority
  useEffect(() => {
    if (coords) {
      setStatusForm(prev => ({
        ...prev,
        lng: coords[0],
        lat: coords[1]
      }));
      
      // Priority 1: If user has tapped map, coords becomes default
      if (hasUserTappedMap) {
        setSelectedCoords(coords);
      }
      // Priority 2: If no user tap yet, and this is first coords (saved location or GPS), set as default
      else if (selectedCoords[0] === 0 && selectedCoords[1] === 0) {
        setSelectedCoords(coords);
      }
    }
  }, [coords, selectedCoords, hasUserTappedMap]);

  // Track when user taps map (coords change significantly from last selected)
  useEffect(() => {
    if (coords && !isManualSelection) {
      // Check if this is a new map tap (coordinates changed significantly)
      const distanceThreshold = 0.001; // ~100 meters
      const latDiff = Math.abs(coords[1] - selectedCoords[1]);
      const lngDiff = Math.abs(coords[0] - selectedCoords[0]);
      
      if (latDiff > distanceThreshold || lngDiff > distanceThreshold) {
        // User tapped a new location on map
        setHasUserTappedMap(true);
        setSelectedCoords(coords); // Tapped location becomes default
        console.log('User tapped map, new default location:', coords);
      }
    }
    
    // Reset manual selection flag after processing
    if (isManualSelection) {
      setIsManualSelection(false);
    }
  }, [coords, selectedCoords, isManualSelection]);

  // Handle GPS availability (secondary priority)
  useEffect(() => {
    if (oneTimeLocationCoords) {
      // If no user tap and no current selection, GPS can be default
      if (!hasUserTappedMap && selectedCoords[0] === 0 && selectedCoords[1] === 0) {
        setSelectedCoords(oneTimeLocationCoords);
        setStatusForm(prev => ({
          ...prev,
          lng: oneTimeLocationCoords[0],
          lat: oneTimeLocationCoords[1]
        }));
        console.log('GPS set as default location:', oneTimeLocationCoords);
      }
    }
  }, [oneTimeLocationCoords, hasUserTappedMap, selectedCoords]);

  // Update image when image picker store changes
  useEffect(() => {
    setStatusForm(prev => ({
      ...prev,
      image: image || ''
    }));
  }, [image]);

  useEffect(() => {
    setOneTimeLocationCoords(null);
    setFollowUserLocation(false);
  }, [])

  const handleInputChange = useCallback((field: keyof StatusForm, value: string | boolean) => {
    if (field === 'phoneNumber' && typeof value === 'string') {
      value = formatContactNumber(value);
    }
    if (field === 'firstName' && typeof value === 'string') {
      value = formatName(value);
    }
    if (field === 'lastName' && typeof value === 'string') {
      value = formatName(value);
    }
    
    setStatusForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
        errMessage: '',
      }));
    }
  }, [formErrors]);

  const handleSubmit = useCallback(async () => {
    // Validate form
    const errors: Partial<StatusForm> = {};
    
    if (!statusForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!statusForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!statusForm.statusType) {
      errors.statusType = 'Status is required';
    }
    if (!statusForm.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    }
    if (!isValidContactNumber(statusForm.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid mobile number';
    }
    if (Object.keys(errors).length > 0) {
      errors.errMessage = 'Please fill out all required fields.';
      setFormErrors(errors);
      return;
    }
    
    // Submit form data
    console.log('Submitting status form:', statusForm);
    // Here you would typically send the data to your backend

    try {
      setSubmitStatusLoading(true);
      const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/createStatus`, statusForm);
      console.log('Form submitted successfully:', response.data);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatusLoading(false);
      throw new Error('Error submitting form: ' + error);
    } finally {
      setSubmitStatusLoading(false);
    }
  }, [statusForm]);

  // Define text input fields
  const textInputFields: TextInputField[] = useMemo(() => [
    {
      key: 'firstName',
      label: 'First Name',
      placeholder: 'Enter your First Name',
      value: statusForm.firstName,
      onChangeText: (text) => handleInputChange('firstName', text),
      errorText: formErrors.firstName,
    },
    {
      key: 'lastName',
      label: 'Last Name', 
      placeholder: 'Enter your Last Name',
      value: statusForm.lastName,
      onChangeText: (text) => handleInputChange('lastName', text),
      errorText: formErrors.lastName,
    },
    {
      key: 'phoneNumber',
      label: 'Contact Number',
      placeholder: 'Enter your Contact Number',
      value: statusForm.phoneNumber,
      onChangeText: (text) => handleInputChange('phoneNumber', text),
      errorText: formErrors.phoneNumber,
    },
    {
      key: 'note',
      label: 'Leave a Note',
      placeholder: 'Enter some Note',
      value: statusForm.note,
      onChangeText: (text) => handleInputChange('note', text),
      multiline: true,
      numberOfLines: 4,
      maxLength: 500,
    },
  ], [statusForm, formErrors, handleInputChange]);

  // Define radio fields
  const radioFields: RadioField[] = useMemo(() => [
    {
      key: 'status',
      label: 'Set your Status',
      options: [
        { label: 'Safe', value: 'safe' },
        { label: 'Evacuated', value: 'evacuated' },
        { label: 'Affected', value: 'affected' },
        { label: 'Missing', value: 'missing' },
      ],
      selectedValue: statusForm.statusType,
      onSelect: (value) => handleInputChange('statusType', value),
      errorText: formErrors.statusType,
    },
  ], [statusForm.statusType, formErrors.statusType, handleInputChange]);

  // Define toggle fields
  const toggleFields: ToggleField[] = useMemo(() => [
    {
      key: 'shareLocation',
      label: 'Share my Location',
      isEnabled: statusForm.shareLocation,
      onToggle: () => handleInputChange('shareLocation', !statusForm.shareLocation),
    },
    {
      key: 'shareContact',
      label: 'Share my Contact Number',
      isEnabled: statusForm.shareContact,
      onToggle: () => handleInputChange('shareContact', !statusForm.shareContact),
    },
  ], [statusForm.shareLocation, statusForm.shareContact, handleInputChange]);

  // Define quick action buttons
  const quickActionButtons: CustomButton[] = useMemo(() => [
    {
      key: 'saved-location',
      label: 'saved location',
      icon: <Bookmark size={16} color={'white'} />,
      onPress: () => {
        // Handle saved location functionality
        console.log('Loading saved location');
        if (savedLocation) {
          setCoords(savedLocation);
          setHasUserTappedMap(false); // Reset tap status since this is saved location
          console.log('Set saved location as coords:', savedLocation);
        }
      }
    },
    {
      key: 'location-services',
      label: 'Turn on location',
      icon: <Navigation size={16} color={'white'} />,
      onPress: async () => {
        // Handle one-time location fetch
        console.log('Fetching current location...');
        try {
          const currentCoords = await getCurrentPositionOnce();
          if (currentCoords) {
            setOneTimeLocationCoords(currentCoords);
            console.log('Current location set:', currentCoords);
            setFollowUserLocation(true); // Start following user location on map
          } else {
            console.warn('Failed to get current location');
          }
        } catch (error) {
          console.error('Error getting current location:', error);
        }
      }
    }
  ], [savedLocation, setCoords, setOneTimeLocationCoords, setFollowUserLocation]);

  // Custom stop tracking function that also clears oneTimeLocationCoords
  const handleStopTracking = useCallback(() => {
    setOneTimeLocationCoords(null); // Clear the GPS coordinates from map
    setFollowUserLocation(false); // Stop following user location on map
    console.log('GPS tracking stopped and coordinates cleared');
  }, [setOneTimeLocationCoords, setFollowUserLocation]);

  const handleTapLocationSelect = (value: string | [number, number]) => {
    if (Array.isArray(value) && value.length === 2) {
      setIsManualSelection(true); // Mark as manual selection to prevent auto-switching
      setIsGPSselection(false);
      setSelectedCoords(value as [number, number]);
      
      // Update the status form with selected coordinates
      setStatusForm(prev => ({
        ...prev,
        lng: value[0],
        lat: value[1]
      }));
      
      console.log('User choose manual selection:', value);
    }
  }

  const handleGPSLocationSelect = (value: string | [number, number]) => {
    if (Array.isArray(value) && value.length === 2) {
      setIsGPSselection(true);
      setIsManualSelection(false);

      // Update the status form with selected coordinates
      setStatusForm(prev => ({
        ...prev,
        lng: value[0],
        lat: value[1]
      }));
      
      console.log('User choose GPS location:', value);
    }
  }

  // Custom components
  const customComponents = useMemo(() => [
    <CustomImagePicker key="image-picker" id="map-image-picker-actionSheet" />,
    <View key="spacer" style={{ marginVertical: 20 }} />,

    // Show ButtonRadio choice when user has both tapped location AND GPS available
    hasUserTappedMap && oneTimeLocationCoords && coords ? (
      <View key="location-options">
        <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>Choose your location:</Text>
        
        {/* Tapped Location Option (Default/Priority) */}
        <ButtonRadio
          key="tapped-location"
          label="Tapped Location"
          subLabel={coords}
          value={coords}
          selectedValue={!isGPSselection ? coords : [0, 0]}
          onSelect={handleTapLocationSelect}
          style={{ marginBottom: 8 }}
        />
        
        {/* GPS/Current Location Option */}
        <ButtonRadio
          key="gps-location"
          label="Current Location (GPS)"
          subLabel={oneTimeLocationCoords}
          value={oneTimeLocationCoords}
          selectedValue={isGPSselection ? oneTimeLocationCoords : [0, 0]}
          onSelect={handleGPSLocationSelect}
          style={{ marginBottom: 8 }}
        />
      </View>
    ) : (
      // Show simple coordinate display when only one location source
      (coords || oneTimeLocationCoords) && (
        <View key="marker-info" style={styles.markerInfoContainer}>
          <Text style={styles.markerInfoTitle}>
            {coords ? 'Location:' : 
             oneTimeLocationCoords ? 'GPS Location:' : 
             'Selected Location:'}
          </Text>
          <Text>
            {coords ? 
              `Lat: ${coords[1].toFixed(6)}, Lng: ${coords[0].toFixed(6)}` :
              oneTimeLocationCoords ? 
              `Lat: ${oneTimeLocationCoords[1].toFixed(6)}, Lng: ${oneTimeLocationCoords[0].toFixed(6)}` :
              'No location selected'
            }
          </Text>
        </View>
      )
    ),

    <Text key="info-text" style={{ marginTop: 10 }}>What information you want to share with community?</Text>,
    // Info banner
    <HStack key="info-banner" style={styles.infoContainer}>
      <Info size={20} color={Colors.icons.light} />
      <Text size='2xs' emphasis='light'>
        All information entered here will remain visible to the admin for detailed status tracking.
      </Text>
    </HStack>,
  ].filter(Boolean), [coords, oneTimeLocationCoords, selectedCoords, handleTapLocationSelect, handleGPSLocationSelect, hasUserTappedMap]);

  return (
    <>
      <Body style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }
      ]}>
        <Map 
          title="Let us know your status during disaster!"
          label="Tap the map to pin a marker"
          locationDisplayLabel="Your selected location"
          showCoordinates={true}
          textInputFields={textInputFields}
          radioFields={radioFields}
          toggleFields={toggleFields}
          customComponents={customComponents}
          quickActionButtons={quickActionButtons}
          stopTracking={handleStopTracking}
          primaryButton={{
            label: 'Submit',
            onPress: handleSubmit,
          }}
          onLocationClear={() => {
            setStatusForm(prev => ({
              ...prev,
              lat: null,
              lng: null
            }));

            setCoords(null);
            setHasUserTappedMap(false);
          }}
          errMessage={formErrors.errMessage || ''}
        />
      </Body>
      <LoadingOverlay 
        visible={submitStatusLoading} 
        message="Saving your status..." 
      />
    </>
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
  markerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  markerInfoContainer: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 150, 255, 0.1)',
    borderColor: 'rgba(0, 150, 255, 0.3)',
  },
  markerInfoTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoContainer: {
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
    display: 'flex',
    alignItems: 'center',
  },
});