import {useTheme} from "@heroui/use-theme";
import { SecondaryButton } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = () => {
    theme === 'light' ? setTheme('dark') : setTheme('light');
  }

  return (
    <SecondaryButton 
      className="rounded-full border-none" 
      onPress={handleThemeChange}
      isIconOnly
      >
        { theme === 'light' ? <Sun className="h-5" /> : <Moon className="h-5" /> } 
    </SecondaryButton>
  )
};