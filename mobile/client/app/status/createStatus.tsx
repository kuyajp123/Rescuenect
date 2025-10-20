import { getAddress } from '@/API/getAddress';
import CustomImagePicker from '@/components/components/CustomImagePicker';
import { ImageModal } from '@/components/components/image-modal/ImageModal';
import Map, { CustomButton, RadioField, TextInputField } from '@/components/components/Map';
import Modal from '@/components/components/Modal';
import {
  formatContactNumber,
  formatName,
  formatTimeSince,
  getCurrentPositionOnce,
  isValidContactNumber,
} from '@/components/helper/commonHelpers';
import { GetDate, GetTime } from '@/components/helper/DateAndTime';
import { storageHelpers } from '@/components/helper/storage';
import { useAuth } from '@/components/store/useAuth';
import { useCoords } from '@/components/store/useCoords';
import { useGetAddress } from '@/components/store/useGetAddress';
import { useImagePickerStore } from '@/components/store/useImagePicker';
import { useNetwork } from '@/components/store/useNetwork';
import { useStatusFormStore } from '@/components/store/useStatusForm';
import CustomAlertDialog from '@/components/ui/CustomAlertDialog';
import { ButtonRadio } from '@/components/ui/CustomRadio';
import { HStack } from '@/components/ui/hstack';
import Body from '@/components/ui/layout/Body';
import { LoadingOverlay } from '@/components/ui/loading/LoadingOverlay';
import StateImage from '@/components/ui/StateImage/StateImage';
import { Text } from '@/components/ui/text';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { API_ROUTES } from '@/config/endpoints';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { navigateToStatusSettings } from '@/routes/route';
import { AddressState, StatusFormErrors, StatusStateData } from '@/types/components';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { isEqual } from 'lodash';
import { Bookmark, Ellipsis, Info, Navigation, Settings, SquarePen, Trash } from 'lucide-react-native';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const createStatus = () => {
  const insets = useSafeAreaInsets();
  const scaleValue = useRef(new Animated.Value(0)).current;
  const image = useImagePickerStore(state => state.image);
  const setImagePickerImage = useImagePickerStore(state => state.setImage);
  const isOnline = useNetwork(state => state.isOnline);
  const { isDark } = useTheme();
  const { authUser } = useAuth();

  // Coords states
  const coords = useCoords(state => state.coords);
  const setCoords = useCoords(state => state.setCoords);
  const oneTimeLocationCoords = useCoords(state => state.oneTimeLocationCoords);
  const setOneTimeLocationCoords = useCoords(state => state.setOneTimeLocationCoords);
  const setActiveStatusCoords = useCoords(state => state.setActiveStatusCoords);
  const resetCoordsState = useCoords(state => state.resetState);
  const savedLocation: [number, number] = [120.7752839, 14.2919325]; // simulate saved location
  // const savedLocation: [number, number] | null = null; // simulate saved location

  // Address store
  const addressCoords = useGetAddress(state => state.addressCoords);
  const addressGPS = useGetAddress(state => state.addressGPS);
  const setAddressCoords = useGetAddress(state => state.setAddressCoords);
  const setAddressGPS = useGetAddress(state => state.setAddressGPS);
  const setAddressCoordsLoading = useGetAddress(state => state.setAddressCoordsLoading);
  const setAddressGPSLoading = useGetAddress(state => state.setAddressGPSLoading);

  // settings states
  const setFollowUserLocation = useCoords(state => state.setFollowUserLocation);
  const [selectedCoords, setSelectedCoords] = useState<[number, number]>([0, 0]);
  const [hasUserTappedMap, setHasUserTappedMap] = useState(false); // Track if user has tapped on map
  const [isManualSelection, setIsManualSelection] = useState(false); // Track if user is making manual ButtonRadio selection
  const isFormDataLoadingRef = useRef(false); // Track if we're loading formData coordinates
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null); // For debouncing coords address calls
  const [isGPSselection, setIsGPSselection] = useState(false); // Track if user has selected GPS option
  const debounceTimerRefGPS = useRef<NodeJS.Timeout | null>(null); // For debouncing GPS address calls

  // Form related states
  const [submitStatusLoading, setSubmitStatusLoading] = useState(false);
  const formData = useStatusFormStore(state => state.formData);
  const setFormData = useStatusFormStore(state => state.setFormData);
  const resetFormData = useStatusFormStore(state => state.resetFormData);
  const isLoading = useStatusFormStore(state => state.isLoading);
  const setLoadingFetch = useStatusFormStore(state => state.setLoading);
  const [formErrors, setFormErrors] = useState<StatusFormErrors>({});
  const errorFetching = useStatusFormStore(state => state.error);
  const setErrorFetching = useStatusFormStore(state => state.setError);

  const [statusForm, setStatusForm] = useState<StatusStateData>({
    uid: authUser?.uid || '',
    profileImage: authUser?.photoURL || '',
    firstName: '',
    lastName: '',
    condition: '',
    phoneNumber: '',
    lat: null,
    lng: null,
    location: null,
    image: formData?.image || '',
    note: '',
    shareLocation: true,
    shareContact: true,
    createdAt: formData?.createdAt || undefined,
    expirationDuration: formData?.expirationDuration || 24,
  });

  const [modals, setModals] = useState({
    noChanges: false,
    errorFetchStatus: errorFetching,
    noNetwork: false,
    submitSuccess: false,
    deleteSuccess: false,
    deleteConfirm: false,
    submitFailure: false,
    isImageModalVisible: false,
  });
  const toggleModal = (name: keyof typeof modals, value: boolean) => {
    setModals(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    console.log(JSON.stringify(formData, null, 2));
  }, [formData]);

  // Auto hide after 3 seconds
  useEffect(() => {
    if (modals.submitSuccess) {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [modals.submitSuccess]);

  useEffect(() => {
    if (modals.deleteSuccess) {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [modals.deleteSuccess]);

  const getStorage = async () => {
    try {
      const userData = await storageHelpers.getData(STORAGE_KEYS.USER);
      const shareLocation = await storageHelpers.getField(STORAGE_KEYS.USER_SETTINGS, 'status_settings.shareLocation');
      const shareContact = await storageHelpers.getField(STORAGE_KEYS.USER_SETTINGS, 'status_settings.shareContact');
      const expirationDuration = await storageHelpers.getField(
        STORAGE_KEYS.USER_SETTINGS,
        'status_settings.expirationDuration'
      );

      return {
        userData,
        shareLocation,
        shareContact,
        expirationDuration,
      };
    } catch (error) {
      console.error('Error loading storage data:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!formData) {
      getStorage()
        .then(data => {
          if (data && data.userData) {
            setStatusForm(prev => ({
              ...prev,
              firstName: data.userData.firstName || '',
              lastName: data.userData.lastName || '',
              phoneNumber: data.userData.phoneNumber || '',
              shareLocation: data.shareLocation ?? true,
              shareContact: data.shareContact ?? true,
              expirationDuration: data.expirationDuration || 24,
            }));
          } else {
            console.log('❌ No user data found in storage');
          }
        })
        .catch(error => {
          console.error('Error in getStorage useEffect:', error);
        });
    }
  }, [formData]);

  // syncs the expirationDuration from storage to local statusForm state
  useFocusEffect(
    useCallback(() => {
      // Sync settings from storage when screen comes into focus
      getStorage()
        .then(data => {
          if (data) {
            setStatusForm(prev => ({
              ...prev,
              expirationDuration: data.expirationDuration ?? formData?.expirationDuration ?? 24,
              shareLocation: data.shareLocation ?? formData?.shareLocation ?? prev.shareLocation,
              shareContact: data.shareContact ?? formData?.shareContact ?? prev.shareContact,
            }));
          }
        })
        .catch(error => {
          console.error('Error syncing settings on focus:', error);
        });
    }, [formData])
  );

  // Update form coordinates and handle default selection priority
  useEffect(() => {
    if (coords) {
      setStatusForm(prev => ({
        ...prev,
        lng: coords[0],
        lat: coords[1],
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

  // Load form data from Zustand store on mount
  useEffect(() => {
    console.log('📋 formData useEffect triggered, formData:', formData ? 'exists' : 'null');
    if (formData) {
      // Set ref flag FIRST for immediate synchronous access
      isFormDataLoadingRef.current = true;

      setCoords(formData.lng && formData.lat ? [formData.lng, formData.lat] : null);
      setSelectedCoords(formData.lng && formData.lat ? [formData.lng, formData.lat] : [0, 0]);
      setActiveStatusCoords(true);
      setStatusForm(prev => ({
        ...prev,
        ...formData,
      }));

      // Reset the flag after a short delay
      setTimeout(() => {
        isFormDataLoadingRef.current = false;
      }, 300);
    } else {
      // When formData is null (deleted), clear coordinates and reset states
      console.log('🧹 Clearing all states because formData is null');
      setCoords(null);
      setSelectedCoords([0, 0]);
      setActiveStatusCoords(false);
      setHasUserTappedMap(false);
      setIsGPSselection(false);
      setIsManualSelection(false);

      // Clear addresses
      setAddressCoords(null);
      setAddressGPS(null);
    }
  }, [formData]);

  // Track when user taps map (coords change significantly from last selected)
  useEffect(() => {
    if (coords && !isManualSelection && !isFormDataLoadingRef.current) {
      // Check if this is a new map tap (coordinates changed significantly)
      const distanceThreshold = 0.001; // ~100 meters
      const latDiff = Math.abs(coords[1] - selectedCoords[1]);
      const lngDiff = Math.abs(coords[0] - selectedCoords[0]);

      if (latDiff > distanceThreshold || lngDiff > distanceThreshold) {
        // User tapped a new location on map
        if (authUser) {
          setAddressCoordsLoading(true);
          setHasUserTappedMap(true);
        }
        setActiveStatusCoords(false);
        setSelectedCoords(coords); // Tapped location becomes default
      }
    } else if (isFormDataLoadingRef.current) {
      // 📋 Ignoring coordinate change - formData is loading
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
          lat: oneTimeLocationCoords[1],
        }));
        console.log('GPS set as default location:', oneTimeLocationCoords);
      }
    }
  }, [oneTimeLocationCoords, hasUserTappedMap, selectedCoords]);

  // Update image when image picker store changes
  useEffect(() => {
    if (!formData?.image) {
      setStatusForm(prev => ({
        ...prev,
        image: image || '',
      }));
    }
  }, [image, formData?.image]);

  // Initialize activeStatusCoords synchronously before component renders
  useLayoutEffect(() => {
    // Get the current formData from Zustand store
    const currentFormData = useStatusFormStore.getState().formData;

    if (currentFormData) {
      setActiveStatusCoords(true);
    } else {
      setActiveStatusCoords(false);
    }
  }, []); // Run once before first render

  // Reset coordinate states on component mount and cleanup on unmount
  useEffect(() => {
    setOneTimeLocationCoords(null);
    setFollowUserLocation(false);
    isFormDataLoadingRef.current = false; // Reset formData loading flag

    // Cleanup function - reset activeStatusCoords when component unmounts
    return () => {
      setActiveStatusCoords(false);
    };
  }, []);

  // Watch for changes to errorFetching from Zustand store and update modal state
  useEffect(() => {
    if (errorFetching) {
      toggleModal('errorFetchStatus', true);
    }
  }, [errorFetching]);

  // Debounced fetch address for tapped location
  useEffect(() => {
    if (authUser) {
      setAddressCoordsLoading(true);
    }

    if (!coords) {
      // Clear any pending timer if coords is null
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      return;
    }

    if (!isOnline) {
      // If offline, do not attempt to fetch address
      setAddressCoordsLoading(false);
      return;
    }

    // Clear previous timer if it exists
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for 1.5 seconds
    debounceTimerRef.current = setTimeout(() => {
      handleGetAddress(coords[1], coords[0]);
      debounceTimerRef.current = null;
    }, 1500);

    // Cleanup function to clear timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        setAddressCoordsLoading(false);
      }
    };
  }, [coords, isOnline, authUser]);

  // Debounced fetch address for GPS location
  useEffect(() => {
    if (authUser) {
      setAddressGPSLoading(true);
    }
    if (!oneTimeLocationCoords) {
      // Clear any pending timer if GPS coords is null
      if (debounceTimerRefGPS.current) {
        clearTimeout(debounceTimerRefGPS.current);
        debounceTimerRefGPS.current = null;
      }
      return;
    }

    if (!isOnline) {
      // If offline, do not attempt to fetch address
      setAddressGPSLoading(false);
      return;
    }

    // Clear previous timer if it exists
    if (debounceTimerRefGPS.current) {
      clearTimeout(debounceTimerRefGPS.current);
    }

    // Set new timer for 1.5 seconds
    debounceTimerRefGPS.current = setTimeout(() => {
      handleGetAddress(oneTimeLocationCoords[1], oneTimeLocationCoords[0]);
      debounceTimerRefGPS.current = null;
    }, 1500);

    // Cleanup function to clear timer on unmount
    return () => {
      if (debounceTimerRefGPS.current) {
        clearTimeout(debounceTimerRefGPS.current);
        debounceTimerRefGPS.current = null;
        setAddressGPSLoading(false);
      }
    };
  }, [oneTimeLocationCoords, isOnline, authUser]);

  // Clear address states in guest mode or offline mode
  useEffect(() => {
    if (!isOnline) {
      setAddressCoords(null);
      setAddressGPS(null);
      setAddressCoordsLoading(false);
      setAddressGPSLoading(false);
    }

    if (!authUser) {
      setAddressCoords(null);
      setAddressGPS(null);
      setAddressCoordsLoading(false);
      setAddressGPSLoading(false);
    }
  }, [isOnline, authUser]);

  useEffect(() => {
    if (addressGPS?.formatted) {
      setStatusForm(prev => ({
        ...prev,
        location: addressGPS ? addressGPS.formatted : prev.location,
      }));
    } else {
      if (addressCoords?.formatted) {
        setStatusForm(prev => ({
          ...prev,
          location: addressCoords ? addressCoords.formatted : prev.location,
        }));
      } else {
        setStatusForm(prev => ({
          ...prev,
          location: null,
        }));
      }
    }

    if (!isGPSselection) {
      if (addressCoords?.formatted) {
        setStatusForm(prev => ({
          ...prev,
          location: addressCoords ? addressCoords.formatted : prev.location,
        }));
      }
    }
  }, [addressCoords?.formatted, addressGPS?.formatted, isGPSselection]);

  // Handle modal close with delay to prevent immediate refetch
  const handleErrorModalClose = () => {
    toggleModal('errorFetchStatus', false);
    // Add a small delay before clearing the error to prevent immediate refetch
    setTimeout(() => {
      setErrorFetching(false);
    }, 100);
  };

  const handleInputChange = (field: keyof StatusStateData, value: string | boolean) => {
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
      [field]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
        errMessage: '',
      }));
    }
  };

  const handleCloseImageModal = () => {
    toggleModal('isImageModalVisible', false);
  };

  const handleImageModalOpen = () => {
    toggleModal('isImageModalVisible', true);
  };

  const handleSubmit = async () => {
    // Validate form
    const errors: StatusFormErrors = {};

    if (!statusForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!statusForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!statusForm.condition) {
      errors.condition = 'Status is required';
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

    setSubmitStatusLoading(true);

    if (isEqual(statusForm, formData)) {
      toggleModal('noChanges', true);
      setSubmitStatusLoading(false);
      return;
    }

    // If offline, skip submission but save to store
    if (!isOnline) {
      toggleModal('noNetwork', true);
      setSubmitStatusLoading(false);
      return;
    }

    if (!authUser) {
      toggleModal('noNetwork', true);
      setSubmitStatusLoading(false);
      return;
    }

    const statusData = new FormData();

    Object.keys(statusForm).forEach(key => {
      const value = statusForm[key as keyof StatusStateData];
      if (value !== null && value !== undefined) {
        // Don't append image field here - it will be handled separately
        if (key !== 'image') {
          // Handle different data types properly for FormData
          if (typeof value === 'boolean') {
            statusData.append(key, value ? 'true' : 'false');
          } else if (typeof value === 'number') {
            statusData.append(key, value.toString());
          } else {
            statusData.append(key, value.toString());
          }
        }
      }
    });

    // Add image if exists - check statusForm.image
    const imageToUpload = statusForm.image;

    if (imageToUpload) {
      let imageUri: string;

      // Handle both string URI and object with uri property
      if (typeof imageToUpload === 'string') {
        imageUri = imageToUpload;
      } else if (typeof imageToUpload === 'object' && 'uri' in imageToUpload) {
        imageUri = (imageToUpload as { uri: string }).uri;
      } else {
        console.log('📝 Creating status without image - invalid image format');
        console.log('Image value:', imageToUpload);
        imageUri = '';
      }

      if (imageUri && imageUri.trim() !== '') {
        const filename = imageUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        statusData.append('image', {
          uri: imageUri,
          name: filename,
          type,
        } as any);
      } else {
        console.log('📝 Creating status without image - empty URI');
      }
    } else {
      console.log('📝 Creating status without image - no image provided in either source');
    }

    // Submit form online
    try {
      const response = await axios.post(API_ROUTES.STATUS.SAVE_STATUS, statusData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${await authUser?.getIdToken()}`,
        },
        timeout: 30000, // 30 seconds timeout
      });

      if (response.status === 200 && response.data.message === 'No changes detected') {
        console.log('No changes detected:', response.data.reason);
        toggleModal('noChanges', true);
        return;
      }

      console.log('Form submitted successfully:', response.data);
      // Save to Zustand store with parentId from response
      setFormData({
        ...statusForm,
        parentId: response.data?.data?.parentId,
        versionId: response.data?.data?.versionId,
        createdAt: response.data?.data?.createdAt,
      });
      setOneTimeLocationCoords(null);
      toggleModal('submitSuccess', true);
      showAlert();
    } catch (error) {
      console.error('Error submitting form:', error);
      toggleModal('submitFailure', true);
      setSubmitStatusLoading(false);
    } finally {
      setSubmitStatusLoading(false);
    }
  };

  // Define text input fields
  const textInputFields: TextInputField[] = [
    {
      key: 'firstName',
      label: 'First Name',
      placeholder: 'Enter your First Name',
      value: statusForm.firstName,
      onChangeText: text => handleInputChange('firstName', text),
      errorText: formErrors.firstName,
    },
    {
      key: 'lastName',
      label: 'Last Name',
      placeholder: 'Enter your Last Name',
      value: statusForm.lastName,
      onChangeText: text => handleInputChange('lastName', text),
      errorText: formErrors.lastName,
    },
    {
      key: 'phoneNumber',
      label: 'Contact Number',
      placeholder: 'Enter your Contact Number',
      value: statusForm.phoneNumber,
      onChangeText: text => handleInputChange('phoneNumber', text),
      errorText: formErrors.phoneNumber,
    },
    {
      key: 'note',
      label: 'Leave a Note',
      placeholder: 'Enter some Note',
      value: statusForm.note,
      onChangeText: text => handleInputChange('note', text),
      multiline: true,
      numberOfLines: 4,
      maxLength: 500,
    },
  ];

  // Define radio fields
  const radioFields: RadioField[] = [
    {
      key: 'status',
      label: 'What is your current condition?',
      options: [
        { label: 'Safe', value: 'safe' },
        { label: 'Evacuated', value: 'evacuated' },
        { label: 'Affected', value: 'affected' },
        { label: 'Missing', value: 'missing' },
      ],
      selectedValue: statusForm.condition,
      onSelect: value => handleInputChange('condition', value),
      errorText: formErrors.condition,
    },
  ];

  // Define quick action buttons
  const buttons: CustomButton[] = [
    {
      key: 'saved-location',
      label: 'Saved location',
      icon: <Bookmark size={16} color={'white'} />,
      onPress: () => {
        if (savedLocation) {
          setCoords(savedLocation);
          setHasUserTappedMap(false);
        }
      },
    },
    {
      key: 'location-services',
      label: 'Turn on location',
      icon: <Navigation size={16} color={'white'} />,
      onPress: async () => {
        if (authUser) {
          setAddressGPSLoading(true);
        }
        try {
          const currentCoords = await getCurrentPositionOnce();
          if (currentCoords) {
            setOneTimeLocationCoords(currentCoords);
            setFollowUserLocation(true);
          } else {
            console.warn('Failed to get current location');
            setAddressGPSLoading(false);
          }
        } catch (error) {
          setAddressGPSLoading(false);
          console.error('Error getting current location:', error);
        }
      },
    },
  ];

  // ✅ Only add "current-status" if formData exists
  if (formData) {
    buttons.push({
      key: 'active-status',
      label: 'Active status',
      icon: <SquarePen size={16} color={'white'} />,
      onPress: () => {
        if (formData) {
          setCoords(formData.lng && formData.lat ? [formData.lng, formData.lat] : null);
          setSelectedCoords(formData.lng && formData.lat ? [formData.lng, formData.lat] : [0, 0]);
          setActiveStatusCoords(true);
          setStatusForm(prev => ({
            ...prev,
            ...formData,
          }));
        }
      },
    });
  }

  const quickActionButtons: CustomButton[] = buttons;

  // Custom stop tracking function that also clears oneTimeLocationCoords
  const handleStopTracking = () => {
    setOneTimeLocationCoords(null); // Clear the GPS coordinates from map
    setFollowUserLocation(false); // Stop following user location on map
    setAddressGPS(null); // Clear GPS address from store
    setStatusForm(prev => ({
      ...prev,
      location: prev.location ? prev.location : null,
    }));
  };

  const handleTapLocationSelect = (value: string | [number, number]) => {
    if (Array.isArray(value) && value.length === 2) {
      setIsManualSelection(true); // Mark as manual selection to prevent auto-switching
      setIsGPSselection(false);
      setSelectedCoords(value as [number, number]);

      // Update the status form with selected coordinates
      setStatusForm(prev => ({
        ...prev,
        lng: value[0],
        lat: value[1],
        location: addressCoords ? addressCoords.formatted : prev.location,
      }));
    }
  };

  const handleGPSLocationSelect = (value: string | [number, number]) => {
    if (Array.isArray(value) && value.length === 2) {
      setIsGPSselection(true);
      setIsManualSelection(false);

      // Update the status form with selected coordinates
      setStatusForm(prev => ({
        ...prev,
        lng: value[0],
        lat: value[1],
        location: addressGPS ? addressGPS.formatted : prev.location,
      }));
    }
  };

  // Custom components
  const customComponents = [
    formData?.image ? (
      <Pressable key="current-status-image-pressable" onPress={handleImageModalOpen}>
        <Image key="current-status-image" style={styles.statusImage} source={{ uri: formData.image }} />
      </Pressable>
    ) : formData != null && formData.image === '' ? null : (
      <CustomImagePicker key="image-picker" id="map-image-picker-actionSheet" />
    ),
    <View key="spacer" style={{ marginVertical: 20 }} />,

    // Show ButtonRadio choice when user has both tapped location AND GPS available
    hasUserTappedMap && oneTimeLocationCoords && coords ? (
      <View key="location-options">
        <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>Choose your location:</Text>

        {/* Tapped Location Option (Default/Priority) */}
        <ButtonRadio
          key="tapped-location"
          label={addressCoords ? addressCoords.formatted : 'Tapped Location'}
          sizeText="sm"
          subLabel={coords}
          value={coords}
          selectedValue={!isGPSselection ? coords : [0, 0]}
          onSelect={handleTapLocationSelect}
          style={{ marginBottom: 8 }}
        />

        {/* GPS/Current Location Option */}
        <ButtonRadio
          key="gps-location"
          label={addressGPS ? addressGPS.formatted : 'GPS Location'}
          sizeText="sm"
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
          <Text size="sm" style={styles.markerInfoTitle}>
            {coords
              ? addressCoords?.formatted || 'Location:'
              : oneTimeLocationCoords
              ? addressGPS?.formatted || 'GPS Location:'
              : 'Selected Location:'}
          </Text>
          <Text>
            {coords
              ? `Lat: ${Number(coords[1]).toFixed(6)}, Lng: ${Number(coords[0]).toFixed(6)}`
              : oneTimeLocationCoords
              ? `Lat: ${Number(oneTimeLocationCoords[1]).toFixed(6)}, Lng: ${Number(oneTimeLocationCoords[0]).toFixed(
                  6
                )}`
              : 'No location selected'}
          </Text>
        </View>
      )
    ),

    // Info banner
    <HStack key="info-banner" style={styles.infoContainer}>
      <Info size={20} color={Colors.icons.light} />
      <Text size="2xs" emphasis="light">
        All information entered here will remain visible to the admin for detailed status tracking.
      </Text>
    </HStack>,
  ].filter(Boolean);

  const renderImageState = (imageType: string) => {
    if (imageType === 'noChanges') {
      return (
        <StateImage type="noChanges" onError={error => console.log('❌ noChanges image failed to load:', error)} />
      );
    }

    if (imageType === 'errorFetchStatus') {
      return <StateImage type="error" onError={error => console.log('❌ error image failed to load:', error)} />;
    }

    if (imageType === 'noNetwork') {
      return (
        <StateImage type="noNetwork" onError={error => console.log('❌ noNetwork image failed to load:', error)} />
      );
    }

    if (imageType === 'submitFailure') {
      return (
        <StateImage type="error" onError={error => console.log('❌ submitFailure image failed to load:', error)} />
      );
    }

    // Fallback return
    console.log('⚠️ Unknown image type:', imageType);
    return null;
  };

  const onLocationClear = () => {
    setStatusForm(prev => ({
      ...prev,
      lat: null,
      lng: null,
      location: null,
    }));

    setCoords(null);
    setHasUserTappedMap(false);
    setAddressCoords(null); // Clear tapped location address
  };

  const handleClose = () => {
    // Scale out animation
    Animated.timing(scaleValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      toggleModal('submitSuccess', false);
      toggleModal('deleteSuccess', false);
    });
  };

  const showAlert = () => {
    toggleModal('submitSuccess', true);
    // Scale in animation with bounce
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const sendSMS = () => {
    const { firstName, lastName, condition, phoneNumber, lat, lng, location, note } = statusForm;

    const LGU = '09123456789'; // Replace with actual LGU number

    const message = `
    Name: ${firstName} ${lastName}
    Condition: ${condition}
    Phone: ${phoneNumber}
    lat: ${lat}
    lng: ${lng}
    Location: ${location ? location : ''}
    Note: ${note ? note : ''}
    Time: ${GetTime()}
    Date: ${GetDate()}
    `;

    let url = `sms:${LGU}?body=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(err => console.error('Error:', err));
  };

  const handleGetAddress = async (lat: number, lng: number) => {
    if (!authUser) {
      console.warn('User is not authenticated');
      setAddressCoordsLoading(false);
      setAddressGPSLoading(false);
      return;
    }

    try {
      const idToken = await authUser.getIdToken();
      const result = await getAddress(lat, lng, idToken);

      if (result.success && result.address) {
        console.log('Address fetched successfully:', result.address);

        // Create a cleaner address by filtering out unnecessary components
        const cleanAddress = (fullAddress: string) => {
          // Split the address by commas and filter out unwanted parts
          const addressParts = fullAddress.split(',').map(part => part.trim());

          // Filter out postcode, region codes, and country
          const filteredParts = addressParts.filter(part => {
            // Remove parts that look like postcodes (numbers)
            if (/^\d+$/.test(part)) return false;
            // Remove common region identifiers
            if (part.includes('Calabarzon') || part.includes('Philippines')) return false;
            // Remove "unnamed road" (case insensitive)
            if (part.toLowerCase().includes('unnamed road')) return false;
            // Remove country codes and similar
            if (part.length <= 4 && /^[A-Z]+$/.test(part)) return false;
            return true;
          });

          return filteredParts.join(', ');
        };

        // Properly construct AddressState object with cleaned address
        const addressState: AddressState = {
          formatted: cleanAddress(result.address),
          components: result.components || {},
        };

        if (lat === coords?.[1] && lng === coords?.[0]) {
          // This is the tapped location
          setAddressCoords(addressState);
          setAddressCoordsLoading(false);
        }
        if (lat === oneTimeLocationCoords?.[1] && lng === oneTimeLocationCoords?.[0]) {
          // This is the GPS location
          setAddressGPS(addressState);
          setAddressGPSLoading(false);
        }
      } else {
        setAddressCoordsLoading(false);
        setAddressGPSLoading(false);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setAddressCoordsLoading(false);
      setAddressGPSLoading(false);
    }
  };

  const deleteStatus = async () => {
    if (!formData || !formData.parentId || !authUser || !isOnline) {
      toggleModal('noNetwork', true);
      return;
    }

    setSubmitStatusLoading(true);

    try {
      const response = await axios.delete(`${API_ROUTES.STATUS.DELETE_STATUS}/${authUser.uid}`, {
        data: { parentId: formData.parentId },
        headers: {
          Authorization: `Bearer ${await authUser?.getIdToken()}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
      });
      if (response.status === 200) {
        // Clear form data from Zustand store using proper reset functions
        resetFormData();

        // Reset all coordinate states using the resetState function
        if (resetCoordsState) {
          resetCoordsState();
        }

        // Reset local component state
        setSelectedCoords([0, 0]);
        setHasUserTappedMap(false);
        setIsGPSselection(false);
        setIsManualSelection(false);

        // Clear addresses
        setAddressCoords(null);
        setAddressGPS(null);

        // Clear image picker
        setImagePickerImage(null);

        // dont reset status form to default state
        // Keep the current form values

        toggleModal('deleteSuccess', true);
        toggleModal('deleteConfirm', false);
      }
    } catch (error) {
      console.error('Error deleting status:', error);
      // Show error modal
      toggleModal('submitFailure', true);
    } finally {
      setSubmitStatusLoading(false);
    }
  };

  const deleteModalConfirm = async () => {
    toggleModal('deleteConfirm', true);
    const sheet = require('react-native-actions-sheet').SheetManager;
    sheet.hide('status-more-action');
  };

  const headerActions = useMemo(() => {
    return formData
      ? {
          headerActionWithData: {
            createdAt: formatTimeSince(formData.createdAt),
            rightAction: {
              icon: <Ellipsis size={24} color={isDark ? Colors.icons.dark : Colors.icons.light} />,
              onPress: () => {
                const sheet = require('react-native-actions-sheet').SheetManager;
                sheet.show('status-more-action', {
                  payload: {
                    items: [
                      {
                        id: 'details',
                        name: 'Details',
                        icon: <Info size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />,
                        onPress: () => {},
                      },
                      {
                        id: 'settings',
                        name: 'Settings',
                        icon: <Settings size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />,
                        onPress: navigateToStatusSettings,
                      },
                      {
                        id: 'delete',
                        name: 'Delete',
                        icon: <Trash size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />,
                        onPress: deleteModalConfirm,
                      },
                    ],
                  },
                });
              },
            },
          },
        }
      : {
          headerActionNoData: {
            icon: <Settings size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />,
            onPress: navigateToStatusSettings,
          },
        };
  }, [formData, isDark]);

  return (
    <>
      <Body
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <Map
          title="Let us know your status during disaster!"
          label="Tap the map to pin a marker"
          GPSlocationLabel={addressGPS ? addressGPS.formatted : 'GPS Location'}
          tappedLocationLabel={addressCoords ? addressCoords.formatted : 'Coordinates'}
          textInputFields={textInputFields}
          radioFields={radioFields}
          // toggleFields={toggleFields}
          customComponents={customComponents}
          quickActionButtons={quickActionButtons}
          headerActions={headerActions}
          stopTracking={handleStopTracking}
          {...(!isEqual(formData, statusForm) && {
            primaryButton: {
              label: 'Update',
              onPress: handleSubmit,
            },
          })}
          {...(!formData && {
            primaryButton: {
              label: 'Submit',
              onPress: handleSubmit,
            },
          })}
          onLocationClear={onLocationClear}
          errMessage={formErrors.errMessage || ''}
        />
        <Modal
          modalVisible={modals.noChanges}
          onClose={() => toggleModal('noChanges', false)}
          size="lg"
          iconOnPress={() => toggleModal('noChanges', false)}
          sizeIcon={20}
          primaryButtonText="Close"
          primaryButtonOnPress={() => toggleModal('noChanges', false)}
          renderImage={() => renderImageState('noChanges')}
          primaryText="No changes made"
          secondaryText="Your status remains the same as before."
        />
        <Modal
          modalVisible={modals.errorFetchStatus}
          onClose={handleErrorModalClose}
          size="lg"
          iconOnPress={handleErrorModalClose}
          sizeIcon={20}
          primaryButtonText="Close"
          primaryButtonOnPress={handleErrorModalClose}
          renderImage={() => renderImageState('errorFetchStatus')}
          primaryText="Oops! Something went wrong."
          secondaryText="We couldn’t load the details right now. Please try again later."
        />
        <Modal
          modalVisible={modals.noNetwork}
          onClose={() => toggleModal('noNetwork', false)}
          size="lg"
          iconOnPress={() => toggleModal('noNetwork', false)}
          sizeIcon={20}
          primaryButtonText="Continue"
          primaryButtonOnPress={() => sendSMS()}
          secondaryButtonText="Cancel"
          secondaryButtonOnPress={() => toggleModal('noNetwork', false)}
          renderImage={() => renderImageState('noNetwork')}
          primaryText={authUser ? 'No Internet Connection' : 'You are in Guest Mode'}
          secondaryText="Would you like to send the details you entered through your messaging app instead?"
        />
        <Modal
          modalVisible={modals.submitFailure}
          onClose={() => toggleModal('submitFailure', false)}
          size="lg"
          iconOnPress={() => toggleModal('submitFailure', false)}
          sizeIcon={20}
          primaryButtonText="Continue"
          primaryButtonOnPress={() => sendSMS()}
          secondaryButtonText="Cancel"
          secondaryButtonOnPress={() => toggleModal('submitFailure', false)}
          renderImage={() => renderImageState('submitFailure')}
          primaryText="An error occurred."
          secondaryText="Would you like to send the details you entered through your messaging app instead?"
        />
        <Modal
          modalVisible={modals.deleteConfirm}
          onClose={() => toggleModal('deleteConfirm', false)}
          size="md"
          iconOnPress={() => toggleModal('deleteConfirm', false)}
          sizeIcon={20}
          primaryButtonText="Confirm"
          primaryButtonOnPress={() => deleteStatus()}
          secondaryButtonText="Cancel"
          secondaryButtonOnPress={() => toggleModal('deleteConfirm', false)}
          primaryText="Are you sure you want to delete this status?"
        />
        <CustomAlertDialog
          showAlertDialog={modals.submitSuccess}
          handleClose={handleClose}
          text="Status submitted successfully!"
        />
        <CustomAlertDialog
          showAlertDialog={modals.deleteSuccess}
          handleClose={handleClose}
          text="Status deleted successfully!"
        />
      </Body>
      <LoadingOverlay visible={submitStatusLoading} message="Saving your status..." />
      <LoadingOverlay
        visible={isLoading}
        message="retrieving your current status Please wait"
        onRequestClose={() => {
          setLoadingFetch(false);
        }}
      />
      {modals.isImageModalVisible && formData?.image && (
        <ImageModal visible={modals.isImageModalVisible} imageUri={formData.image} onClose={handleCloseImageModal} />
      )}
    </>
  );
};

export default createStatus;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  map: {
    flex: 1,
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
  statusImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  infoContainer: {
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
    display: 'flex',
    alignItems: 'center',
  },
});
