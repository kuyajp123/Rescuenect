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
    rainAccumulation?: number; // total rain accumulation
    humidity: number;
    temperature: number;
    temperatureApparent: number; // feels like temperature
    uvIndex?: number; // UV index, optional
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

//weather data types
export type DailyData = {
  id: string;
  time: string;
  altimeterSettingAvg: number;
  altimeterSettingMax: number;
  altimeterSettingMin: number;
  // Add other fields if needed (you can expand this anytime)
};

export type HourlyData = {
  time: string;
  values: Record<string, number>; // or a more specific type if you know the structure
  // Add other fields if needed
};

export type RealTimeData = {
  id: string;
  localTime: string;
  location: {
    lat: number;
    lon: number;
  };
  data: {
    time: string;
    values: Record<string, number>; // or use a custom type
  };
};

export type WeatherData = {
  dailyData: DailyData[];
  hourlyData: HourlyData[];
  realTimeData: RealTimeData;
};