import { useState, useEffect, useRef } from 'react';
import { Map } from 'lucide-react';
import { SecondaryButton } from '../../button';

interface MapStyle {
  key: string;
  label: string;
  url: string;
  description: string;
}

interface MapStyleSelectorProps {
  onStyleChange: (styleUrl: string) => void;
  className?: string;
}

const MAP_STYLES: MapStyle[] = [
  {
    key: 'light',
    label: 'Light',
    url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    description: 'Standard OpenStreetMap style with light colors',
  },
  {
    key: 'dark',
    label: 'Dark',
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png',
    description: 'Dark theme with smooth styling',
  },
];

const STORAGE_KEY = 'rescuenect_map_style';

export const MapStyleSelector = ({ onStyleChange, className = '' }: MapStyleSelectorProps) => {
  const [selectedStyle, setSelectedStyle] = useState<string>('light');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Load saved style from localStorage on component mount
  useEffect(() => {
    const savedStyle = localStorage.getItem(STORAGE_KEY);
    if (savedStyle) {
      const style = MAP_STYLES.find(s => s.key === savedStyle);
      if (style) {
        setSelectedStyle(savedStyle);
        onStyleChange(style.url);
      }
    } else {
      // Default to light style if nothing is saved
      const defaultStyle = MAP_STYLES.find(s => s.key === 'light');
      if (defaultStyle) {
        onStyleChange(defaultStyle.url);
      }
    }
  }, []); // Empty dependency array since we only want this to run once on mount

  const handleStyleChange = (styleKey: string) => {
    const style = MAP_STYLES.find(s => s.key === styleKey);

    if (style) {
      setSelectedStyle(styleKey);
      onStyleChange(style.url);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, styleKey);

      console.log(`Map style changed to: ${style.label} (${style.url})`);

      // Close dropdown after selection
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Map Icon Button */}
      <SecondaryButton
        className="bg-bg dark:bg-bg-dark backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-bg-hover dark:hover:bg-bg-hover-dark"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Map size={20} className="text-gray-600 dark:text-gray-300" />
      </SecondaryButton>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-bg dark:bg-bg-dark backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">Map Style</div>
            {MAP_STYLES.map(style => (
              <button
                key={style.key}
                onClick={() => handleStyleChange(style.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  selectedStyle === style.key
                    ? 'bg-blue-50 dark:bg-blue-400/10 text-primary dark:text-primary'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border-2 ${
                    style.key === 'light' ? 'bg-white border-gray-400' : 'bg-gray-800 border-gray-600'
                  }`}
                />
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{style.label}</div>
                  <div className="text-xs opacity-70">{style.description}</div>
                </div>
                {selectedStyle === style.key && <div className="w-2 h-2 text-primary dark:text-primary rounded-full" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
