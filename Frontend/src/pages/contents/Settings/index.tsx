import { useMapStyleStore } from '@/stores/useMapStyleStore';
import { Card, CardBody, CardHeader, Divider, Radio, RadioGroup } from '@heroui/react';
import { useTheme } from '@heroui/use-theme';
import { Map, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'rescuenect_map_style';

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { styleUrl, setMapStyle } = useMapStyleStore();
  const [selectedMapStyle, setSelectedMapStyle] = useState<string>('light');

  // Initialize map style from localStorage or store
  useEffect(() => {
    const savedStyle = localStorage.getItem(STORAGE_KEY);
    if (savedStyle) {
      setSelectedMapStyle(savedStyle);
    } else if (styleUrl.includes('alidade_smooth_dark')) {
      setSelectedMapStyle('dark');
    } else {
      setSelectedMapStyle('light');
    }
  }, [styleUrl]);

  const handleThemeChange = (value: string) => {
    setTheme(value);
  };

  const handleMapStyleChange = (value: string) => {
    setSelectedMapStyle(value);

    if (value === 'light') {
      setMapStyle(
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      );
    } else {
      setMapStyle(
        'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png',
        '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
      );
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, value);
  };

  return (
    <div className="w-full max-w-[800px] mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Customize your Rescuenect experience</p>
      </div>

      {/* Appearance Settings Card */}
      <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
        <CardHeader className="flex gap-3 pb-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Sun size={20} className="text-primary" />
          </div>
          <div className="flex flex-col">
            <p className="text-lg font-semibold">Appearance</p>
            <p className="text-small text-default-500">Choose your interface theme</p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="gap-4 py-6 overflow-hidden">
          <RadioGroup
            value={theme}
            onValueChange={handleThemeChange}
            orientation="horizontal"
            classNames={{
              wrapper: 'gap-4',
            }}
          >
            <Radio
              value="light"
              classNames={{
                base: 'flex-1 max-w-none m-0 bg-content1 hover:bg-content2 items-center justify-between cursor-pointer rounded-lg gap-4 p-4 border-2 border-transparent data-[selected=true]:border-primary transition-all',
                wrapper: 'hidden',
              }}
            >
              <div className="w-full flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30">
                  <Sun size={24} className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex flex-col flex-1">
                  <p className="text-base font-semibold">Light Mode</p>
                  <p className="text-tiny text-default-500">Bright and clear interface</p>
                </div>
                {theme === 'light' && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </Radio>

            <Radio
              value="dark"
              classNames={{
                base: 'flex-1 max-w-none m-0 bg-content1 hover:bg-content2 items-center justify-between cursor-pointer rounded-lg gap-4 p-4 border-2 border-transparent data-[selected=true]:border-primary transition-all',
                wrapper: 'hidden',
              }}
            >
              <div className="w-full flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                  <Moon size={24} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex flex-col flex-1">
                  <p className="text-base font-semibold">Dark Mode</p>
                  <p className="text-tiny text-default-500">Easy on the eyes</p>
                </div>
                {theme === 'dark' && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </Radio>
          </RadioGroup>
        </CardBody>
      </Card>

      {/* Map Style Settings Card */}
      <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
        <CardHeader className="flex gap-3 pb-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Map size={20} className="text-primary" />
          </div>
          <div className="flex flex-col">
            <p className="text-lg font-semibold">Map Style</p>
            <p className="text-small text-default-500">Choose your preferred map appearance</p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="gap-4 py-6 overflow-hidden">
          <RadioGroup
            value={selectedMapStyle}
            onValueChange={handleMapStyleChange}
            orientation="horizontal"
            classNames={{
              wrapper: 'gap-4',
            }}
          >
            {/* Light Map Style */}
            <Radio
              value="light"
              classNames={{
                base: 'flex-1 max-w-none m-0 bg-content1 hover:bg-content2 cursor-pointer rounded-lg gap-3 p-4 border-2 border-transparent data-[selected=true]:border-primary transition-all',
                wrapper: 'hidden',
              }}
            >
              <div className="w-full flex flex-col gap-3">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                  <img src="public/images/map/map-light.png" alt="Light Map Style" className="w-full h-full object-cover" />
                  {selectedMapStyle === 'light' && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                    <Sun size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <p className="text-base font-semibold">Light Style</p>
                    <p className="text-tiny text-default-500">Standard OpenStreetMap</p>
                  </div>
                </div>
              </div>
            </Radio>

            {/* Dark Map Style */}
            <Radio
              value="dark"
              classNames={{
                base: 'flex-1 max-w-none m-0 bg-content1 hover:bg-content2 cursor-pointer rounded-lg gap-3 p-4 border-2 border-transparent data-[selected=true]:border-primary transition-all',
                wrapper: 'hidden',
              }}
            >
              <div className="w-full flex flex-col gap-3">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                  <img src="public/images/map/map-dark.png" alt="Dark Map Style" className="w-full h-full object-cover" />
                  {selectedMapStyle === 'dark' && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-900/30 dark:to-gray-900/30">
                    <Moon size={20} className="text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <p className="text-base font-semibold">Dark Style</p>
                    <p className="text-tiny text-default-500">Smooth dark theme</p>
                  </div>
                </div>
              </div>
            </Radio>
          </RadioGroup>

          <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-default-600 flex items-start gap-2">
              <Map size={14} className="mt-0.5 shrink-0 text-primary" />
              <span>Map style will be applied to all maps throughout the application</span>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default Settings;
