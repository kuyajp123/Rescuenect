import { useMapStyleStore } from '@/stores/useMapStyleStore';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';
import { Map, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MapStyle {
  key: string;
  label: string;
  url: string;
  attribution: string;
  description: string;
  icon: React.ReactNode;
}

interface MapStyleSelectorProps {
  onStyleChange: (styleUrl: string, attribution: string) => void;
  className?: string;
}

const MAP_STYLES: MapStyle[] = [
  {
    key: 'light',
    label: 'Light',
    url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    description: 'Standard OpenStreetMap style with light colors',
    icon: <Sun size={20} />,
  },
  {
    key: 'dark',
    label: 'Dark',
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    description: 'Dark theme with smooth styling',
    icon: <Moon size={20} />,
  },
];

const STORAGE_KEY = 'rescuenect_map_style';

export const MapStyleSelector = ({ onStyleChange }: MapStyleSelectorProps) => {
  const [selectedStyle, setSelectedStyle] = useState<string>('light');
  const setMapStyle = useMapStyleStore(state => state.setMapStyle);

  // Load saved style from localStorage on component mount
  useEffect(() => {
    const savedStyle = localStorage.getItem(STORAGE_KEY);
    if (savedStyle) {
      const style = MAP_STYLES.find(s => s.key === savedStyle);
      if (style) {
        setSelectedStyle(savedStyle);
        setMapStyle(style.url, style.attribution);
        onStyleChange(style.url, style.attribution);
      }
    } else {
      // Default to light style if nothing is saved
      const defaultStyle = MAP_STYLES.find(s => s.key === 'light');
      if (defaultStyle) {
        onStyleChange(defaultStyle.url, defaultStyle.attribution);
      }
    }
  }, [onStyleChange]); // Added onStyleChange to dependency array

  const handleStyleChange = (styleKey: string) => {
    const style = MAP_STYLES.find(s => s.key === styleKey);

    if (style) {
      setSelectedStyle(styleKey);
      setMapStyle(style.url, style.attribution);
      onStyleChange(style.url, style.attribution);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, styleKey);
    }
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          isIconOnly
          variant="solid"
          className="bg-bg dark:bg-bg-dark backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-bg-hover dark:hover:bg-bg-hover-dark"
        >
          <Map size={24} className="text-gray-600 dark:text-gray-300" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Dropdown menu with icons" variant="faded" items={MAP_STYLES}>
        {style => (
          <DropdownItem
            key={style.key}
            onPress={() => handleStyleChange(style.key)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
              selectedStyle === style.key
                ? 'bg-blue-50 dark:bg-blue-400/10 text-primary dark:text-primary'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
            }`}
            startContent={style.icon}
          >
            <div>
              <div className="font-medium text-sm">{style.label}</div>
            </div>
            {selectedStyle === style.key && <div className="w-2 h-2 text-primary dark:text-primary rounded-full" />}
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
};
