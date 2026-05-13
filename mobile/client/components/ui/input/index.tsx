import { Input as HeroInput } from 'heroui-native';
import React from 'react';

export const Input = ({ children, variant, size, className, ...props }: any) => {
  let inputFieldProps: any = {};
  React.Children.forEach(children, child => {
    if (React.isValidElement(child) && child.type === InputField) {
      inputFieldProps = child.props;
    }
  });
  return <HeroInput variant="default" {...props} {...inputFieldProps} className={className} />;
};

export const InputField = (
  props: import('react-native').TextInputProps & { style?: any; value?: string; placeholder?: string }
) => null;
export const InputSlot = (props: any) => null;
export const InputIcon = ({ as: As, ...props }: any) => (As ? <As {...props} /> : null);
