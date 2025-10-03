import { StyleSheet, View } from 'react-native';
import React from 'react';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { ToggleButton } from '@/components/components/button/Button';
import { useStatusFormStore } from '@/components/store/useStatusForm';
import { CustomRadio } from '@/components/ui/CustomRadio';
import NavigationButton from '@/components/components/button/NavigationButton';

const statusSettings = () => {
  const formData = useStatusFormStore(state => state.formData);
  const [selected, setSelected] = React.useState<string>('24 hours');
  const options = ['24 hours', '12 hours'];

  const timeFormat = () => {
    switch (formData?.expirationDuration) {
      case 24:
        return '24 hours';
      case 12:
        return '12 hours';
      default:
        return undefined;
    }
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
          {options.map(option => (
            <CustomRadio
              style={styles.radioGroup}
              key={option}
              label={option}
              value={option}
              selectedValue={timeFormat() ?? selected}
              onSelect={value => setSelected(value as string)}
              labelSize="sm"
            />
          ))}
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
