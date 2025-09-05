import { Button } from '@/components/components/button/Button';
import { Text } from '@/components/ui/text';
import * as Location from 'expo-location';
import React from "react";
import { StyleSheet, View } from "react-native";

type LocationOption = {
  id: string;
  label: string;
  description?: string;
  coordinates: Location.LocationObjectCoords;
};

type LocationRadioProps = {
  option: LocationOption;
  selectedLocationId: string | null;
  onSelect: (option: LocationOption) => void;
};

export const LocationRadio = ({
  option,
  selectedLocationId,
  onSelect,
}: LocationRadioProps) => {
  const isSelected = selectedLocationId === option.id;

  // Format coordinates for display
  const formatCoordinates = (coords: Location.LocationObjectCoords) => {
    return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
  };

  return (
    <Button
      size='xl'
      justify='start'
      variant={isSelected ? 'outline' : 'link'}
      onPress={() => onSelect(option)}
    >
      <View>
        <Text size='md' style={isSelected ? styles.selectedText : undefined}>
          {option.label}
        </Text>
        <Text size='sm' style={isSelected ? styles.selectedText : styles.subText}>
          {option.description || formatCoordinates(option.coordinates)}
        </Text>
      </View>
    </Button>
  );
};

const styles = StyleSheet.create({
  selectedText: {
    color: '#FFFFFF',
  },
  subText: {
    opacity: 0.7,
  },
});

/*
Usage Examples:

1. Basic location selection:
import { LocationRadio } from '@/components/ui/CustomRadio/LocationRadio';
import * as Location from 'expo-location';

const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

const locationOptions = [
  {
    id: 'bucana-sasahan',
    label: 'Bucana Sasahan',
    description: 'Main residential area',
    coordinates: {
      latitude: 14.2344,
      longitude: 120.1234,
      altitude: null,
      accuracy: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    } as Location.LocationObjectCoords
  },
  {
    id: 'malainem-luma',
    label: 'Malainem Luma',
    // No description provided - will show coordinates
    coordinates: {
      latitude: 14.1234,
      longitude: 120.0987,
      altitude: null,
      accuracy: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    } as Location.LocationObjectCoords
  },
];

const handleLocationSelect = (option: LocationOption) => {
  setSelectedLocationId(option.id);
  // You can also access the coordinates: option.coordinates
  console.log('Selected location:', option.label, option.coordinates);
};

return (
  <View>
    {locationOptions.map((option) => (
      <LocationRadio
        key={option.id}
        option={option}
        selectedLocationId={selectedLocationId}
        onSelect={handleLocationSelect}
      />
    ))}
  </View>
);

2. Integration with map coordinates:
import { useCoords } from '@/contexts/MapContextNew';

const { setCoords } = useCoords();

const handleLocationSelect = (option: LocationOption) => {
  setSelectedLocationId(option.id);
  // Set the coordinates to the map
  setCoords(option.coordinates);
};

3. Pre-selecting a location:
useEffect(() => {
  // Pre-select first location on component mount
  if (locationOptions.length > 0) {
    setSelectedLocationId(locationOptions[0].id);
    setCoords(locationOptions[0].coordinates);
  }
}, []);
*/
