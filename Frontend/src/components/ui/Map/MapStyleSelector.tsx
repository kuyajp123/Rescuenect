import {
  getMapStyleOption,
  MAP_STYLE_OPTIONS,
  MapStyleKey,
  useMapStyleStore,
} from '@/stores/useMapStyleStore';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';
import { Map, Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface MapStyleSelectorProps {
  onStyleChange?: (styleUrl: string, attribution: string) => void;
  className?: string;
}

const MAP_STYLE_ICONS: Record<MapStyleKey, ReactNode> = {
  light: <Sun size={20} />,
  dark: <Moon size={20} />,
};

export const MapStyleSelector = ({ onStyleChange, className }: MapStyleSelectorProps) => {
  const selectedStyle = useMapStyleStore(state => state.styleKey);
  const styleUrl = useMapStyleStore(state => state.styleUrl);
  const attribution = useMapStyleStore(state => state.attribution);
  const setMapStyleByKey = useMapStyleStore(state => state.setMapStyleByKey);

  useEffect(() => {
    onStyleChange?.(styleUrl, attribution);
  }, [attribution, onStyleChange, styleUrl]);

  const handleStyleChange = (styleKey: string) => {
    const style = getMapStyleOption(styleKey);

    if (style.key === selectedStyle) return;

    setMapStyleByKey(style.key);
  };

  return (
    <div className={className}>
      <Dropdown>
        <DropdownTrigger>
          <Button
            isIconOnly
            variant="solid"
            className="border border-gray-200 bg-bg shadow-lg backdrop-blur-sm hover:bg-bg-hover dark:border-gray-700 dark:bg-bg-dark dark:hover:bg-bg-hover-dark"
          >
            <Map size={24} className="text-gray-600 dark:text-gray-300" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Map style options" variant="faded" items={MAP_STYLE_OPTIONS}>
          {style => (
            <DropdownItem
              key={style.key}
              onPress={() => handleStyleChange(style.key)}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                selectedStyle === style.key
                  ? 'bg-blue-50 text-primary dark:bg-blue-400/10 dark:text-primary'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
              }`}
              startContent={MAP_STYLE_ICONS[style.key]}
            >
              <div>
                <div className="text-sm font-medium">{style.label}</div>
              </div>
              {selectedStyle === style.key && <div className="h-2 w-2 rounded-full bg-primary" />}
            </DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};
