import {useTheme} from "@heroui/use-theme";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import SecondaryButton from "@/components/button/SecondaryButton";
import PrimaryButton from "@/components/button/PrimaryButton";


export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = () => {
    theme === 'light' ? setTheme('dark') : setTheme('light');
  }

  return (
    <div className="bg-bg dark:bg-bg flex justify-end items-center gap-3">
      <SecondaryButton 
      className="rounded-full border-blank dark:border-none" 
      onPress={handleThemeChange}
      isIconOnly
      >
         { theme === 'light' ? <SunIcon className="h-5" /> : <MoonIcon className="h-5" /> } 
      </SecondaryButton>
    </div>
  )
};