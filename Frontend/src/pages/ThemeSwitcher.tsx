import {useTheme} from "@heroui/use-theme";
import { Button } from "@heroui/react";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      The current theme is: {theme}
      <Button className="bg-primary_plain" onClick={() => setTheme('light')}>Light Mode</Button>
      <Button className="primary text-white" onClick={() => setTheme('dark')}>Dark Mode</Button>
    </div>
  )
};