import React from "react";
import { Button, ButtonProps } from "@heroui/react";

interface PrimaryButtonProps extends ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
}

export const SecondaryButton: React.FC<PrimaryButtonProps & ButtonProps> = ({ children, className = "", ...props }) => {
  
  return (
    <Button
      className={`rounded border-default-600 dark:border-default-400 
        ${className}`
      }
      {...props}
      variant="bordered"
      style={{ borderWidth: "1px" }}
    >
      {children}
    </Button>
  );
};

export default { SecondaryButton }

//props:
//Default height in icon: h-4
//Default import in icon: "@heroicons/react/20/solid"; size of 20x20
//props to use in icon: startContent, endContent
//default value in border is "rounded" and the other variant is "rounded-full"