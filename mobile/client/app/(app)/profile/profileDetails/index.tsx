import { IconButton } from '@/components/components/button/Button';
import Dialog from '@/components/ui/Dialog';
import { Divider } from '@/components/ui/divider';
import { HStack } from '@/components/ui/hstack';
import { Body } from '@/components/ui/layout/Body';
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalHeader } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { useAppToast } from '@/components/ui/Toast';
import { VStack } from '@/components/ui/vstack';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { API_ROUTES } from '@/config/endpoints';
import {
  toResidentLocationSelectionFromCoverageClient,
  type BarangayOption,
  type LocationCoverageClient,
  type LocationCoverageResponse,
} from '@/config/locationConfig';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { formatBarangayLabel, formatContactNumber, sortByLabel } from '@/helper/commonHelpers';
import { storageHelpers } from '@/helper/storage';
import { auth } from '@/lib/firebaseConfig';
import { navigateToSignIn } from '@/routes/route';
import { useAuth } from '@/store/useAuth';
import { useUserData } from '@/store/useBackendResponse';
import { useCoords } from '@/store/useCoords';
import { useImagePickerStore } from '@/store/useImagePicker';
import { useSavedLocationsStore } from '@/store/useSavedLocationsStore';
import { useStatusFormStore } from '@/store/useStatusForm';
import axios from 'axios';
import { Avatar } from 'heroui-native';
import { Calendar, ChevronDown, Mail, MapPin, Phone, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';

const DELETE_CONFIRMATION_TEXT = 'Confirm';

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
  const { width: windowWidth } = useWindowDimensions();
  const userData = useUserData(state => state.userData);
  const setUserData = useUserData(state => state.setUserData);
  const authUser = useAuth(state => state.authUser);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [coverageClient, setCoverageClient] = useState<LocationCoverageClient | undefined>(undefined);
  const [barangayOptions, setBarangayOptions] = useState<BarangayOption[]>([]);
  const { showDanger, showSuccess } = useAppToast();

  // Form State
  const [formData, setFormData] = useState({
    firstName: userData.firstName,
    lastName: userData.lastName,
    phoneNumber: userData.phoneNumber,
    barangay: userData.barangay,
  });
  useEffect(() => {
    let isMounted = true;

    const loadCoverage = async () => {
      if (!userData.clientId) {
        setCoverageClient(undefined);
        setBarangayOptions([]);
        return;
      }

      try {
        const response = await axios.get<LocationCoverageResponse>(API_ROUTES.DATA.GET_LOCATION_COVERAGE, {
          timeout: 10000,
        });
        const client = response.data.provinces
          .flatMap(province => province.clients)
          .find(item => item.clientId === userData.clientId);

        if (!isMounted) return;
        setCoverageClient(client);
        setBarangayOptions(
          (client?.barangays ?? []).map(barangay => ({
            label: barangay.barangayLabel,
            value: barangay.value,
          }))
        );
      } catch (error) {
        console.warn('Unable to load resident location coverage:', error);
        if (!isMounted) return;
        setCoverageClient(undefined);
        setBarangayOptions([]);
      }
    };

    void loadCoverage();

    return () => {
      isMounted = false;
    };
  }, [userData.clientId]);

  const sortedBarangays = useMemo(() => sortByLabel(barangayOptions), [barangayOptions]);
  const selectedBarangayLabel = useMemo(() => {
    if (!formData.barangay) {
      return '';
    }
    const match = sortedBarangays.find(item => item.value === formData.barangay);
    return match?.label ?? formatBarangayLabel(formData.barangay);
  }, [formData.barangay, sortedBarangays]);
  const selectedLocation = useMemo(
    () => toResidentLocationSelectionFromCoverageClient(coverageClient, formData.barangay),
    [coverageClient, formData.barangay]
  );
  const isDeleteConfirmationValid = deleteConfirmationText.trim() === DELETE_CONFIRMATION_TEXT;
  const deleteDialogWidth = Math.min(360, Math.max(260, windowWidth - 40));

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
      if (!selectedLocation) throw new Error('Selected barangay is not covered');

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
          ...selectedLocation,
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
          ...selectedLocation,
        },
      });

      // 4. Update AsyncStorage
      const currentUserData = await storageHelpers.getData<Record<string, unknown>>(STORAGE_KEYS.USER);
      await storageHelpers.setData(STORAGE_KEYS.USER, {
        ...(currentUserData && typeof currentUserData === 'object' ? currentUserData : {}),
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        ...selectedLocation,
      });

      setIsEditing(false);

      showSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      showDanger('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = () => {
    setDeleteConfirmationText('');
    setDeleteDialogVisible(true);
  };

  const closeDeleteDialog = () => {
    if (isDeletingAccount) return;
    setDeleteDialogVisible(false);
    setDeleteConfirmationText('');
  };

  const handleDeleteAccount = async () => {
    if (!isDeleteConfirmationValid || isDeletingAccount) return;

    setIsDeletingAccount(true);
    try {
      const idToken = await authUser?.getIdToken();
      if (authUser?.uid) {
        // Call backend delete
        await axios.delete(API_ROUTES.DATA.DELETE_USER, {
          data: { uid: authUser.uid },
          headers: { Authorization: `Bearer ${idToken}` },
        });
      }

      // Cleanup local persisted and in-memory session data.
      useStatusFormStore.getState().resetFormData();
      useCoords.getState().resetState?.();
      useSavedLocationsStore.getState().clearLocations();
      useImagePickerStore.getState().setImage(null);
      useUserData.getState().resetResponse();

      await storageHelpers.clearAll();
      await storageHelpers.setField(STORAGE_KEYS.APP_STATE, 'hasSignedOut', true);
      await storageHelpers.setField(STORAGE_KEYS.APP_STATE, 'isGuestMode', false);

      useAuth.getState().setAuthUser(null);
      useAuth.getState().setHasSignedOut(true);
      useAuth.getState().setGuest(false);
      useAuth.getState().setGuestIntent(false);
      useAuth.getState().setShowingSetupComplete(false);

      try {
        await auth.signOut();
      } catch (signOutError) {
        console.warn('Firebase sign out after account deletion failed:', signOutError);
      }

      console.log('Account deleted successfully');
      navigateToSignIn();
    } catch (error) {
      console.error('Error deleting account:', error);
      showDanger('Failed to delete account. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
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
            <Avatar size="lg" className="border-4 h-25 w-25 border-white shadow-sm" alt="Profile avatar">
              <Avatar.Fallback color="default">
                {userData.firstName?.charAt(0)}
                {userData.lastName?.charAt(0)}
              </Avatar.Fallback>
              <Avatar.Image
                source={{
                  uri: auth.currentUser?.photoURL || undefined,
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
              style={[
                styles.saveButton,
                { backgroundColor: isDark ? Colors.brand.dark : Colors.brand.light, opacity: isLoading ? 0.7 : 1 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text size="sm" style={{ color: 'white', fontWeight: 'bold' }}>
                  Save Changes
                </Text>
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
        <Pressable
          onPress={openDeleteDialog}
          disabled={isLoading || isDeletingAccount}
          style={[styles.deleteButton, (isLoading || isDeletingAccount) && styles.disabledDeleteButton]}
        >
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

      <Dialog
        modalVisible={deleteDialogVisible}
        onClose={closeDeleteDialog}
        size="md"
        portalStyle={styles.deleteDialogPortal}
        contentStyle={[styles.deleteDialogSurface, { width: deleteDialogWidth, maxWidth: deleteDialogWidth }]}
        headerTitle="Delete account"
        iconOnPress={closeDeleteDialog}
        closeOnOverlayPress={!isDeletingAccount}
        primaryButtonText={isDeletingAccount ? 'Deleting...' : 'Delete account'}
        primaryButtonVariant="danger"
        primaryButtonOnPress={handleDeleteAccount}
        primaryButtonDisabled={!isDeleteConfirmationValid || isDeletingAccount}
        secondaryButtonText="Cancel"
        secondaryButtonOnPress={closeDeleteDialog}
        secondaryButtonDisabled={isDeletingAccount}
      >
        <View style={styles.deleteDialogContent}>
          <Text size="sm" style={styles.deleteDialogMessage}>
            Your resident profile will be removed from the app. Emergency status records may still be retained for admin
            audit and traceability.
          </Text>
          <Text size="sm" bold style={styles.deleteDialogPrompt}>
            Type Confirm to continue.
          </Text>
          <TextInput
            value={deleteConfirmationText}
            onChangeText={setDeleteConfirmationText}
            editable={!isDeletingAccount}
            autoCapitalize="words"
            autoCorrect={false}
            placeholder={DELETE_CONFIRMATION_TEXT}
            placeholderTextColor={isDark ? Colors.muted.dark.text : Colors.muted.light.text}
            style={[
              styles.deleteConfirmInput,
              {
                color: isDark ? Colors.text.dark : Colors.text.light,
                borderColor: isDeleteConfirmationValid
                  ? Colors.semantic.error
                  : isDark
                    ? Colors.border.dark
                    : Colors.border.light,
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
              },
            ]}
          />
          {deleteConfirmationText.length > 0 && !isDeleteConfirmationValid ? (
            <Text size="xs" style={styles.deleteConfirmHint}>
              Type Confirm exactly to enable deletion.
            </Text>
          ) : null}
        </View>
      </Dialog>
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
  disabledDeleteButton: {
    opacity: 0.35,
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
  deleteDialogContent: {
    gap: 12,
    paddingTop: 4,
  },
  deleteDialogPortal: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  deleteDialogSurface: {
    alignSelf: 'center',
  },
  deleteDialogMessage: {
    lineHeight: 20,
    opacity: 0.86,
  },
  deleteDialogPrompt: {
    marginTop: 4,
  },
  deleteConfirmInput: {
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  deleteConfirmHint: {
    color: Colors.semantic.error,
  },
});
