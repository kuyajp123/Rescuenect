import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import React, { memo } from "react";
import { StyleSheet, TouchableOpacity, View } from 'react-native';

// Custom Radio Component - moved outside to prevent re-creation
export const CustomRadio = memo(({ label, value, selectedValue, onSelect, isDark, textValueColor }: {
    label: string;
    value: string;
    selectedValue: string;
    onSelect: (value: string) => void;
    isDark: boolean;
    textValueColor: string;
}) => {
    const isSelected = selectedValue === value;
    const brandColor = isDark ? Colors.brand.dark : Colors.brand.light;
    
    return (
        <TouchableOpacity 
            style={styles.radioOption} 
            onPress={() => onSelect(value)}
            activeOpacity={0.7}
        >
            <View style={[
                styles.radioCircle,
                { borderColor: isSelected ? brandColor : (isDark ? Colors.border.dark : Colors.border.light) }
            ]}>
                {isSelected && (
                    <View style={[
                        styles.radioInner,
                        { backgroundColor: brandColor }
                    ]} />
                )}
            </View>
            <Text style={[
                styles.radioLabel,
                { color: textValueColor }
            ]}>{label}</Text>
        </TouchableOpacity>
    );
});

CustomRadio.displayName = 'CustomRadio';

export default CustomRadio;

const styles = StyleSheet.create({
    radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 12,
    width: '100%',
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '400',
  },
  radioItem: {
    marginBottom: 8,
  },
})