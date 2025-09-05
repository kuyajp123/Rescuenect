import { Button } from '@/components/components/button/Button';
import { Text } from '@/components/ui/text';
import * as Location from 'expo-location';
import React from "react";
import { StyleSheet, View } from "react-native";

type CityNeedsProps = {
    label: string;
    subLabel: [number, number] | string | Location.LocationObjectCoords;
    value: [number, number] | string | Location.LocationObjectCoords;
    selectedValue: [number, number] | string | Location.LocationObjectCoords;
    onSelect: (value: [number, number] | string | Location.LocationObjectCoords) => void;
};

export const ButtonRadio = ({
    label,
    subLabel,
    value,
    selectedValue,
    onSelect,
}: CityNeedsProps) => {
    // Custom comparison for different value types
    const isSelected = () => {
        if (typeof value === 'string' && typeof selectedValue === 'string') {
            return selectedValue === value;
        }
        if (Array.isArray(value) && Array.isArray(selectedValue)) {
            return value[0] === selectedValue[0] && value[1] === selectedValue[1];
        }
        if (typeof value === 'object' && value !== null && 
            typeof selectedValue === 'object' && selectedValue !== null &&
            'latitude' in value && 'longitude' in value &&
            'latitude' in selectedValue && 'longitude' in selectedValue) {
            return value.latitude === selectedValue.latitude && 
                   value.longitude === selectedValue.longitude;
        }
        return false;
    };

    // Format display text for different types
    const formatSubLabel = (subLabel: [number, number] | string | Location.LocationObjectCoords) => {
        if (typeof subLabel === 'string') {
            return subLabel;
        }
        if (Array.isArray(subLabel)) {
            return `${subLabel[1].toFixed(4)}, ${subLabel[0].toFixed(4)}`; // lat, lng
        }
        if (typeof subLabel === 'object' && subLabel !== null && 'latitude' in subLabel) {
            return `${subLabel.latitude.toFixed(4)}, ${subLabel.longitude.toFixed(4)}`;
        }
        return '';
    };

    const selected = isSelected();

    return (
        <Button
            size='xl'
            justify='start'
            variant={selected ? 'outline' : 'link'}
            onPress={() => onSelect(value)}
        >
        <View>
            <Text size='md' style={selected ? styles.TextColor : undefined}>{label}</Text>
            <Text size='sm' style={selected ? styles.TextColor : undefined}>{formatSubLabel(subLabel)}</Text>
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

 const handleSelect = (value: string | Location.LocationObjectCoords | [number, number]) => {
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
    onSelect={setSelectedCoords}
  />
))}

3. LocationObjectCoords:
import * as Location from 'expo-location';

const [selectedLocation, setSelectedLocation] = useState<Location.LocationObjectCoords | null>(null);
const locationOptions = [
  { 
    label: 'Bucana Sasahan', 
    subLabel: { latitude: 14.2344, longitude: 120.1234, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null } as Location.LocationObjectCoords,
    value: { latitude: 14.2344, longitude: 120.1234, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null } as Location.LocationObjectCoords
  },
  { 
    label: 'Malainem Luma', 
    subLabel: 'Main commercial area', // Can also use string description
    value: { latitude: 14.1234, longitude: 120.0987, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null } as Location.LocationObjectCoords
  },
];

{locationOptions.map((option, index) => (
  <ButtonRadio
    key={index}
    label={option.label}
    subLabel={option.subLabel}
    value={option.value}
    selectedValue={selectedLocation}
    onSelect={setSelectedLocation}
  />
))}
*/