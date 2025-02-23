import {useTheme} from "@heroui/use-theme";
import { Button } from "@heroui/react";
import PrimaryButton from "@/components/PrimaryButton";
PrimaryButton

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      The current theme is: {theme}
      <PrimaryButton className="primary rounded-full" onClick={() => setTheme('light')}>Light Mode</PrimaryButton>
      <PrimaryButton className="primary text-white" onClick={() => setTheme('dark')}>Dark Mode</PrimaryButton>
    </div>
  )
};