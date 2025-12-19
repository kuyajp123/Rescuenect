import React, { useMemo } from 'react';
import GlassCard from '../card/GlassCard';

/**
 * WeatherBackgroundProps
 * @param weatherCode - The weather code to determine the condition (Clear vs Rain/Cloudy).
 * @param children - The content to render on top of the background.
 * @param time - Optional time string or Date object to determine time of day. Defaults to current time.
 */
interface WeatherBackgroundProps {
  weatherCode: number;
  children: React.ReactNode;
  time?: string | Date;
}

const WeatherBackgroundLayout = React.memo(({ weatherCode, children, time }: WeatherBackgroundProps) => {
  // Helper to determine time of day
  const getTimeOfDay = (dateInfo?: string | Date): 'morning' | 'afternoon' | 'night' => {
    const date = dateInfo ? new Date(dateInfo) : new Date();
    const hour = date.getHours();

    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'night';
  };

  // Helper to determine condition (simplified)
  const getCondition = (code: number): 'clear' | 'rain' => {
     // Codes:
     // 1000, 10000, 10001: Clear
     // 1100-1102: Partly Cloudy
     if ([1000, 10000, 10001, 1100, 1101, 1102, 11000, 11001, 11010, 11011, 11020, 11021].includes(code)) {
         return 'clear';
     }
     return 'rain';
  };

  const timeOfDay = useMemo(() => getTimeOfDay(time), [time]);
  const condition = useMemo(() => getCondition(weatherCode), [weatherCode]);
  
  // Construct image path
  const backgroundImage = `/images/weather/${timeOfDay}-${condition}.png`;

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
          {/* Actual Image with Blur - GPU Accelerated */}
          <img 
             src={backgroundImage}
             alt="Weather Background"
             className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 transform-gpu will-change-transform transition-opacity duration-700 ease-in-out"
             draggable={false}
             decoding="async"
          />
      </div>

      {/* Content Layer wrapped in GlassCard */}
      <div className="relative z-10 w-full h-full flex flex-col">
        <GlassCard className="w-full h-full overflow-hidden" size="large">
            <div className="w-full h-full overflow-y-auto">
                {children}
            </div>
        </GlassCard>
      </div>
    </div>
  );
});

WeatherBackgroundLayout.displayName = 'WeatherBackgroundLayout';

export default WeatherBackgroundLayout;
