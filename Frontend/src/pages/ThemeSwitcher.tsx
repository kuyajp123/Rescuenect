import {useTheme} from "@heroui/use-theme";
import PrimaryButton from "@/components/PrimaryButton";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex justify-end items-center gap-3 w-full">
      The current theme is: {theme}
      <PrimaryButton className="primary" onClick={() => setTheme('light')}>Light Mode</PrimaryButton>
      <PrimaryButton className="primary text-white" onClick={() => setTheme('dark')}>Dark Mode</PrimaryButton>
    </div>
  )
};