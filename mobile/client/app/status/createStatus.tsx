import CustomImagePicker, { useImagePickerStore } from '@/components/components/CustomImagePicker';
import Map, { CustomButton, RadioField, TextInputField, ToggleField } from '@/components/components/Map';
import { formatContactNumber, formatName, isValidContactNumber } from '@/components/helper/commonHelpers';
import { storage } from '@/components/helper/storage';
import { StatusForm } from '@/components/shared/types/components';
import { HStack } from '@/components/ui/hstack';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useCoords } from '@/contexts/MapContext';
import * as Location from 'expo-location';
import { Bookmark, Info, Navigation } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const createStatus = () => {
  const insets = useSafeAreaInsets();
  const [isMapReady, setIsMapReady] = useState(false);
  const { image } = useImagePickerStore();
  const [userData, setUserData] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<Partial<StatusForm>>({});
  const { coords, setCoords } = useCoords();
  const savedLocation: Location.LocationObjectCoords = {
    latitude: 14.2919325,
    longitude: 120.7752839,
    altitude: null,
    accuracy: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null
  }; // simulate saved location
  
  const [statusForm, setStatusForm] = useState<StatusForm>({
    firstName: '',
    lastName: '',
    status: '',
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
    const barangay = await storage.get('@barangay');
    return { user, barangay };
  }

  useEffect(() => {
    // Ensure component is fully mounted and contexts are ready
    const timer = setTimeout(() => {
      setIsMapReady(true);
    }, 1000);

    getStorage().then(data => {
      setUserData(data);
      if (data?.user) {
        setStatusForm(prev => ({
          ...prev,
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          phoneNumber: data.user.phoneNumber || '',
        }));
      }
    });

    return () => clearTimeout(timer);
  }, []);

  // Update coordinates when coords change
  useEffect(() => {
    if (coords) {
      setStatusForm(prev => ({
        ...prev,
        lng: coords.longitude,
        lat: coords.latitude
      }));
    }
  }, [coords]);

  // Update image when image picker store changes
  useEffect(() => {
    setStatusForm(prev => ({
      ...prev,
      image: image || ''
    }));
  }, [image]);

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
        [field]: undefined
      }));
    }
  }, [formErrors]);

  const handleSubmit = useCallback(() => {
    // Validate form
    const errors: Partial<StatusForm> = {};
    
    if (!statusForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!statusForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!statusForm.status) {
      errors.status = 'Status is required';
    }
    if (!statusForm.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    }
    if (!isValidContactNumber(statusForm.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid mobile number';
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Submit form data
    console.log('Submitting status form:', statusForm);
    // Here you would typically send the data to your backend
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
      placeholder: 'Enter your Note',
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
      selectedValue: statusForm.status,
      onSelect: (value) => handleInputChange('status', value),
      errorText: formErrors.status,
    },
  ], [statusForm.status, formErrors.status, handleInputChange]);

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
        console.log('Open saved locations');
        if (savedLocation) {
          setCoords(savedLocation)
        }
      }
    },
    {
      key: 'location-services',
      label: 'Turn on location',
      icon: <Navigation size={16} color={'white'} />,
      onPress: () => {
        // Handle location services
        console.log('Enable location services');
      }
    }
  ], []);

  // Custom components
  const customComponents = useMemo(() => [
    <CustomImagePicker key="image-picker" id="map-image-picker-actionSheet" />,
    <View key="spacer" style={{ marginVertical: 20 }} />,
    coords && (
      <View key="marker-info" style={styles.markerInfoContainer}>
        <Text style={styles.markerInfoTitle}>Selected Location:</Text>
        <Text>
          Lat: {coords.longitude.toFixed(6)} Lng: {coords.latitude.toFixed(6)}
        </Text>
      </View>
    ),
    <Text key="info-text" style={{ marginTop: 10 }}>What information you want to share with community?</Text>,
    // Info banner
    <HStack key="info-banner" style={styles.infoContainer}>
      <Info size={20} color={Colors.icons.light} />
      <Text size='2xs' emphasis='light'>
        All information entered here will remain visible to the admin for detailed status tracking.
      </Text>
    </HStack>,
  ].filter(Boolean), [coords]);

  return (
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
        }}
      />
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
  markerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  markerInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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