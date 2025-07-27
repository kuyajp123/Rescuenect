import {useTheme} from "@heroui/use-theme";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { SecondaryButton } from "@/components/button";

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
        { theme === 'light' ? <SunIcon className="h-5" /> : <MoonIcon className="h-5" /> } 
    </SecondaryButton>
  )
};