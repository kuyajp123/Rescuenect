
import React from 'react';
import { Skeleton as HeroSkeleton } from 'heroui-native';
import { View } from 'react-native';

export const Skeleton = ({ children, className, ...props }: any) => {
  return <HeroSkeleton className={className} {...props}>{children}</HeroSkeleton>;
};
export const SkeletonText = ({ _lines, className, ...props }: any) => {
  return <HeroSkeleton className={`h-4 w-3/4 ${className || ''}`} {...props} />;
};
