import ClearDay from '@/assets/icons/ClearDay10000.svg';
import ClearNight from '@/assets/icons/ClearNight10001.svg';
import Cloudy from '@/assets/icons/Cloudy1001.svg';
import DrizzleRain from '@/assets/icons/DrizzleLightRain4000_4200.svg';
import Fog from '@/assets/icons/Fog2000_2100.svg';
import HeavyGust from '@/assets/icons/HeavyGust.svg';
import PartlyCloudyDay from '@/assets/icons/PartlyCloudyDay11010.svg';
import PartlyCloudyNight from '@/assets/icons/PartlyCloudyNight11011.svg';
import Rainy from '@/assets/icons/RainyHeavyRain4001_ 4201.svg';
import ThunderStorm from '@/assets/icons/ThunderStorm8000.svg';
import Windy from '@/assets/icons/Windy.svg';

import { WeatherIconProps } from '@/components/shared/types';

const iconFactory = (src: string, alt: string) => 
  ({ height = 40, width = 50 }: WeatherIconProps) => (
    <img src={src} height={height} width={width} alt={alt} />
  );

export const ClearDayIcon = iconFactory(ClearDay, "Clear Day Icon");
export const ClearNightIcon = iconFactory(ClearNight, "Clear Night Icon");
export const CloudyIcon = iconFactory(Cloudy, "Cloudy Icon");
export const DrizzleRainIcon = iconFactory(DrizzleRain, "Drizzle Rain Icon");
export const FogIcon = iconFactory(Fog, "Fog Icon");
export const HeavyGustIcon = iconFactory(HeavyGust, "Heavy Gust Icon");
export const PartlyCloudyDayIcon = iconFactory(PartlyCloudyDay, "Partly Cloudy Day Icon");
export const PartlyCloudyNightIcon = iconFactory(PartlyCloudyNight, "Partly Cloudy Night Icon");
export const RainyIcon = iconFactory(Rainy, "Rainy Icon");
export const ThunderStormIcon = iconFactory(ThunderStorm, "Thunder Storm Icon");
export const WindyIcon = iconFactory(Windy, "Windy Icon");