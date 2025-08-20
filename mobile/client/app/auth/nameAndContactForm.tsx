import Logo from '@/assets/images/logo/logoVerti.svg'
import { PrimaryButton } from '@/components/components/button/Button'
import { storage } from '@/components/helper/storage'
import { Input, InputField } from "@/components/ui/input"
import Body from '@/components/ui/layout/Body'
import { Text } from '@/components/ui/text'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { create } from 'zustand'

type FormState = {
  firstName: string
  lastName: string
  contactNumber?: string
  setFirstName: (name: string) => void
  setLastName: (name: string) => void
  setContactNumber: (number: string) => void
  reset: () => void
}

const useFormStore = create<FormState>((set) => ({
  firstName: '',
  lastName: '',
  contactNumber: '',
  setFirstName: (firstName) => set({ firstName }),
  setLastName: (lastName) => set({ lastName }),
  setContactNumber: (contactNumber) => set({ contactNumber }),
  reset: () => set({ firstName: '', lastName: '', contactNumber: '' }),
}))


const nameAndContactForm = () => {
    const [errorMessage, setErrorMessage] = useState({ firstName: '', lastName: '', contactNumber: '' });
    const { firstName, lastName, contactNumber, setFirstName, setLastName, setContactNumber, reset } = useFormStore();
    const router = useRouter()

    // Format name with proper capitalization
    const formatName = (text: string): string => {
        return text
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Format contact number with dashes and limit to 11 digits
    const formatContactNumber = (text: string): string => {
        // Remove all non-numeric characters
        const numericOnly = text.replace(/\D/g, '');
        
        // Limit to 11 digits
        const limitedNumbers = numericOnly.slice(0, 11);
        
        // Format with dashes: XXXX-XXX-XXXX
        if (limitedNumbers.length <= 4) {
            return limitedNumbers;
        } else if (limitedNumbers.length <= 7) {
            return `${limitedNumbers.slice(0, 4)}-${limitedNumbers.slice(4)}`;
        } else {
            return `${limitedNumbers.slice(0, 4)}-${limitedNumbers.slice(4, 7)}-${limitedNumbers.slice(7)}`;
        }
    };

    // Convert contact number to E.164 format (+63xxxxxxxxxx)
    const convertToE164Format = (contactNumber: string): string => {
        // Remove all non-numeric characters
        const numericOnly = contactNumber.replace(/\D/g, '');
        
        // Convert to E.164 format
        if (numericOnly.length === 11 && numericOnly.startsWith('09')) {
            // Replace leading 09 with +639
            return `+63${numericOnly.slice(1)}`;
        } else if (numericOnly.length === 10 && numericOnly.startsWith('9')) {
            // Add +639 prefix
            return `+639${numericOnly}`;
        } else if (numericOnly.length === 11 && numericOnly.startsWith('63')) {
            // Add + prefix
            return `+${numericOnly}`;
        }
        
        // Default: assume it's a 10-digit number and add +639
        return `+639${numericOnly}`;
    };

    // Validate contact number (must be exactly 11 digits)
    const isValidContactNumber = (contactNumber: string): boolean => {
        const numericOnly = contactNumber.replace(/\D/g, '');
        return numericOnly.length === 11 && numericOnly.startsWith('09');
    };

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
                
                // Prepare user data
                const userData = {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    contactNumber: contactNumber, // Original formatted number
                    e164ContactNumber: e164ContactNumber, // E.164 format for Firebase
                    fullName: `${firstName.trim()} ${lastName.trim()}`
                };
                
                // Save to AsyncStorage
                await storage.set('@user', userData);
                
                // Reset the Zustand store after successful save
                reset();
                
                // Navigate to main app
                router.replace('/auth/setupComplete' as any);
            } catch (error) {
                console.error('Error saving user data:', error);
                setErrorMessage({ 
                    ...newErrors, 
                    contactNumber: 'Failed to save user data. Please try again.' 
                });
            }
        }
    }

  return (
    <Body style={styles.body}>
        <View style={styles.welcomeContainer}>
            <Logo width={200} height={100} />
        </View>
        <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
                <View style={styles.inputPlaceholder}>
                    <Text>First Name</Text>
                    {errorMessage.firstName && (
                        <Text style={styles.errorText}>{errorMessage.firstName}</Text>
                    )}
                </View>
                <Input
                    variant="outline"
                    size="md"
                    style={styles.inputStyle}
                >
                    <InputField
                        style={styles.inputField}
                        placeholder="Juan"
                        value={firstName}
                        onChangeText={(text) => handleInputChange('firstName', text)}
                    />
                </Input>
            </View>
            <View style={styles.inputContainer}>
                <View style={styles.inputPlaceholder}>
                    <Text>Last Name</Text>
                    {errorMessage.lastName && (
                        <Text style={styles.errorText}>{errorMessage.lastName}</Text>
                    )}
                </View>
                <Input
                    variant="outline"
                    size="md"
                    style={styles.inputStyle}
                >
                    <InputField
                        style={styles.inputField}
                        placeholder="Dela Cruz"
                        value={lastName}
                        onChangeText={(text) => handleInputChange('lastName', text)}
                    />
                </Input>
            </View>
            <View style={styles.inputContainer}>
                <View style={styles.inputPlaceholder}>
                    <Text>Contact Number</Text>
                    {errorMessage.contactNumber && (
                        <Text style={styles.errorText}>{errorMessage.contactNumber}</Text>
                    )}
                </View>
                <Input
                    variant="outline"
                    size="md"
                    style={styles.inputStyle}
                >
                    <InputField
                        style={styles.inputField}
                        placeholder="0917-123-4567"
                        value={contactNumber}
                        onChangeText={(text) => handleInputChange('contactNumber', text)}
                        keyboardType="numeric"
                        maxLength={13} // XXXX-XXX-XXXX format
                    />
                </Input>
                <Text style={styles.helperText}>Format: 09XX-XXX-XXXX (11 digits)</Text>
            </View>
        </View>
      
        <View style={styles.primaryButton}>
            <PrimaryButton 
            onPress={handleSaveUser}>
                Save
            </PrimaryButton>
            <Pressable
            onPress={() => router.back()}
            >
                <Text style={styles.backText}>Back</Text>
            </Pressable>
        </View>
    </Body>
  )
}

export default nameAndContactForm

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
        gap: 10 
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
})