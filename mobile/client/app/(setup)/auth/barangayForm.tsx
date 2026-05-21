import Logo from '@/assets/images/logo/logoVerti.svg';
import { Body } from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { API_ROUTES } from '@/config/endpoints';
import type {
  LocationCoverageClient,
  LocationCoverageResponse,
  ResidentLocationSelection,
} from '@/config/locationConfig';
import { getActiveLocationCoverage } from '@/config/locationConfig';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { sortByLabel } from '@/helper/commonHelpers';
import { storageHelpers } from '@/helper/storage';
import { messaging } from '@/lib/firebaseConfig';
import { useAuth } from '@/store/useAuth';
import { useUserData } from '@/store/useBackendResponse';
import { getToken as getFcmToken } from '@react-native-firebase/messaging';
import axios, { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { Button, Input, Spinner } from 'heroui-native';
import { ChevronDown } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, View } from 'react-native';

type SelectOption = {
  label: string;
  value: string;
};

type LocationSelectFieldProps = {
  label: string;
  placeholder: string;
  options: SelectOption[];
  value: string;
  isDisabled?: boolean;
  isDark: boolean;
  onChange: (value: string) => void;
};

const LocationSelectField = ({
  label,
  placeholder,
  options,
  value,
  isDisabled = false,
  isDark,
  onChange,
}: LocationSelectFieldProps) => {
  const selectedOption = options.find(option => option.value === value);
  const disabled = isDisabled || options.length === 0;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(selectedOption?.label ?? '');
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter(option => option.label.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery(selectedOption?.label ?? '');
    }
  }, [isOpen, selectedOption?.label]);

  const handleSelect = (option: SelectOption) => {
    onChange(option.value);
    setQuery(option.label);
    setIsOpen(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.selectField}>
      <Text size="xs" emphasis="light">
        {label}
      </Text>
      <View
        style={[
          styles.dropdownTrigger,
          {
            backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
            borderColor: isDark ? Colors.border.dark : Colors.border.light,
          },
          disabled ? styles.disabledDropdown : null,
        ]}
      >
        <Input
          value={query}
          editable={!disabled}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChangeText={text => {
            setQuery(text);
            setIsOpen(true);

            if (selectedOption && text !== selectedOption.label) {
              onChange('');
            }
          }}
          onSubmitEditing={() => {
            if (filteredOptions.length === 1) {
              handleSelect(filteredOptions[0]);
            }
          }}
          style={[
            styles.dropdownInput,
            {
              color: isDark ? Colors.text.dark : Colors.text.light,
            },
          ]}
          placeholderTextColor={isDark ? Colors.text.dark : Colors.text.light}
        />
        <Pressable onPress={() => !disabled && setIsOpen(current => !current)} hitSlop={12}>
          <ChevronDown size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
        </Pressable>
      </View>
      {isOpen && !disabled ? (
        <View
          style={[
            styles.dropdownList,
            {
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
              borderColor: isDark ? Colors.border.dark : Colors.border.light,
            },
          ]}
        >
          <ScrollView
            style={styles.optionList}
            contentContainerStyle={styles.optionListContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.optionItem,
                    {
                      borderBottomColor: isDark ? Colors.border.dark : Colors.border.light,
                    },
                  ]}
                  onPress={() => handleSelect(option)}
                >
                  <Text size="sm" bold={option.value === value}>
                    {option.label}
                  </Text>
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyOption}>
                <Text size="sm" emphasis="light">
                  No matching location
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};

const toResidentLocationSelection = (
  client: LocationCoverageClient | undefined,
  barangayValue: string
): ResidentLocationSelection | null => {
  const barangay = client?.barangays.find(item => item.value === barangayValue);

  if (!client || !barangay) {
    return null;
  }

  return {
    barangay: barangay.value,
    clientId: client.clientId,
    clientName: client.clientName,
    provinceCode: client.provinceCode,
    provinceName: client.provinceName,
    municipalityCode: client.municipalityCode,
    municipalityName: client.municipalityName,
    municipalityType: client.municipalityType,
    barangayCode: barangay.barangayCode,
    barangayLabel: barangay.barangayLabel,
    weatherLocationKey: client.weatherLocationKey,
  };
};

const BarangayForm = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const authUser = useAuth(state => state.authUser);
  const authLoading = useAuth(state => state.isLoading);
  const setHasSignedOut = useAuth(state => state.setHasSignedOut);
  const setGuestIntent = useAuth(state => state.setGuestIntent);
  const setUserData = useUserData(state => state.setUserData);
  const userData = useUserData(state => state.userData);

  const [locationCoverage, setLocationCoverage] = useState<LocationCoverageResponse>(() => getActiveLocationCoverage());
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      setLocationCoverage(getActiveLocationCoverage());
      setErrorMessage('');
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
    () => toResidentLocationSelection(selectedClient, selectedBarangay),
    [selectedClient, selectedBarangay]
  );

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

      router.push('/auth/nameAndContactForm' as any);
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

  return (
    <Body style={styles.body}>
      <View style={styles.welcomeContainer}>
        <Logo width={200} height={100} />
      </View>
      <View style={styles.container}>
        <View style={styles.title}>
          <Text size="sm">Set your Location</Text>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>

        {coverageLoading ? (
          <View style={styles.loadingState}>
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

        {!coverageLoading && provinces.length === 0 ? (
          <Button onPress={loadLocationCoverage} style={styles.retryButton}>
            Retry
          </Button>
        ) : null}

        <Text style={styles.description} emphasis="light">
          We collect your location information to accurately provide location-based disaster updates, coordinate
          assistance, and ensure the accuracy of information we will provide.
        </Text>
      </View>
      <View style={styles.primaryButton}>
        <Button
          onPress={isLoading || coverageLoading ? () => {} : handleSaveBarangay}
          style={[isLoading || coverageLoading ? { opacity: 0.5 } : null, { borderRadius: 10 }]}
        >
          {isLoading ? 'Saving...' : 'Next'}
        </Button>
      </View>
    </Body>
  );
};

export default BarangayForm;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  welcomeContainer: {
    position: 'absolute',
    top: '10%',
    textAlign: 'center',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  container: {
    gap: 10,
    marginBottom: 60,
    width: '100%',
  },
  selectStack: {
    gap: 12,
  },
  selectField: {
    gap: 6,
  },
  dropdownTrigger: {
    width: '100%',
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownInput: {
    flex: 1,
    minHeight: 48,
    padding: 0,
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  disabledDropdown: {
    opacity: 0.65,
  },
  dropdownList: {
    width: '100%',
    maxHeight: 220,
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 6,
    overflow: 'hidden',
  },
  optionList: {
    maxHeight: 220,
  },
  optionListContent: {
    paddingBottom: 4,
  },
  optionItem: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    justifyContent: 'center',
  },
  emptyOption: {
    minHeight: 48,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  loadingState: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  retryButton: {
    borderRadius: 10,
  },
  description: {
    textAlign: 'justify',
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
  primaryButton: {
    width: '100%',
    position: 'absolute',
    bottom: 40,
    padding: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    flexShrink: 1,
  },
});
