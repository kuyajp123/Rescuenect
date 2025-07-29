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

import WeatherCard from './WeatherCard';
import FiveDayForecastCard from './FiveDayForecastCard';
import DayForecastData from './DayForecastData';

import { WeatherIconProps } from '@/components/shared/types';

const iconFactory = (src: string, alt: string) => 
  ({ height = 40, width = 50 }: WeatherIconProps) => (
    <img src={src} height={height} width={width} alt={alt} />
  );

const ClearDayIcon = iconFactory(ClearDay, "Clear Day Icon");
const ClearNightIcon = iconFactory(ClearNight, "Clear Night Icon");
const CloudyIcon = iconFactory(Cloudy, "Cloudy Icon");
const DrizzleRainIcon = iconFactory(DrizzleRain, "Drizzle Rain Icon");
const FogIcon = iconFactory(Fog, "Fog Icon");
const HeavyGustIcon = iconFactory(HeavyGust, "Heavy Gust Icon");
const PartlyCloudyDayIcon = iconFactory(PartlyCloudyDay, "Partly Cloudy Day Icon");
const PartlyCloudyNightIcon = iconFactory(PartlyCloudyNight, "Partly Cloudy Night Icon");
const RainyIcon = iconFactory(Rainy, "Rainy Icon");
const ThunderStormIcon = iconFactory(ThunderStorm, "Thunder Storm Icon");
const WindyIcon = iconFactory(Windy, "Windy Icon");

export {
  ClearDayIcon,
  ClearNightIcon,
  CloudyIcon,
  DrizzleRainIcon,
  FogIcon,
  HeavyGustIcon,
  PartlyCloudyDayIcon,
  PartlyCloudyNightIcon,
  RainyIcon,
  ThunderStormIcon,
  WindyIcon
};

export { WeatherCard, FiveDayForecastCard, DayForecastData };