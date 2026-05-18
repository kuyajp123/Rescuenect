import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type ButtonRadioValue = [number, number] | string;

type ButtonRadioProps = {
  label: string;
  subLabel: ButtonRadioValue;
  value: ButtonRadioValue;
  selectedValue: ButtonRadioValue;
  onSelect: (value: ButtonRadioValue) => void;
  style?: StyleProp<ViewStyle>;
  sizeText?: 'sm' | 'md' | 'lg';
};

const isCoordinateValue = (value: ButtonRadioValue): value is [number, number] => {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number' &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
};

const areValuesEqual = (value: ButtonRadioValue, selectedValue: ButtonRadioValue) => {
  if (typeof value === 'string' && typeof selectedValue === 'string') {
    return selectedValue === value;
  }

  if (isCoordinateValue(value) && isCoordinateValue(selectedValue)) {
    return value[0] === selectedValue[0] && value[1] === selectedValue[1];
  }

  return false;
};

const formatSubLabel = (subLabel: ButtonRadioValue) => {
  if (typeof subLabel === 'string') {
    return subLabel;
  }

  if (isCoordinateValue(subLabel)) {
    return `Lat: ${subLabel[1].toFixed(6)}, Lng: ${subLabel[0].toFixed(6)}`;
  }

  return '';
};

export const ButtonRadio = ({
  label,
  subLabel,
  value,
  selectedValue,
  onSelect,
  style,
  sizeText = 'md',
}: ButtonRadioProps) => {
  const { isDark } = useTheme();
  const selected = areValuesEqual(value, selectedValue);
  const brandColor = isDark ? Colors.brand.dark : Colors.brand.light;
  const borderColor = selected ? brandColor : isDark ? Colors.border.dark : Colors.border.medium;
  const backgroundColor = selected ? (isDark ? 'rgba(59, 130, 246, 0.14)' : 'rgba(14, 165, 233, 0.08)') : 'transparent';
  const mutedTextColor = isDark ? Colors.muted.dark.text : Colors.muted.light.text;
  const displayLabel = label.trim() || 'Selected location';

  let sizeLabel: 'sm' | 'md' | 'lg' | 'xs' | 'xl' | '2xs' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  let sizeSubLabel: 'sm' | 'md' | 'lg' | 'xs' | 'xl' | '2xs' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';

  switch (sizeText) {
    case 'sm':
      sizeLabel = 'sm';
      sizeSubLabel = 'xs';
      break;
    case 'md':
      sizeLabel = 'md';
      sizeSubLabel = 'sm';
      break;
    case 'lg':
      sizeLabel = 'lg';
      sizeSubLabel = 'lg';
      break;
  }

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        if (!selected) {
          onSelect(value);
        }
      }}
      style={({ pressed }) => [
        styles.option,
        {
          borderColor,
          backgroundColor,
        },
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={[styles.radioCircle, { borderColor: selected ? brandColor : borderColor }]}>
        {selected && <View style={[styles.radioInner, { backgroundColor: brandColor }]} />}
      </View>
      <View style={styles.labelContainer}>
        <Text size={sizeLabel} emphasis="medium" numberOfLines={2} style={styles.label}>
          {displayLabel}
        </Text>
        <Text size={sizeSubLabel} numberOfLines={1} style={[styles.subLabel, { color: mutedTextColor }]}>
          {formatSubLabel(subLabel)}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  option: {
    width: '100%',
    minHeight: 72,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pressed: {
    opacity: 0.82,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  labelContainer: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    flexShrink: 1,
  },
  subLabel: {
    marginTop: 2,
  },
});

/*
Usage Examples:

1. String values:
const [selectedValue, setSelectedValue] = useState<string>('option1');
const stringOptions = [
  { label: 'Option 1', subLabel: 'Description 1', value: 'option1' },
  { label: 'Option 2', subLabel: 'Description 2', value: 'option2' },
];

{stringOptions.map((option) => (
  <ButtonRadio
    key={option.value}
    label={option.label}
    subLabel={option.subLabel}
    value={option.value}
    selectedValue={selectedValue}
    onSelect={setSelectedValue}
  />
))}

2. Array coordinates [lng, lat]:
const [selectedCoords, setSelectedCoords] = useState<[number, number]>([0, 0]);
const arrayOptions = [
  { label: 'Bucana Sasahan', subLabel: [120.1234, 14.2344] as [number, number], value: [120.1234, 14.2344] as [number, number] },
  { label: 'Malainem Luma', subLabel: [120.0987, 14.1234] as [number, number], value: [120.0987, 14.1234] as [number, number] },
];

const handleSelect = (value: string | [number, number]) => {
  if (Array.isArray(value) && value.length === 2) {
    setSelectedCoords(value as [number, number]);
  }
};

{arrayOptions.map((option) => (
  <ButtonRadio
    key={option.value.join(',')}
    label={option.label}
    subLabel={option.subLabel}
    value={option.value}
    selectedValue={selectedCoords}
    onSelect={handleSelect}
  />
))}

3. Mixed string and coordinate options:
const [selectedValue, setSelectedValue] = useState<string | [number, number]>('default');
const mixedOptions = [
  { label: 'Current Location', subLabel: 'Use GPS', value: 'current' },
  { label: 'Bucana Sasahan', subLabel: [120.1234, 14.2344] as [number, number], value: [120.1234, 14.2344] as [number, number] },
  { label: 'Custom Location', subLabel: 'Tap on map', value: 'custom' },
];

const handleMixedSelect = (value: string | [number, number]) => {
  setSelectedValue(value);
  if (Array.isArray(value)) {
    // Handle coordinate selection
    console.log('Selected coordinates:', value);
  } else {
    // Handle string selection
    console.log('Selected option:', value);
  }
};
*/
