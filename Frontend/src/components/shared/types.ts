export type WeatherIconProps = {
  height?: string | number;
  width?: string | number;
};

export type WeatherCardProps = {
    key?: string | number;
    name: string;
    icon: number;
    precipitationProbability: number; // chance of rain
    rainIntensity: number;
    humidity: number;
    temperature: number;
    temperatureApparent: number; // feels like temperature
    windSpeed: number;
    weatherCode: number; // weather condition code
    cloudCover: number; // percentage of cloud cover
};

export interface ForecastDataProps {
  key?: string | number;
  time: string;
  temperature: number;
  weatherCode: number;
}

export interface GetDateAndTimeProps {
    date?: string;
    year?: string;
    month?: string;
    weekday?: string;
    day?: string;
    hour?: string;
    minute?: string;
    second?: string;
    hour12?: boolean;
}