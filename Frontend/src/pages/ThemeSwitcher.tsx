import {useTheme} from "@heroui/use-theme";
import PrimaryButton from "@/components/PrimaryButton";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      The current theme is: {theme}
      <PrimaryButton className="primary" onClick={() => setTheme('light')}>Light Mode</PrimaryButton>
      &nbsp;&nbsp;&nbsp;&nbsp;
      <PrimaryButton className="primary text-white" onClick={() => setTheme('dark')}>Dark Mode</PrimaryButton>
    </div>
  )
};