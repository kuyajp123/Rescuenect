import { StyleSheet, View } from 'react-native';
import React, { useEffect } from 'react';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { ToggleButton } from '@/components/components/button/Button';
import { useStatusFormStore } from '@/components/store/useStatusForm';
import { CustomRadio } from '@/components/ui/CustomRadio';
import NavigationButton from '@/components/components/button/NavigationButton';

const statusSettings = () => {
  const formData = useStatusFormStore(state => state.formData);
  const setFormData = useStatusFormStore(state => state.setFormData);
  const options = [
    { key: '24 hours', value: 24 },
    { key: '12 hours', value: 12 },
  ];
  const [selectedDuration, setSelectedDuration] = React.useState<string | number>(options[0].value);

  // Sync selectedDuration with formData when it exists
  useEffect(() => {
    if (formData?.expirationDuration) {
      setSelectedDuration(formData.expirationDuration);
      console.log('Expiration Duration from formData:', formData.expirationDuration);
    }
  }, [formData?.expirationDuration]);

  const handleDurationSelect = (value: string | number) => {
    const duration = value as 12 | 24;
    setSelectedDuration(duration);

    // Update formData - the store will handle merging properly
    if (formData) {
      // Update existing formData
      setFormData({
        ...formData,
        expirationDuration: duration,
      });
    }
    // Note: Don't create new formData here - let the main form handle initial creation
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
          iconRight={<ToggleButton isEnabled={formData?.shareLocation ?? true} onToggle={() => {}} />}
          onPress={() => {}}
        />
        <NavigationButton
          label="Share my location"
          description="Enable to share your contact number with the community"
          iconRight={<ToggleButton isEnabled={formData?.shareLocation ?? true} onToggle={() => {}} />}
          onPress={() => {}}
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
});
