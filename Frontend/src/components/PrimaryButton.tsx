// src/components/PrimaryButton.tsx
import React from "react";
import { Button, ButtonProps } from "@heroui/react";


interface PrimaryButtonProps extends ButtonProps {
  children: React.ReactNode;
}

const PrimaryButton: React.FC<PrimaryButtonProps & ButtonProps> = ({ children, className = "", ...props }) => {
  return (
    <Button
    
      className={`primary rounded text-white dark:text-white" ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
};

export default PrimaryButton;

//Default height in icon: h-5
//Default import in icon: "@heroicons/react/20/solid"; size of 20x20
//props to use in icon: startContent, endContent
//default value in border is "rounded" and the other variant is "rounded-full"
