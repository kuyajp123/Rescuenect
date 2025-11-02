import { ToggleButton } from '@/components/components/button/Button';
import NavigationButton from '@/components/components/button/NavigationButton';
import { storageHelpers } from '@/components/helper/storage';
import { useStatusFormStore } from '@/components/store/useStatusForm';
import CustomAlertDialog from '@/components/ui/CustomAlertDialog';
import { CustomRadio } from '@/components/ui/CustomRadio';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const statusSettings = () => {
  const formData = useStatusFormStore(state => state.formData);
  const scaleValue = useRef(new Animated.Value(0)).current;
  const options = [
    { key: '24 hours', value: 24 },
    { key: '12 hours', value: 12 },
  ];

  const [selectedDuration, setSelectedDuration] = useState<string | number>(options[0].value);
  const [enabledShareLocation, setEnabledShareLocation] = useState(formData?.shareLocation ?? true);
  const [enabledShareContactNumber, setEnabledShareContactNumber] = useState(formData?.shareContact ?? true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const LoadStorage = async () => {
    const expirationDuration = await storageHelpers.getField(
      STORAGE_KEYS.USER_SETTINGS,
      'status_settings.expirationDuration'
    );
    const privacySettings = await storageHelpers.getField(STORAGE_KEYS.USER_SETTINGS, 'status_settings.shareLocation');
    const contactSettings = await storageHelpers.getField(STORAGE_KEYS.USER_SETTINGS, 'status_settings.shareContact');

    const data = { expirationDuration, privacySettings, contactSettings };
    return data;
  };

  // Load settings from storage on mount
  useFocusEffect(
    useCallback(() => {
      LoadStorage().then(data => {
        // Set duration - prefer storage over formData for settings
        const duration = data.expirationDuration;
        setSelectedDuration(duration);

        // Set privacy settings - prefer storage over formData for settings
        const shareLocation = data.privacySettings;
        setEnabledShareLocation(shareLocation);

        // Set contact settings - prefer storage over formData for settings
        const shareContact = data.contactSettings;
        setEnabledShareContactNumber(shareContact);
      });
    }, [])
  );

  // Auto hide after 3 seconds
  useEffect(() => {
    if (showSuccessDialog) {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog]);

  const handleClose = () => {
    // Scale out animation
    Animated.timing(scaleValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccessDialog(false);
    });
  };

  const saveStorage = async (key: string, value: any) => {
    await storageHelpers.setField(STORAGE_KEYS.USER_SETTINGS, key, value);
  };

  const handleDurationSelect = (value: string | number) => {
    const duration = value as 12 | 24;
    setSelectedDuration(duration);
    saveStorage('status_settings.expirationDuration', duration);
  };

  const toggleShareLocation = () => {
    const newValue = !enabledShareLocation;
    setEnabledShareLocation(newValue);
    saveStorage('status_settings.shareLocation', newValue);
  };

  const toggleShareContactNumber = () => {
    const newValue = !enabledShareContactNumber;
    setEnabledShareContactNumber(newValue);
    saveStorage('status_settings.shareContact', newValue);
  };

  return (
    <Body style={styles.bodyContainer}>
      <Text size="3xl" bold style={styles.title}>
        Status Settings
      </Text>
      <View>
        <Text emphasis="light" style={styles.title}>
          Privacy Setting
        </Text>
        <NavigationButton
          label="Share my location"
          description="Enable to share your location with the community"
          iconRight={<ToggleButton isEnabled={enabledShareLocation} onToggle={toggleShareLocation} />}
          onPress={toggleShareLocation}
        />
        <NavigationButton
          label="Share my contact number"
          description="Enable to share your contact number with the community"
          iconRight={<ToggleButton isEnabled={enabledShareContactNumber} onToggle={toggleShareContactNumber} />}
          onPress={toggleShareContactNumber}
        />
      </View>

      <View>
        <Text size="sm" style={[styles.title, { marginTop: 50 }]}>
          Show your status for
        </Text>
        <View style={[styles.buttons, { marginTop: 0 }]}>
          {formData && formData.expirationDuration ? (
            // Show read-only value when formData exists with expirationDuration
            <Text size="sm" style={{ marginTop: 10 }}>
              {formData.expirationDuration} hours
            </Text>
          ) : (
            // Show radio buttons when no formData or no expirationDuration
            options.map(option => (
              <CustomRadio
                style={styles.radioGroup}
                key={option.key}
                label={option.key}
                value={option.value}
                selectedValue={selectedDuration}
                onSelect={handleDurationSelect}
                labelSize="sm"
              />
            ))
          )}
        </View>
      </View>

      {/* Temporary */}
      {/* {conditionalUpdateButtonRender()} */}
      <CustomAlertDialog
        showAlertDialog={showSuccessDialog}
        handleClose={handleClose}
        text="Status submitted successfully!"
      />
    </Body>
  );
};

export default statusSettings;

const styles = StyleSheet.create({
  bodyContainer: {
    paddingHorizontal: 0,
  },
  title: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  description: {
    marginHorizontal: 20,
    width: '80%',
    marginBottom: 10,
  },
  buttons: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '100%',
    marginTop: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
  },
  radioGroup: {
    marginTop: 10,
    width: '100%',
  },
  updateButton: {
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 30,
    width: '100%',
  },
});
