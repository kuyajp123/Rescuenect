import { LocationRadio, ButtonRadio } from '@/components/ui/CustomRadio';
import Body from '@/components/ui/layout/Body';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

export const notification = () => {
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

  return (
      <Body>
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
      </Body>
  )
}

const styles = StyleSheet.create({})

export default notification;