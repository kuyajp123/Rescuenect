import { IconButton } from '@/components/components/button/Button';
import { formatBarangayLabel, formatContactNumber, sortByLabel } from '@/helper/commonHelpers';
import { storageHelpers } from '@/helper/storage';
import { useAuth } from '@/store/useAuth';
import { useUserData } from '@/store/useBackendResponse';
import { Avatar, AvatarFallbackText, AvatarImage } from '@/components/ui/avatar';
import CustomAlertDialog from '@/components/ui/CustomAlertDialog';
import { Divider } from '@/components/ui/divider';
import { HStack } from '@/components/ui/hstack';
import Body from '@/components/ui/layout/Body';
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalHeader } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { API_ROUTES } from '@/config/endpoints';
import { Colors } from '@/constants/Colors';
import { barangays } from '@/constants/variables';
import { useTheme } from '@/contexts/ThemeContext';
import { auth } from '@/lib/firebaseConfig';
import axios from 'axios';
import { Calendar, ChevronDown, Mail, MapPin, Phone, Trash2, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

// Moved InfoItem outside to prevent re-renders losing focus
const InfoItem = ({
  icon,
  label,
  value,
  fieldKey,
  isFirst = false,
  isLast = false,
  editable = false,
  isEditing,
  isDark,
  formData,
  onPressBarangay,
  onChangeText,
  barangayLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  fieldKey?: keyof typeof formData;
  isFirst?: boolean;
  isLast?: boolean;
  editable?: boolean;
  isEditing: boolean;
  isDark: boolean;
  formData: any;
  onPressBarangay: () => void;
  onChangeText: (text: string) => void;
  barangayLabel?: string;
}) => (
  <View
    style={[
      styles.infoItemContainer,
      {
        backgroundColor: isDark ? Colors.background.dark : 'white',
        borderTopLeftRadius: isFirst ? 16 : 0,
        borderTopRightRadius: isFirst ? 16 : 0,
        borderBottomLeftRadius: isLast ? 16 : 0,
        borderBottomRightRadius: isLast ? 16 : 0,
        borderColor: isDark ? Colors.border.dark : Colors.border.light,
        borderBottomWidth: isLast ? 1 : 0,
        borderTopWidth: isFirst ? 1 : 0,
        borderLeftWidth: 1,
        borderRightWidth: 1,
      },
    ]}
  >
    <HStack className="items-center justify-between w-full py-4 px-4">
      <HStack className="items-center gap-4 flex-1">
        <View
          style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
        >
          {icon}
        </View>
        <VStack style={{ flex: 1 }}>
          <Text size="xs" emphasis="light" style={{ marginBottom: 2 }}>
            {label}
          </Text>
          {isEditing && editable && fieldKey ? (
            fieldKey === 'barangay' ? (
              <Pressable onPress={onPressBarangay}>
                <HStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text size="md" bold style={{ borderBottomColor: isDark ? Colors.brand.dark : Colors.brand.light }}>
                    {barangayLabel || formData.barangay || 'Select Barangay'}
                  </Text>
                  <ChevronDown size={16} color={isDark ? Colors.text.dark : Colors.text.light} />
                </HStack>
              </Pressable>
            ) : (
              <TextInput
                value={formData[fieldKey]}
                onChangeText={onChangeText} // Use the passed handler
                keyboardType={fieldKey === 'phoneNumber' ? 'numeric' : 'default'}
                style={{
                  color: isDark ? Colors.text.dark : Colors.text.light,
                  fontSize: 16,
                  fontWeight: 'bold',
                  padding: 0,
                  margin: 0,
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? Colors.brand.dark : Colors.brand.light,
                }}
              />
            )
          ) : (
            <Text size="md" bold numberOfLines={1}>
              {value || 'Not provided'}
            </Text>
          )}
        </VStack>
      </HStack>
    </HStack>
    {!isLast && (
      <Divider className="ml-16" style={{ backgroundColor: isDark ? Colors.border.dark : Colors.border.light }} />
    )}
  </View>
);

const ProfileDetails = () => {
  const { isDark } = useTheme();
  const userData = useUserData(state => state.userData);
  const setUserData = useUserData(state => state.setUserData);
  const authUser = useAuth(state => state.authUser);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Alert State
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    firstName: userData.firstName,
    lastName: userData.lastName,
    phoneNumber: userData.phoneNumber,
    barangay: userData.barangay,
  });
  const sortedBarangays = useMemo(() => sortByLabel(barangays), []);
  const selectedBarangayLabel = useMemo(() => {
    if (!formData.barangay) {
      return '';
    }
    const match = sortedBarangays.find(item => item.value === formData.barangay);
    return match?.label ?? formatBarangayLabel(formData.barangay);
  }, [formData.barangay, sortedBarangays]);

  // Format date
  const formatDate = (dateString?: string | number) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const idToken = await authUser?.getIdToken();
      if (!idToken || !authUser?.uid) throw new Error('Not authenticated');

      // 1. Save User Info (Name, Phone)
      await axios.post(
        API_ROUTES.DATA.SAVE_USER_DATA,
        {
          uid: authUser.uid,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          e164PhoneNumber: formData.phoneNumber, // Assuming same format for now
        },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      await axios.post(
        API_ROUTES.DATA.SAVE_BARANGAY_DATA,
        {
          uid: authUser.uid,
          barangay: formData.barangay,
        },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      // 3. Update Local Store
      setUserData({
        userData: {
          ...userData,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          barangay: formData.barangay,
        },
      });

      // 4. Update AsyncStorage
      await storageHelpers.setField(STORAGE_KEYS.USER, 'firstName', formData.firstName);
      await storageHelpers.setField(STORAGE_KEYS.USER, 'lastName', formData.lastName);
      await storageHelpers.setField(STORAGE_KEYS.USER, 'phoneNumber', formData.phoneNumber);
      await storageHelpers.setField(STORAGE_KEYS.USER, 'barangay', formData.barangay);

      setIsEditing(false);

      // Show Custom Alert
      setAlertMessage('Profile updated successfully');
      setShowAlertDialog(true);

      // Auto close after 2 seconds
      setTimeout(() => {
        setShowAlertDialog(false);
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Are you sure you want to delete your account? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsLoading(true);
          try {
            const idToken = await authUser?.getIdToken();
            if (authUser?.uid) {
              // Call backend delete
              await axios.delete(API_ROUTES.DATA.DELETE_USER, {
                data: { uid: authUser.uid },
                headers: { Authorization: `Bearer ${idToken}` },
              });
            }

            // Cleanup local data
            await storageHelpers.clearAll();
            await auth.signOut();

            // Router will handle auth state change potentially, but let's encourage it
            // No need to manual push if auth listener handles it, but just in case
          } catch (error) {
            console.error('Error deleting account:', error);
            Alert.alert('Error', 'Failed to delete account. Please try again.');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <Body style={{ padding: 0 }}>
      {/* Header Actions */}
      <View style={styles.topActions}>
        <IconButton
          onPress={() => {
            if (isEditing) {
              // Cancel
              setFormData({
                firstName: userData.firstName,
                lastName: userData.lastName,
                phoneNumber: userData.phoneNumber,
                barangay: userData.barangay,
              });
              setIsEditing(false);
            } else {
              setIsEditing(true);
            }
          }}
        >
          <Text size="md" style={{ color: isDark ? Colors.text.dark : Colors.text.light }}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Text>
        </IconButton>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Avatar size="2xl" className="border-4 border-white shadow-sm">
              <AvatarFallbackText>
                {formData.firstName} {formData.lastName}
              </AvatarFallbackText>
              <AvatarImage
                source={{
                  uri:
                    auth.currentUser?.photoURL ||
                    'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
                }}
              />
            </Avatar>
          </View>

          {isEditing ? (
            <HStack space="md" style={{ marginBottom: 10 }}>
              <TextInput
                value={formData.firstName}
                onChangeText={text => setFormData({ ...formData, firstName: text })}
                placeholder="First Name"
                placeholderTextColor={isDark ? Colors.text.dark : Colors.text.light}
                style={[
                  styles.nameInput,
                  {
                    color: isDark ? Colors.text.dark : Colors.text.light,
                    borderColor: isDark ? Colors.border.dark : Colors.border.light,
                  },
                ]}
              />
              <TextInput
                value={formData.lastName}
                onChangeText={text => setFormData({ ...formData, lastName: text })}
                placeholder="Last Name"
                placeholderTextColor={isDark ? Colors.text.dark : Colors.text.light}
                style={[
                  styles.nameInput,
                  {
                    color: isDark ? Colors.text.dark : Colors.text.light,
                    borderColor: isDark ? Colors.border.dark : Colors.border.light,
                  },
                ]}
              />
            </HStack>
          ) : (
            <View style={styles.nameContainer}>
              <Text size="3xl" bold style={{ textAlign: 'center' }}>
                {userData.firstName} {userData.lastName}
              </Text>
              <Text size="sm" emphasis="light" style={{ textAlign: 'center', marginTop: 4 }}>
                {auth.currentUser?.email}
              </Text>
            </View>
          )}

          {isEditing && (
            <Pressable
              onPress={handleSave}
              disabled={isLoading}
              style={[styles.saveButton, { backgroundColor: isDark ? Colors.brand.dark : Colors.brand.light, opacity: isLoading ? 0.7 : 1 }]}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text size='sm' style={{ color: 'white', fontWeight: 'bold' }}>Save Changes</Text>
              )}
            </Pressable>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text size="sm" bold style={{ marginBottom: 12, marginLeft: 4, opacity: 0.5 }}>
            CONTACT INFORMATION
          </Text>
          <InfoItem
            isFirst
            icon={<Mail size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />}
            label="Email Address"
            value={auth.currentUser?.email || ''}
            editable={false} // Email not editable
            isEditing={isEditing}
            isDark={isDark}
            formData={formData}
            onPressBarangay={() => {}}
            onChangeText={() => {}}
          />
          <InfoItem
            isLast
            icon={<Phone size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />}
            label="Phone Number"
            value={formData.phoneNumber}
            fieldKey="phoneNumber"
            editable={true}
            isEditing={isEditing}
            isDark={isDark}
            formData={formData}
            onPressBarangay={() => {}}
            onChangeText={text => setFormData({ ...formData, phoneNumber: formatContactNumber(text) })}
          />
        </View>

        <View style={styles.section}>
          <Text size="sm" bold style={{ marginBottom: 12, marginLeft: 4, opacity: 0.5 }}>
            LOCATION & MEMBERSHIP
          </Text>
          <InfoItem
            isFirst
            icon={<MapPin size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />}
            label="Barangay"
            value={selectedBarangayLabel || formData.barangay}
            fieldKey="barangay"
            editable={true}
            isEditing={isEditing}
            isDark={isDark}
            formData={formData}
            onPressBarangay={() => setModalVisible(true)}
            onChangeText={() => {}} // Not used for barangay since it's a modal
            barangayLabel={selectedBarangayLabel}
          />
          <InfoItem
            isLast
            icon={<Calendar size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />}
            label="Member Since"
            value={formatDate(authUser?.metadata.creationTime)}
            editable={false}
            isEditing={isEditing}
            isDark={isDark}
            formData={formData}
            onPressBarangay={() => {}}
            onChangeText={() => {}}
          />
        </View>

        {/* Delete Account Button */}
        <Pressable onPress={handleDeleteAccount} style={styles.deleteButton}>
          <Trash2 size={16} color={Colors.semantic.error} style={{ marginRight: 8 }} />
          <Text size="sm" style={{ color: Colors.semantic.error }}>
            Delete Account
          </Text>
        </Pressable>
      </ScrollView>

      {/* Barangay Selection Modal */}
      <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)} size="lg">
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
                {sortedBarangays.map(barangay => (
                  <Pressable
                    key={barangay.value}
                    style={[
                      styles.barangayItem,
                      {
                        borderBottomColor: isDark ? Colors.border.dark : Colors.border.light,
                        backgroundColor:
                          formData.barangay === barangay.value
                            ? isDark
                              ? 'rgba(255,255,255,0.1)'
                              : 'rgba(0,0,0,0.05)'
                            : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, barangay: barangay.value });
                      setModalVisible(false);
                    }}
                  >
                    <Text size="sm" bold={formData.barangay === barangay.value}>
                      {barangay.label}
                    </Text>
                    {formData.barangay === barangay.value && (
                      <ChevronDown
                        size={16}
                        color={isDark ? Colors.icons.dark : Colors.icons.light}
                        style={{ transform: [{ rotate: '-90deg' }] }}
                      />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Custom Alert Dialog */}
      <CustomAlertDialog
        showAlertDialog={showAlertDialog}
        handleClose={() => setShowAlertDialog(false)}
        text={alertMessage}
      />
    </Body>
  );
};

export default ProfileDetails;

const styles = StyleSheet.create({
  topActions: {
    flexDirection: 'row',
    marginLeft: 'auto',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  nameContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  infoItemContainer: {
    overflow: 'hidden',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 20,
    marginTop: 10,
  },
  nameInput: {
    borderBottomWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    minWidth: 120,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 20,
    opacity: 0.7,
  },
  barangayList: {
    maxHeight: 500,
  },
  barangayItem: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
