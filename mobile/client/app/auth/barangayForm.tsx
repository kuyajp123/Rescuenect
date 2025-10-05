import Logo from '@/assets/images/logo/logoVerti.svg';
import { PrimaryButton } from '@/components/components/button/Button';
import { useAuth } from '@/components/store/useAuth';
import Body from '@/components/ui/layout/Body';
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { ChevronDown, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { create } from 'zustand';
import { useIdToken } from '@/hooks/useIdToken';
import { API_ROUTES } from '@/config/endpoints';
import { storage, storageHelpers } from '@/components/helper/storage';
import { STORAGE_KEYS } from '@/config/asyncStorage';

type barangayStore = {
  selectedBarangay: string;
  setSelectedBarangay: (barangay: string) => void;
};

export const useBarangayStore = create<barangayStore>(set => ({
  selectedBarangay: '',
  setSelectedBarangay: barangay => set({ selectedBarangay: barangay }),
}));

const barangayForm = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const selectedBarangay = useBarangayStore(state => state.selectedBarangay);
  const setSelectedBarangay = useBarangayStore(state => state.setSelectedBarangay);
  const [errorMessage, setErrorMessage] = useState('');
  const authUser = useAuth(state => state.authUser);
  const isLoading = useAuth(state => state.isLoading);

  const { getToken } = useIdToken();

  // Debug logging
  useEffect(() => {
    console.log('🏠 BarangayForm mounted', {
      hasAuthUser: !!authUser,
      authUserUid: authUser?.uid,
      isLoading: isLoading,
    });
  }, [authUser, isLoading]);

  const barangays = [
    { label: 'Labac', value: 'labac' },
    { label: 'Mabolo', value: 'mabolo' },
    { label: 'Bancaan', value: 'bancaan' },
    { label: 'Balsahan', value: 'balsahan' },
    { label: 'Bagong Karsada', value: 'bagong karsada' },
    { label: 'Sapa', value: 'sapa' },
    { label: 'Bucana Sasahan', value: 'bucana sasahan' },
    { label: 'Capt C. Nazareno', value: 'capt c. nazareno' },
    { label: 'Gomez-Zamora', value: 'gomez-zamora' },
    { label: 'Kanluran', value: 'kanluran' },
    { label: 'Humbac', value: 'humbac' },
    { label: 'Bucana Malaki', value: 'bucana malaki' },
    { label: 'Ibayo Estacion', value: 'ibayo estacion' },
    { label: 'Ibayo Silangan', value: 'ibayo silangan' },
    { label: 'Latoria', value: 'latoria' },
    { label: 'Munting Mapino', value: 'munting mapino' },
    { label: 'Timalan Balsahan', value: 'timalan balsahan' },
    { label: 'Timalan Concepcion', value: 'timalan concepcion' },
    { label: 'Muzon', value: 'muzon' },
    { label: 'Malainem Bago', value: 'malainem bago' },
    { label: 'Santulan', value: 'santulan' },
    { label: 'Calubcob', value: 'calubcob' },
    { label: 'Makina', value: 'makina' },
    { label: 'San Roque', value: 'san roque' },
    { label: 'Sabang', value: 'sabang' },
    { label: 'Molino', value: 'molino' },
    { label: 'Halang', value: 'halang' },
    { label: 'Palangue 1', value: 'palangue 1' },
    { label: 'Malainem Luma', value: 'malainem luma' },
    { label: 'Palangue 2 & 3', value: 'palangue 2 & 3' },
  ];

  const handleBarangaySelect = (barangay: any) => {
    setSelectedBarangay(barangay.label);
    setModalVisible(false);
    setErrorMessage('');
  };

  const handleSaveBarangay = async () => {
    if (!selectedBarangay) {
      setErrorMessage('Please select your barangay');
      return;
    }

    if (authUser) {
      try {
        const token = await getToken();
        if (token) {
          await saveBarangayToBackend(token);
        } else {
          setErrorMessage('Failed to authenticate. Please try again.');
          return;
        }
      } catch (error) {
        console.error('❌ Error getting token:', error);
        setErrorMessage('Failed to authenticate. Please try again.');
        return;
      }
    } else if (isLoading) {
      console.log('⏳ Authentication still loading, please wait...');
      setErrorMessage('Please wait for authentication to complete.');
    } else {
      await storageHelpers.setField(STORAGE_KEYS.USER, 'barangay', selectedBarangay);
      await storageHelpers.setField(STORAGE_KEYS.APP_STATE, 'hasSignedOut', false);

      console.log('🧭 Navigating to nameAndContactForm...');
      router.push('/auth/nameAndContactForm' as any);
    }
  };

  // ✅ Fix: Extract the backend save logic to a separate function
  const saveBarangayToBackend = async (token: string) => {
    try {
      // console.log('📡 Sending barangay to backend...', {
      //   url: `${process.env.EXPO_PUBLIC_BACKEND_URL}/data/saveBarangay`,
      //   uid: authUser?.uid,
      //   barangay: selectedBarangay,
      //   hasToken: !!token,
      // });

      // console.log('idToken: ', token ? 'Token present' : 'Token missing');

      const response = await axios.post(
        API_ROUTES.DATA.SAVE_BARANGAY_DATA,
        {
          uid: authUser?.uid,
          barangay: selectedBarangay,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      console.log('✅ Backend response:', response.data);

      await storageHelpers.setField(STORAGE_KEYS.USER, 'barangay', selectedBarangay);
      console.log('✅ Barangay saved to local storage');

      console.log('🧭 Navigating to nameAndContactForm...');
      router.push('/auth/nameAndContactForm' as any);
    } catch (error) {
      console.error('❌ Error saving barangay:', error);
      if (axios.isAxiosError(error)) {
        console.error('❌ Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      }
      setErrorMessage('Failed to save barangay. Please try again.');
    }
  };

  return (
    <Body style={styles.body}>
      <View style={styles.welcomeContainer}>
        <Logo width={200} height={100} />
      </View>
      <View style={styles.container}>
        <View style={styles.title}>
          <Text size="sm">Set your Barangay</Text>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>
        <Pressable
          style={[
            styles.dropdownTrigger,
            {
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
              borderColor: isDark ? Colors.border.dark : Colors.border.light,
            },
          ]}
          onPress={() => setModalVisible(true)}
        >
          <Text size="sm">{selectedBarangay || 'Select your barangay'}</Text>
          <ChevronDown size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
        </Pressable>
        <Modal
          isOpen={modalVisible}
          onClose={() => {
            setModalVisible(false);
          }}
          size="lg"
        >
          <ModalBackdrop />
          <ModalContent>
            <ModalHeader>
              <View className="text-typography-950">
                <Text size="lg"> Select your barangay</Text>
              </View>
              <ModalCloseButton>
                <X
                  onPress={() => setModalVisible(false)}
                  size={20}
                  color={isDark ? Colors.icons.dark : Colors.icons.light}
                />
              </ModalCloseButton>
            </ModalHeader>
            <ModalBody>
              <View style={styles.barangayList}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                  {barangays.map((barangay, index) => (
                    <Pressable
                      key={index}
                      style={[
                        styles.barangayItem,
                        {
                          borderBottomColor: isDark ? Colors.border.dark : Colors.border.light,
                        },
                      ]}
                      onPress={() => handleBarangaySelect(barangay)}
                    >
                      <Text size="sm">{barangay.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </ModalBody>
            <ModalFooter style={styles.footer}>
              <ChevronDown size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Text style={styles.description} emphasis="light">
          We collect your barangay information to accurately provide location-based disaster updates, coordinate
          assistance, and ensure the accuracy of information we will provide.
        </Text>
      </View>
      <View style={styles.primaryButton}>
        <PrimaryButton
          onPress={isLoading ? () => {} : handleSaveBarangay}
          style={[isLoading ? { opacity: 0.5 } : null]}
        >
          {isLoading ? 'Loading...' : 'Next'}
        </PrimaryButton>
      </View>
    </Body>
  );
};

export default barangayForm;

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
    gap: 10,
  },
  container: {
    gap: 10,
    marginBottom: 60,
  },
  selectContent: {
    minHeight: 200,
    padding: 10,
  },
  dropdownTrigger: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  barangayList: {
    maxHeight: 500,
  },
  barangayItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    marginTop: 16,
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
});
