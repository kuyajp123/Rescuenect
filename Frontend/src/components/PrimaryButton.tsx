import React from "react";
import { Button, ButtonProps } from "@heroui/react";
import { useScreenSize } from "@/utils/ScreenSizeContext";

interface PrimaryButtonProps extends ButtonProps {
  children: React.ReactNode
}

const PrimaryButton: React.FC<PrimaryButtonProps & ButtonProps> = ({ children, className = "", ...props }) => {
  const { screenSize  } = useScreenSize();

  return (
    <Button
    className={`primary dark:primary rounded text-[#f2f2f2] dark:text-content_text
      ${screenSize === 'large_screen' ? 'text-base ' : 'text-sm'}
      ${className}
    `}
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
