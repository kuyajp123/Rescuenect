
import React from 'react';
import { Avatar as HeroAvatar } from 'heroui-native';

export const Avatar = ({ children, size, className, ...props }: any) => {
  let imageProps: any = {};
  let fallbackProps: any = {};
  React.Children.forEach(children, child => {
    if (React.isValidElement(child)) {
      if (child.type === AvatarImage) imageProps = child.props;
      if (child.type === AvatarFallbackText) fallbackProps = child.props;
    }
  });
  return <HeroAvatar source={imageProps.source} fallbackText={fallbackProps.children} className={className} {...props} />;
};
export const AvatarImage: React.FC<any> = (props: any) => null;
export const AvatarFallbackText: React.FC<any> = (props: any) => null;
export const AvatarGroup = ({ children, className, ...props }: any) => <>{children}</>;
export const AvatarBadge = () => null;
