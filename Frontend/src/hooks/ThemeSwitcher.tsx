import { Switch } from '@heroui/react';
import { useTheme } from '@heroui/use-theme';
import { Moon, Sun } from 'lucide-react';

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (isSelected: boolean) => {
    setTheme(isSelected ? 'dark' : 'light');
  };

  return (
    <Switch
      isSelected={theme === 'dark'}
      onValueChange={handleThemeChange}
      color="primary"
      size="md"
      thumbIcon={({ isSelected, className }) =>
        isSelected ? <Sun size={20} className={className} /> : <Moon size={20} className={className} />
      }
    ></Switch>
  );
};
