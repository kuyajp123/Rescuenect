
import React from 'react';
import { View } from 'react-native';

export const Progress = ({ value, className, ...props }: any) => {
  return (
    <View className={`h-2 bg-gray-200 rounded-full overflow-hidden ${className || ''}`} {...props}>
      <View className="h-full bg-blue-500" style={{ width: `${value || 0}%` }} />
    </View>
  );
};
export const ProgressFilledTrack: React.FC<any> = (props: any) => null;
