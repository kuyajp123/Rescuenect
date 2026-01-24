import Logo from '@/assets/images/logo/logoVerti.svg';
import { PrimaryButton } from '@/components/components/button/Button';
import { Input, InputField } from '@/components/ui/input';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { API_ROUTES } from '@/config/endpoints';
import { convertToE164Format, formatContactNumber, formatName, isValidContactNumber } from '@/helper/commonHelpers';
import { storageHelpers } from '@/helper/storage';
import { useIdToken } from '@/hooks/useIdToken';
import { useAuth } from '@/store/useAuth';
import { useUserData } from '@/store/useBackendResponse';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { create } from 'zustand';

type FormState = {
  firstName: string;
  lastName: string;
  contactNumber?: string;
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  setContactNumber: (number: string) => void;
  reset: () => void;
};

export const useFormStore = create<FormState>(set => ({
  firstName: '',
  lastName: '',
  contactNumber: '',
  setFirstName: firstName => set({ firstName }),
  setLastName: lastName => set({ lastName }),
  setContactNumber: contactNumber => set({ contactNumber }),
  reset: () => set({ firstName: '', lastName: '', contactNumber: '' }),
}));

const nameAndContactForm = () => {
  const authUser = useAuth(state => state.authUser);
  const [errorMessage, setErrorMessage] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
  });
  const { firstName, lastName, contactNumber, setFirstName, setLastName, setContactNumber, reset } = useFormStore();
  const router = useRouter();
  const userData = useUserData(state => state.userData);
  const setUserData = useUserData(state => state.setUserData);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Use the custom hook instead of manual token management
  const { getToken } = useIdToken();

  // Initialize form with user data from Firebase Auth
  useEffect(() => {
    if (authUser?.displayName) {
      // If user has a display name, set it as the default firstName
      const displayName = authUser.displayName.trim();

      if (displayName) {
        setFirstName(formatName(displayName));
      }
    } else {
      // If no user or no display name, ensure fields are empty
      setFirstName('');
      setLastName('');
    }
  }, [authUser, setFirstName, setLastName]);

  const handleInputChange = (field: 'firstName' | 'lastName' | 'contactNumber', value: string) => {
    let formattedValue = value;

    // Apply formatting based on field type
    if (field === 'firstName' || field === 'lastName') {
      formattedValue = formatName(value);
    } else if (field === 'contactNumber') {
      formattedValue = formatContactNumber(value);
    }

    // Update Zustand store based on field
    if (field === 'firstName') {
      setFirstName(formattedValue);
    } else if (field === 'lastName') {
      setLastName(formattedValue);
    } else if (field === 'contactNumber') {
      setContactNumber(formattedValue);
    }

    // Clear error for this field when user starts typing
    if (errorMessage[field]) {
      setErrorMessage({ ...errorMessage, [field]: '' });
    }
  };

  const handleSaveUser = async () => {
    // Reset all error messages first
    const newErrors = { firstName: '', lastName: '', contactNumber: '' };

    // Check each field and set error messages
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

    // Update error state
    setErrorMessage(newErrors);

    // If all fields are valid, proceed with saving the user
    if (firstName.trim() && lastName.trim() && contactNumber && isValidContactNumber(contactNumber)) {
      try {
        // Convert contact number to E.164 format
        const e164ContactNumber = convertToE164Format(contactNumber);

        if (authUser) {
          setIsLoading(true);
          // ✅ Use the hook's getToken method to ensure we have a valid token
          const token = await getToken();

          if (!token) {
            setErrorMessage({
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
              timeout: 30000, // 30 seconds timeout
            }
          );
        }

        // Save to AsyncStorage using field operations to preserve existing data (like barangay)
        await storageHelpers.setField(STORAGE_KEYS.USER, 'firstName', firstName.trim());
        await storageHelpers.setField(STORAGE_KEYS.USER, 'lastName', lastName.trim());
        await storageHelpers.setField(STORAGE_KEYS.USER, 'phoneNumber', contactNumber);
        await storageHelpers.setField(STORAGE_KEYS.USER, 'e164PhoneNumber', e164ContactNumber);

        const getBarangay = await storageHelpers.getField(STORAGE_KEYS.USER, 'barangay');

        setUserData({
          userData: {
            ...userData,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phoneNumber: contactNumber,
            barangay: getBarangay,
          },
        });

        reset();
        setIsLoading(false);

        // Navigate to main app
        router.replace('/auth/setupComplete' as any);
      } catch (error) {
        console.error('❌ Error saving user data:', error);
        if (axios.isAxiosError(error)) {
          console.error('❌ Axios error details:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          });
        }
        setErrorMessage({
          ...newErrors,
          contactNumber: 'Failed to save user data. Please try again.',
        });
        setIsLoading(false);
      }
    }
  };

  return (
    <Body style={styles.body}>
      <View style={styles.welcomeContainer}>
        <Logo width={200} height={100} />
      </View>
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <View style={styles.inputPlaceholder}>
            <Text>First Name</Text>
            {errorMessage.firstName && <Text style={styles.errorText}>{errorMessage.firstName}</Text>}
          </View>
          <Input variant="outline" size="md" style={styles.inputStyle}>
            <InputField
              style={styles.inputField}
              placeholder="Juan"
              value={firstName}
              onChangeText={text => handleInputChange('firstName', text)}
            />
          </Input>
        </View>
        <View style={styles.inputContainer}>
          <View style={styles.inputPlaceholder}>
            <Text>Last Name</Text>
            {errorMessage.lastName && <Text style={styles.errorText}>{errorMessage.lastName}</Text>}
          </View>
          <Input variant="outline" size="md" style={styles.inputStyle}>
            <InputField
              style={styles.inputField}
              placeholder="Dela Cruz"
              value={lastName}
              onChangeText={text => handleInputChange('lastName', text)}
            />
          </Input>
        </View>
        <View style={styles.inputContainer}>
          <View style={styles.inputPlaceholder}>
            <Text>Contact Number</Text>
            {errorMessage.contactNumber && <Text style={styles.errorText}>{errorMessage.contactNumber}</Text>}
          </View>
          <Input variant="outline" size="md" style={styles.inputStyle}>
            <InputField
              style={styles.inputField}
              placeholder="0917-123-4567"
              value={contactNumber}
              onChangeText={text => handleInputChange('contactNumber', text)}
              keyboardType="numeric"
              maxLength={13} // XXXX-XXX-XXXX format
            />
          </Input>
          <Text style={styles.helperText}>Format: 09XX-XXX-XXXX (11 digits)</Text>
        </View>
      </View>

      <View style={styles.primaryButton}>
        <PrimaryButton style={[isLoading ? { opacity: 0.5 } : null]} onPress={isLoading ? () => {} : handleSaveUser}>
          {isLoading ? 'Saving...' : 'Next'}
        </PrimaryButton>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
    </Body>
  );
};

export default nameAndContactForm;

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
  formContainer: {
    width: '100%',
    marginBottom: 60,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputStyle: {
    height: 50,
    borderRadius: 8,
  },
  inputField: {
    fontSize: 14,
  },
  inputPlaceholder: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    height: 40,
    width: '100%',
    margin: 12,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  primaryButton: {
    width: '100%',
    position: 'absolute',
    bottom: '7%',
  },
  errorText: {
    marginBottom: 8,
    color: 'red',
    textAlign: 'center',
  },
  backText: {
    marginTop: 20,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 2,
  },
});
