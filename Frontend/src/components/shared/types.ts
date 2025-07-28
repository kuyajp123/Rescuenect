export type WeatherIconProps = {
  height?: string | number;
  width?: string | number;
};

export type WeatherCardProps = {
    name: string;
    icon: number;
    precipitationProbability: number; // chance of rain
    rainAccumulation: number;
    rainIntensity: number;
    humidity: number;
    temperature: number;
    temperatureApparent: number; // feels like temperature
    uvIndex?: number;
    windSpeed: number;
    weatherCode: number; // weather condition code
    cloudCover: number; // percentage of cloud cover
};