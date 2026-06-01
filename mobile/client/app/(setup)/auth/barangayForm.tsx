import { Body } from '@/components/ui/layout/Body';
import { SetupStepper } from '@/components/ui/setup/SetupStepper';
import { Text } from '@/components/ui/text';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { API_ROUTES } from '@/config/endpoints';
import { toResidentLocationSelectionFromCoverageClient } from '@/config/locationConfig';
import type { LocationCoverageResponse, ResidentLocationSelection } from '@/config/locationConfig';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { convertToE164Format, formatContactNumber, formatName, isValidContactNumber, sortByLabel } from '@/helper/commonHelpers';
import { storageHelpers } from '@/helper/storage';
import { useIdToken } from '@/hooks/useIdToken';
import { messaging } from '@/lib/firebaseConfig';
import { useAuth } from '@/store/useAuth';
import { useUserData } from '@/store/useBackendResponse';
import { getToken as getFcmToken } from '@react-native-firebase/messaging';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios, { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { Button, Spinner } from 'heroui-native';
import { AlertCircle, ArrowLeft, Check, ChevronDown, Phone, RefreshCw, Search, UserRound, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';
import { create } from 'zustand';

type SelectOption = {
  label: string;
  value: string;
};

type SetupStep = 1 | 2 | 3;

const EMPTY_LOCATION_COVERAGE: LocationCoverageResponse = { provinces: [] };

type ProfileFormState = {
  firstName: string;
  lastName: string;
  contactNumber?: string;
  firstNameTouched: boolean;
  lastNameTouched: boolean;
  setFirstName: (name: string, markTouched?: boolean) => void;
  setLastName: (name: string, markTouched?: boolean) => void;
  setContactNumber: (number: string) => void;
  reset: () => void;
};

type ProfileFieldProps = {
  label: string;
  placeholder: string;
  value?: string;
  errorMessage?: string;
  helperText?: string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  icon: 'user' | 'phone';
  isDark: boolean;
  onChangeText: (value: string) => void;
};

const useProfileFormStore = create<ProfileFormState>(set => ({
  firstName: '',
  lastName: '',
  contactNumber: '',
  firstNameTouched: false,
  lastNameTouched: false,
  setFirstName: (firstName, markTouched = false) =>
    set(markTouched ? { firstName, firstNameTouched: true } : { firstName }),
  setLastName: (lastName, markTouched = false) => set(markTouched ? { lastName, lastNameTouched: true } : { lastName }),
  setContactNumber: contactNumber => set({ contactNumber }),
  reset: () => set({ firstName: '', lastName: '', contactNumber: '', firstNameTouched: false, lastNameTouched: false }),
}));

type LocationSelectFieldProps = {
  label: string;
  placeholder: string;
  options: SelectOption[];
  value: string;
  helperText?: string;
  isDisabled?: boolean;
  isDark: boolean;
  onChange: (value: string) => void;
};

const LocationSelectField = ({
  label,
  placeholder,
  options,
  value,
  helperText,
  isDisabled = false,
  isDark,
  onChange,
}: LocationSelectFieldProps) => {
  const selectedOption = options.find(option => option.value === value);
  const disabled = isDisabled || options.length === 0;
  const [isOpen, setIsOpen] = useState(false);
  const [isModalMounted, setIsModalMounted] = useState(false);
  const [query, setQuery] = useState('');
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(32)).current;
  const surfaceColor = isDark ? Colors.muted.dark.background : '#FFFFFF';
  const fieldColor = isDark ? '#111827' : '#FFFFFF';
  const borderColor = isDark ? Colors.border.dark : Colors.border.light;
  const mutedTextColor = isDark ? Colors.muted.dark.text : Colors.muted.light.text;
  const activeColor = isDark ? Colors.brand.dark : Colors.brand.light;
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter(option => option.label.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  const openPicker = () => {
    if (disabled) {
      return;
    }

    Keyboard.dismiss();
    setQuery('');
    backdropOpacity.setValue(0);
    sheetTranslateY.setValue(32);
    setIsOpen(true);
    setIsModalMounted(true);
  };

  const closePicker = () => {
    if (!isModalMounted) {
      return;
    }

    setIsOpen(false);
    setQuery('');
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 32,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsModalMounted(false);
      }
    });
  };

  useEffect(() => {
    if (!isModalMounted || !isOpen) {
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 170,
        useNativeDriver: true,
      }),
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        damping: 24,
        stiffness: 260,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, isModalMounted, isOpen, sheetTranslateY]);

  const handleSelect = (option: SelectOption) => {
    onChange(option.value);
    closePicker();
    Keyboard.dismiss();
  };

  return (
    <View style={styles.selectField}>
      <Text size="xs" emphasis="light">
        {label}
      </Text>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: isOpen }}
        style={({ pressed }) => [
          styles.dropdownTrigger,
          {
            backgroundColor: fieldColor,
            borderColor: selectedOption ? activeColor : borderColor,
            opacity: pressed && !disabled ? 0.82 : 1,
          },
          disabled ? styles.disabledDropdown : null,
        ]}
      >
        <Text
          size="sm"
          bold={Boolean(selectedOption)}
          numberOfLines={1}
          style={[
            styles.dropdownValue,
            {
              color: selectedOption ? (isDark ? Colors.text.dark : Colors.text.light) : mutedTextColor,
            },
          ]}
        >
          {selectedOption?.label ?? placeholder}
        </Text>
        <ChevronDown size={20} color={disabled ? mutedTextColor : activeColor} />
      </Pressable>
      {helperText ? (
        <Text size="2xs" emphasis="light" style={styles.helperText}>
          {helperText}
        </Text>
      ) : null}

      <Modal
        visible={isModalMounted}
        transparent
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={closePicker}
      >
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.modalBackdrop, { opacity: backdropOpacity }]}>
            <Pressable style={styles.backdropPressable} onPress={closePicker} />
          </Animated.View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoider}
          >
            <Animated.View
              style={[
                styles.pickerSheet,
                {
                  backgroundColor: surfaceColor,
                  borderColor,
                  transform: [{ translateY: sheetTranslateY }],
                },
              ]}
            >
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleGroup}>
                  <Text size="md" bold numberOfLines={1}>
                    {label}
                  </Text>
                  {selectedOption ? (
                    <Text size="2xs" emphasis="light" numberOfLines={1}>
                      Current: {selectedOption.label}
                    </Text>
                  ) : null}
                </View>
                <Pressable onPress={closePicker} hitSlop={12} style={styles.iconButton}>
                  <X size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                </Pressable>
              </View>

              <View
                style={[
                  styles.searchBox,
                  {
                    backgroundColor: fieldColor,
                    borderColor,
                  },
                ]}
              >
                <Search size={18} color={mutedTextColor} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={`Search ${label.toLowerCase()}`}
                  placeholderTextColor={mutedTextColor}
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={[
                    styles.searchInput,
                    {
                      color: isDark ? Colors.text.dark : Colors.text.light,
                    },
                  ]}
                />
              </View>

              <FlatList
                data={filteredOptions}
                keyExtractor={option => option.value}
                keyboardShouldPersistTaps="handled"
                style={styles.optionList}
                contentContainerStyle={styles.optionListContent}
                ItemSeparatorComponent={() => <View style={[styles.optionSeparator, { backgroundColor: borderColor }]} />}
                ListEmptyComponent={
                  <View style={styles.emptyOption}>
                    <Text size="sm" emphasis="light">
                      No matching location
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isSelected = item.value === value;

                  return (
                    <Pressable
                      style={({ pressed }) => [
                        styles.optionItem,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(59, 130, 246, 0.16)'
                              : 'rgba(14, 165, 233, 0.10)'
                            : 'transparent',
                          opacity: pressed ? 0.72 : 1,
                        },
                      ]}
                      onPress={() => handleSelect(item)}
                    >
                      <Text size="sm" bold={isSelected} numberOfLines={2} style={styles.optionLabel}>
                        {item.label}
                      </Text>
                      {isSelected ? <Check size={18} color={activeColor} /> : null}
                    </Pressable>
                  );
                }}
              />
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const ProfileField = ({
  label,
  placeholder,
  value,
  errorMessage,
  helperText,
  keyboardType = 'default',
  maxLength,
  icon,
  isDark,
  onChangeText,
}: ProfileFieldProps) => {
  const Icon = icon === 'phone' ? Phone : UserRound;
  const activeColor = isDark ? Colors.brand.dark : Colors.brand.light;
  const mutedTextColor = isDark ? Colors.muted.dark.text : Colors.muted.light.text;
  const fieldColor = isDark ? '#111827' : '#FFFFFF';
  const borderColor = errorMessage ? Colors.semantic.error : isDark ? Colors.border.dark : Colors.border.light;

  return (
    <View style={styles.inputContainer}>
      <View style={styles.labelRow}>
        <Text size="xs" emphasis="light">
          {label}
        </Text>
        <Text size="xs" style={styles.requiredMark}>
          *
        </Text>
      </View>
      <View style={[styles.inputShell, { backgroundColor: fieldColor, borderColor }]}>
        <Icon size={19} color={errorMessage ? Colors.semantic.error : activeColor} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={mutedTextColor}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={icon === 'phone' ? 'none' : 'words'}
          autoCorrect={false}
          style={[styles.inputField, { color: isDark ? Colors.text.dark : Colors.text.light }]}
        />
      </View>
      {errorMessage ? (
        <Text size="2xs" style={styles.errorText}>
          {errorMessage}
        </Text>
      ) : helperText ? (
        <Text size="2xs" emphasis="light" style={styles.helperText}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const BarangayForm = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const authUser = useAuth(state => state.authUser);
  const authLoading = useAuth(state => state.isLoading);
  const setHasSignedOut = useAuth(state => state.setHasSignedOut);
  const setGuestIntent = useAuth(state => state.setGuestIntent);
  const setShowingSetupComplete = useAuth(state => state.setShowingSetupComplete);
  const isShowingSetupComplete = useAuth(state => state.isShowingSetupComplete);
  const setUserData = useUserData(state => state.setUserData);
  const userData = useUserData(state => state.userData);
  const { getToken } = useIdToken();

  const [currentStep, setCurrentStep] = useState<SetupStep>(1);
  const [hasResolvedInitialStep, setHasResolvedInitialStep] = useState(false);
  const [locationCoverage, setLocationCoverage] = useState<LocationCoverageResponse>(EMPTY_LOCATION_COVERAGE);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileErrorMessage, setProfileErrorMessage] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const {
    firstName,
    lastName,
    contactNumber,
    firstNameTouched,
    lastNameTouched,
    setFirstName,
    setLastName,
    setContactNumber,
    reset: resetProfileForm,
  } = useProfileFormStore();

  const loadLocationCoverage = useCallback(async () => {
    setCoverageLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.get<LocationCoverageResponse>(API_ROUTES.DATA.GET_LOCATION_COVERAGE, {
        timeout: 30000,
      });

      setLocationCoverage(response.data);
    } catch (error) {
      if (!isAxiosError(error) || error.response?.status !== 404) {
        console.error('Error loading location coverage:', error);
      }
      setLocationCoverage(EMPTY_LOCATION_COVERAGE);
      setErrorMessage('Location coverage is unavailable. Please try again.');
    } finally {
      setCoverageLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLocationCoverage();
  }, [loadLocationCoverage]);

  const provinces = useMemo(() => locationCoverage.provinces, [locationCoverage]);
  const selectedProvince = useMemo(
    () => provinces.find(province => province.provinceCode === selectedProvinceCode),
    [provinces, selectedProvinceCode]
  );

  const municipalityClients = useMemo(() => selectedProvince?.clients ?? [], [selectedProvince]);
  const selectedClient = useMemo(
    () => municipalityClients.find(client => client.clientId === selectedClientId),
    [municipalityClients, selectedClientId]
  );

  const provinceOptions = useMemo(
    () => sortByLabel(provinces.map(province => ({ label: province.provinceName, value: province.provinceCode }))),
    [provinces]
  );

  const municipalityOptions = useMemo(
    () => sortByLabel(municipalityClients.map(client => ({ label: client.municipalityName, value: client.clientId }))),
    [municipalityClients]
  );

  const barangayOptions = useMemo(
    () =>
      sortByLabel(
        selectedClient?.barangays.map(barangay => ({
          label: barangay.barangayLabel,
          value: barangay.value,
        })) ?? []
      ),
    [selectedClient]
  );

  const selectedLocation = useMemo(
    () => toResidentLocationSelectionFromCoverageClient(selectedClient, selectedBarangay),
    [selectedClient, selectedBarangay]
  );

  const hasSavedLocation = Boolean(userData?.barangay && userData?.clientId && userData?.weatherLocationKey);
  const hasSavedProfile = Boolean(userData?.firstName && userData?.lastName && userData?.phoneNumber);
  const setupCompleteImageSource = isDark
    ? require('@/assets/images/states/done-dark.png')
    : require('@/assets/images/states/done-light.png');

  useEffect(() => {
    if (hasResolvedInitialStep && !isShowingSetupComplete) {
      return;
    }

    if (isShowingSetupComplete) {
      setCurrentStep(3);
      setHasResolvedInitialStep(true);
      return;
    }

    if (hasSavedLocation && !hasSavedProfile) {
      setCurrentStep(2);
    }

    setHasResolvedInitialStep(true);
  }, [hasResolvedInitialStep, hasSavedLocation, hasSavedProfile, isShowingSetupComplete]);

  useEffect(() => {
    if (!selectedProvinceCode && provinces.length === 1) {
      setSelectedProvinceCode(provinces[0].provinceCode);
    }
  }, [provinces, selectedProvinceCode]);

  useEffect(() => {
    if (!selectedProvince) {
      return;
    }

    const selectedClientStillAvailable = selectedProvince.clients.some(client => client.clientId === selectedClientId);

    if (selectedProvince.clients.length === 1 && !selectedClientStillAvailable) {
      setSelectedClientId(selectedProvince.clients[0].clientId);
      setSelectedBarangay('');
      return;
    }

    if (selectedClientId && !selectedClientStillAvailable) {
      setSelectedClientId('');
      setSelectedBarangay('');
    }
  }, [selectedProvince, selectedClientId]);

  useEffect(() => {
    if (!selectedClient || !selectedBarangay) {
      return;
    }

    const selectedBarangayStillAvailable = selectedClient.barangays.some(barangay => barangay.value === selectedBarangay);

    if (!selectedBarangayStillAvailable) {
      setSelectedBarangay('');
    }
  }, [selectedClient, selectedBarangay]);

  useEffect(() => {
    let isActive = true;

    const initializeFromGoogle = async () => {
      try {
        let googleUser = GoogleSignin.getCurrentUser();

        if (!googleUser && GoogleSignin.hasPreviousSignIn()) {
          const silentResponse = await GoogleSignin.signInSilently();
          if (silentResponse.type === 'success') {
            googleUser = silentResponse.data;
          }
        }

        if (!googleUser || !isActive) {
          return;
        }

        const googleFirstName = (googleUser.user.givenName ?? '').trim();
        const googleLastName = (googleUser.user.familyName ?? '').trim();
        const {
          firstName: currentFirstName,
          lastName: currentLastName,
          firstNameTouched: currentFirstNameTouched,
          lastNameTouched: currentLastNameTouched,
        } = useProfileFormStore.getState();

        if (!currentFirstNameTouched && !currentFirstName.trim() && googleFirstName) {
          setFirstName(formatName(googleFirstName));
        }
        if (!currentLastNameTouched && !currentLastName.trim() && googleLastName) {
          setLastName(formatName(googleLastName));
        }
      } catch {
        // Google profile data is optional for this setup step.
      }
    };

    const backendFirstName = (userData?.firstName ?? '').trim();
    const backendLastName = (userData?.lastName ?? '').trim();

    if (!firstNameTouched && !firstName.trim() && backendFirstName) {
      setFirstName(formatName(backendFirstName));
    }
    if (!lastNameTouched && !lastName.trim() && backendLastName) {
      setLastName(formatName(backendLastName));
    }

    const shouldTryGoogle =
      authUser && ((!firstNameTouched && !firstName.trim()) || (!lastNameTouched && !lastName.trim()));

    if (shouldTryGoogle) {
      void initializeFromGoogle();
    }

    return () => {
      isActive = false;
    };
  }, [authUser, userData, firstName, lastName, firstNameTouched, lastNameTouched, setFirstName, setLastName]);

  const saveBarangayToBackend = async (
    token: string,
    fcmToken: string,
    locationSelection: ResidentLocationSelection
  ) => {
    if (!fcmToken) {
      console.log('Failed to get FCM token. Please try again.');
    }

    await axios.post(
      API_ROUTES.DATA.SAVE_BARANGAY_DATA,
      {
        uid: authUser?.uid,
        fcmToken,
        ...locationSelection,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      }
    );
  };

  const persistLocationData = async (locationSelection: ResidentLocationSelection, fcmToken: string) => {
    const currentUserData = await storageHelpers.getData<Record<string, unknown>>(STORAGE_KEYS.USER);

    await storageHelpers.setData(STORAGE_KEYS.USER, {
      ...(currentUserData && typeof currentUserData === 'object' ? currentUserData : {}),
      ...locationSelection,
      fcmToken,
    });
  };

  const handleSaveBarangay = async () => {
    if (!selectedProvinceCode) {
      setErrorMessage('Please select your province');
      return;
    }

    if (!selectedClientId) {
      setErrorMessage('Please select your municipality or city');
      return;
    }

    if (!selectedLocation) {
      setErrorMessage('Please select your barangay');
      return;
    }

    if (!authUser && authLoading) {
      setErrorMessage('Please wait for authentication to complete.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      let fcmToken = '';

      if (authUser) {
        const token = await authUser.getIdToken();

        if (!token) {
          setErrorMessage('Failed to authenticate. Please try again.');
          setIsLoading(false);
          return;
        }

        fcmToken = await getFcmToken(messaging);
        await saveBarangayToBackend(token, fcmToken, selectedLocation);
      }

      setUserData({
        userData: {
          ...userData,
          ...selectedLocation,
          fcmToken,
        },
      });

      await persistLocationData(selectedLocation, fcmToken);
      await storageHelpers.setField(STORAGE_KEYS.APP_STATE, 'hasSignedOut', false);
      if (!authUser) {
        await storageHelpers.setField(STORAGE_KEYS.APP_STATE, 'isGuestMode', true);
      }
      setHasSignedOut(false);
      setGuestIntent(false);

      setCurrentStep(2);
    } catch (error) {
      console.error('Error saving barangay:', error);
      if (isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      }
      setErrorMessage('Failed to save barangay. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileInputChange = (field: 'firstName' | 'lastName' | 'contactNumber', value: string) => {
    let formattedValue = value;

    if (field === 'firstName' || field === 'lastName') {
      formattedValue = formatName(value);
    } else if (field === 'contactNumber') {
      formattedValue = formatContactNumber(value);
    }

    if (field === 'firstName') {
      setFirstName(formattedValue, true);
    } else if (field === 'lastName') {
      setLastName(formattedValue, true);
    } else {
      setContactNumber(formattedValue);
    }

    if (profileErrorMessage[field]) {
      setProfileErrorMessage({ ...profileErrorMessage, [field]: '' });
    }
  };

  const handleSaveUser = async () => {
    const newErrors = { firstName: '', lastName: '', contactNumber: '' };

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!contactNumber?.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!isValidContactNumber(contactNumber)) {
      newErrors.contactNumber = 'Please enter a valid 11-digit mobile number';
    }

    setProfileErrorMessage(newErrors);

    if (!firstName.trim() || !lastName.trim() || !contactNumber || !isValidContactNumber(contactNumber)) {
      return;
    }

    setProfileLoading(true);

    try {
      const e164ContactNumber = convertToE164Format(contactNumber);

      if (authUser) {
        const token = await getToken();

        if (!token) {
          setProfileErrorMessage({
            ...newErrors,
            contactNumber: 'Authentication failed. Please try again.',
          });
          return;
        }

        await axios.post(
          API_ROUTES.DATA.SAVE_USER_DATA,
          {
            uid: authUser?.uid,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phoneNumber: contactNumber,
            e164PhoneNumber: e164ContactNumber,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            timeout: 30000,
          }
        );
      }

      const storedUserData = await storageHelpers.getData<Partial<typeof userData>>(STORAGE_KEYS.USER);
      const nextStoredUserData = {
        ...(storedUserData ?? {}),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: contactNumber,
        e164PhoneNumber: e164ContactNumber,
      };

      await storageHelpers.setData(STORAGE_KEYS.USER, nextStoredUserData);
      await storageHelpers.setField(STORAGE_KEYS.APP_STATE, 'hasSignedOut', false);
      if (!authUser) {
        await storageHelpers.setField(STORAGE_KEYS.APP_STATE, 'isGuestMode', true);
      }
      setHasSignedOut(false);
      setGuestIntent(false);

      const savedBarangay =
        typeof nextStoredUserData.barangay === 'string' && nextStoredUserData.barangay.trim()
          ? nextStoredUserData.barangay
          : userData.barangay;

      setUserData({
        userData: {
          ...userData,
          ...nextStoredUserData,
          barangay: savedBarangay ?? '',
        },
      });

      resetProfileForm();
      setShowingSetupComplete(true);
      setCurrentStep(3);
    } catch (error) {
      console.error('Error saving user data:', error);
      if (isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      }
      setProfileErrorMessage({
        ...newErrors,
        contactNumber: 'Failed to save user data. Please try again.',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleContinue = () => {
    setShowingSetupComplete(false);
    router.replace('/(app)/(tabs)' as any);
  };

  const hasCoverageError = !coverageLoading && provinces.length === 0 && Boolean(errorMessage);
  const isLocationSubmitDisabled = isLoading || coverageLoading || provinces.length === 0;
  const isPrimaryDisabled =
    currentStep === 1 ? isLocationSubmitDisabled : currentStep === 2 ? profileLoading : false;
  const primaryButtonLabel =
    currentStep === 1 ? (isLoading ? 'Saving...' : 'Next') : currentStep === 2 ? (profileLoading ? 'Saving...' : 'Next') : 'Continue';
  const activeTitle =
    currentStep === 1 ? 'Set your location' : currentStep === 2 ? 'Your details' : 'Setup complete';

  const handlePrimaryAction = () => {
    if (isPrimaryDisabled) {
      return;
    }

    if (currentStep === 1) {
      void handleSaveBarangay();
      return;
    }

    if (currentStep === 2) {
      void handleSaveUser();
      return;
    }

    handleContinue();
  };

  const handleBackToLocation = () => {
    Keyboard.dismiss();
    setCurrentStep(1);
  };

  return (
    <Body style={styles.body}>
      <View style={styles.screen}>
        <SetupStepper currentStep={currentStep} title={activeTitle} />

        <View style={styles.formViewport}>
          {currentStep === 1 ? (
            <View style={styles.formSection}>
              {errorMessage ? (
                <View
                  style={[
                    styles.statusBanner,
                    {
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                      borderColor: isDark ? 'rgba(239, 68, 68, 0.32)' : '#FECACA',
                    },
                  ]}
                >
                  <View style={styles.statusMessageRow}>
                    <AlertCircle size={18} color={Colors.semantic.error} />
                    <Text size="xs" style={styles.errorText}>
                      {errorMessage}
                    </Text>
                  </View>
                  {hasCoverageError ? (
                    <Pressable
                      onPress={loadLocationCoverage}
                      style={({ pressed }) => [
                        styles.retryPill,
                        {
                          borderColor: isDark ? 'rgba(239, 68, 68, 0.38)' : '#FECACA',
                          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.10)' : '#FFFFFF',
                          opacity: pressed ? 0.72 : 1,
                        },
                      ]}
                    >
                      <RefreshCw size={15} color={Colors.semantic.error} />
                      <Text size="2xs" bold style={styles.retryText}>
                        Retry
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {coverageLoading ? (
                <View
                  style={[
                    styles.loadingState,
                    {
                      backgroundColor: isDark ? Colors.muted.dark.background : '#FFFFFF',
                      borderColor: isDark ? Colors.border.dark : Colors.border.light,
                    },
                  ]}
                >
                  <Spinner />
                  <Text size="sm" emphasis="light">
                    Loading supported locations...
                  </Text>
                </View>
              ) : (
                <View style={styles.selectStack}>
                  <LocationSelectField
                    label="Province"
                    placeholder="Select your province"
                    options={provinceOptions}
                    value={selectedProvinceCode}
                    isDark={isDark}
                    onChange={value => {
                      setSelectedProvinceCode(value);
                      setSelectedClientId('');
                      setSelectedBarangay('');
                      setErrorMessage('');
                    }}
                  />
                  <LocationSelectField
                    label="Municipality / City"
                    placeholder="Select your municipality or city"
                    options={municipalityOptions}
                    value={selectedClientId}
                    isDisabled={!selectedProvinceCode}
                    isDark={isDark}
                    onChange={value => {
                      setSelectedClientId(value);
                      setSelectedBarangay('');
                      setErrorMessage('');
                    }}
                  />
                  <LocationSelectField
                    label="Barangay"
                    placeholder="Select your barangay"
                    options={barangayOptions}
                    value={selectedBarangay}
                    isDisabled={!selectedClientId}
                    isDark={isDark}
                    onChange={value => {
                      setSelectedBarangay(value);
                      setErrorMessage('');
                    }}
                  />
                </View>
              )}

              <Text style={styles.description} emphasis="light">
                We collect your location information to accurately provide location-based disaster updates, coordinate
                assistance, and ensure the accuracy of information we will provide.
              </Text>
            </View>
          ) : null}

          {currentStep === 2 ? (
            <View style={styles.formSection}>
              <ProfileField
                label="First name"
                placeholder="Juan"
                value={firstName}
                errorMessage={profileErrorMessage.firstName}
                icon="user"
                isDark={isDark}
                onChangeText={text => handleProfileInputChange('firstName', text)}
              />
              <ProfileField
                label="Last name"
                placeholder="Dela Cruz"
                value={lastName}
                errorMessage={profileErrorMessage.lastName}
                icon="user"
                isDark={isDark}
                onChangeText={text => handleProfileInputChange('lastName', text)}
              />
              <ProfileField
                label="Contact number"
                placeholder="0912-345-6789"
                value={contactNumber}
                errorMessage={profileErrorMessage.contactNumber}
                helperText="Format: 09XX-XXX-XXXX"
                keyboardType="numeric"
                maxLength={13}
                icon="phone"
                isDark={isDark}
                onChangeText={text => handleProfileInputChange('contactNumber', text)}
              />
            </View>
          ) : null}

          {currentStep === 3 ? (
            <View style={styles.completeContent}>
              <Image source={setupCompleteImageSource} resizeMode="contain" style={styles.completeImage} />
              <Text size="md" bold>
                You are all set
              </Text>
              <Text size="xs" emphasis="light" style={styles.completeMessage}>
                Welcome to Rescuenect
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Button
            isDisabled={isPrimaryDisabled}
            onPress={handlePrimaryAction}
            style={[styles.primaryButton, isPrimaryDisabled ? styles.disabledPrimaryButton : null]}
          >
            {primaryButtonLabel}
          </Button>
          <Pressable
            onPress={currentStep === 2 ? handleBackToLocation : () => {}}
            pointerEvents={currentStep === 2 ? 'auto' : 'none'}
            style={({ pressed }) => [
              styles.backButton,
              currentStep === 2 ? null : styles.invisibleBackButton,
              pressed ? styles.pressedBack : null,
            ]}
          >
            {/* <ArrowLeft size={16} color={isDark ? Colors.icons.dark : Colors.icons.light} /> */}
            <Text size="sm" emphasis="light">
              Back
            </Text>
          </Pressable>
        </View>
      </View>
    </Body>
  );
};

export default BarangayForm;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'stretch',
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  screen: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    justifyContent: 'space-between',
    gap: 22,
    paddingTop: 22,
  },
  formViewport: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  formSection: {
    width: '100%',
    gap: 14,
  },
  inputContainer: {
    gap: 7,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requiredMark: {
    color: Colors.semantic.error,
  },
  inputShell: {
    width: '100%',
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputField: {
    flex: 1,
    minHeight: 56,
    padding: 0,
    fontSize: 15,
    fontFamily: 'Poppins',
  },
  statusBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  statusMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  retryPill: {
    minHeight: 34,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  retryText: {
    color: Colors.semantic.error,
  },
  selectStack: {
    gap: 14,
  },
  selectField: {
    gap: 7,
  },
  dropdownTrigger: {
    width: '100%',
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dropdownValue: {
    flex: 1,
  },
  disabledDropdown: {
    opacity: 0.58,
  },
  helperText: {
    marginTop: -2,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  backdropPressable: {
    flex: 1,
  },
  keyboardAvoider: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    width: '100%',
    minHeight: '58%',
    maxHeight: '84%',
    borderTopWidth: 1,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    padding: 16,
    paddingBottom: Platform.select({ ios: 28, android: 24, default: 18 }),
    gap: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sheetTitleGroup: {
    flex: 1,
    gap: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    minHeight: 46,
    padding: 0,
    fontSize: 15,
    fontFamily: 'Poppins',
  },
  optionList: {
    flex: 1,
  },
  optionListContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  optionItem: {
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionLabel: {
    flex: 1,
  },
  optionSeparator: {
    height: 1,
  },
  emptyOption: {
    minHeight: 80,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingState: {
    minHeight: 224,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    gap: 10,
  },
  description: {
    textAlign: 'left',
    width: '100%',
    lineHeight: 23,
    marginTop: 2,
  },
  footer: {
    width: '100%',
    gap: 14,
    paddingTop: 6,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 8,
  },
  disabledPrimaryButton: {
    opacity: 0.5,
  },
  backButton: {
    minHeight: 42,
    alignSelf: 'center',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  invisibleBackButton: {
    opacity: 0,
  },
  pressedBack: {
    opacity: 0.68,
  },
  completeContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeImage: {
    width: 220,
    height: 220,
  },
  completeMessage: {
    textAlign: 'center',
  },
  errorText: {
    color: Colors.semantic.error,
    flexShrink: 1,
  },
});
