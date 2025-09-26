import { Button } from '@/components/components/button/Button';
import { Text } from '@/components/ui/text';
import React from "react";
import { StyleSheet, View } from "react-native";

type CityNeedsProps = {
    label: string;
    subLabel: [number, number] | string;
    value: [number, number] | string;
    selectedValue: [number, number] | string;
    onSelect: (value: [number, number] | string) => void;
    style?: object;
    sizeText?: 'sm' | 'md' | 'lg';
};

export const ButtonRadio = ({
    label,
    subLabel,
    value,
    selectedValue,
    onSelect,
    style,
    sizeText = 'md',
}: CityNeedsProps) => {
    // Custom comparison for different value types
    const isSelected = () => {
        if (typeof value === 'string' && typeof selectedValue === 'string') {
            return selectedValue === value;
        }
        if (Array.isArray(value) && Array.isArray(selectedValue)) {
            return value[0] === selectedValue[0] && value[1] === selectedValue[1];
        }
        return false;
    };

    // Format display text for different types
    const formatSubLabel = (subLabel: [number, number] | string) => {
        if (typeof subLabel === 'string') {
            return subLabel;
        }
        if (Array.isArray(subLabel)) {
            return `${subLabel[1].toFixed(4)}, ${subLabel[0].toFixed(4)}`; // lat, lng (subLabel = [lng, lat])
        }
        return '';
    };

    const selected = isSelected();

    let sizeLabel: "sm" | "md" | "lg" | "xs" | "xl" | "2xs" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
    let sizeSubLabel: "sm" | "md" | "lg" | "xs" | "xl" | "2xs" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";

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
        <Button
            size='xl'
            justify='start'
            variant={selected ? 'outline' : 'link'}
            onPress={() => onSelect(value)}
            style={style}
        >
        <View>
            <Text size={sizeLabel} style={selected ? styles.TextColor : undefined}>{label}</Text>
            <Text size={sizeSubLabel} style={selected ? styles.TextColor : undefined}>{formatSubLabel(subLabel)}</Text>
        </View>
    </Button>
  )
}

const styles = StyleSheet.create({
  TextColor: {
    color: '#FFFFFF',
  }
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