import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

/**
 * Color Verification Component
 * Use this to test that all button colors are working correctly with Tailwind
 */
export const ColorVerification = () => {
  const { isDark } = useTheme();

  return (
    <View className="p-4">
      <Text className="text-lg font-bold mb-4">
        Color Verification ({isDark ? 'Dark' : 'Light'} Mode)
      </Text>

      {/* Primary Buttons */}
      <Text className="text-md font-semibold mb-2">Primary Buttons:</Text>
      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity className="bg-button-primary-default px-3 py-2 rounded">
          <Text className="text-button-text-on-primary text-xs">Default</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-primary-hover px-3 py-2 rounded">
          <Text className="text-button-text-on-primary text-xs">Hover</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-primary-pressed px-3 py-2 rounded">
          <Text className="text-button-text-on-primary text-xs">Pressed</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-primary-disabled px-3 py-2 rounded">
          <Text className="text-button-text-on-disabled text-xs">Disabled</Text>
        </TouchableOpacity>
      </View>

      {/* Primary Dark Buttons */}
      <Text className="text-md font-semibold mb-2">Primary Dark Buttons:</Text>
      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity className="bg-button-primary-dark-default px-3 py-2 rounded">
          <Text className="text-button-text-on-primary text-xs">Default</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-primary-dark-hover px-3 py-2 rounded">
          <Text className="text-button-text-on-primary text-xs">Hover</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-primary-dark-pressed px-3 py-2 rounded">
          <Text className="text-button-text-on-primary text-xs">Pressed</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-primary-dark-disabled px-3 py-2 rounded">
          <Text className="text-button-text-on-disabled text-xs">Disabled</Text>
        </TouchableOpacity>
      </View>

      {/* Secondary Buttons */}
      <Text className="text-md font-semibold mb-2">Secondary Buttons:</Text>
      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity className="bg-button-secondary-default px-3 py-2 rounded">
          <Text className="text-button-text-on-secondary text-xs">Default</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-secondary-hover px-3 py-2 rounded">
          <Text className="text-button-text-on-secondary text-xs">Hover</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-secondary-pressed px-3 py-2 rounded">
          <Text className="text-button-text-on-primary text-xs">Pressed</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-secondary-disabled px-3 py-2 rounded">
          <Text className="text-button-text-on-secondary text-xs">Disabled</Text>
        </TouchableOpacity>
      </View>

      {/* Success Buttons */}
      <Text className="text-md font-semibold mb-2">Success Buttons:</Text>
      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity className="bg-button-success-default px-3 py-2 rounded">
          <Text className="text-button-text-on-primary text-xs">Default</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-success-hover px-3 py-2 rounded">
          <Text className="text-button-text-on-primary text-xs">Hover</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-success-pressed px-3 py-2 rounded">
          <Text className="text-button-text-on-primary text-xs">Pressed</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-success-disabled px-3 py-2 rounded">
          <Text className="text-button-text-on-disabled text-xs">Disabled</Text>
        </TouchableOpacity>
      </View>

      {/* Error Buttons */}
      <Text className="text-md font-semibold mb-2">Error Buttons:</Text>
      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity className="bg-button-error-default px-3 py-2 rounded">
          <Text className="text-button-text-on-primary text-xs">Default</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-error-hover px-3 py-2 rounded">
          <Text className="text-button-text-on-primary text-xs">Hover</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-error-pressed px-3 py-2 rounded">
          <Text className="text-button-text-on-primary text-xs">Pressed</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-error-disabled px-3 py-2 rounded">
          <Text className="text-button-text-on-disabled text-xs">Disabled</Text>
        </TouchableOpacity>
      </View>

      {/* Warning Buttons */}
      <Text className="text-md font-semibold mb-2">Warning Buttons:</Text>
      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity className="bg-button-warning-default px-3 py-2 rounded">
          <Text className="text-button-text-on-primary text-xs">Default</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-warning-hover px-3 py-2 rounded">
          <Text className="text-button-text-on-primary text-xs">Hover</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-warning-pressed px-3 py-2 rounded">
          <Text className="text-button-text-on-primary text-xs">Pressed</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-button-warning-disabled px-3 py-2 rounded">
          <Text className="text-button-text-on-disabled text-xs">Disabled</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ColorVerification;
