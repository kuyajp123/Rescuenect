// Weather Data Types

export interface RealTimeWeather {
  id: string;
  time: string;
  location: {
    lat: number;
    lon: number;
  };
  altimeterSetting: number;
  cloudBase: number | null;
  cloudCeiling: number | null;
  cloudCover: number;
  dewPoint: number;
  freezingRainIntensity: number;
  humidity: number;
  precipitationProbability: number;
  pressureSeaLevel: number;
  pressureSurfaceLevel: number;
  rainIntensity: number;
  sleetIntensity: number;
  snowIntensity: number;
  temperature: number;
  temperatureApparent: number;
  uvHealthConcern: number;
  uvIndex: number;
  visibility: number;
  weatherCode: number;
  windDirection: number;
  windGust: number;
  windSpeed: number;
}

export interface HourlyWeather {
  id: string;
  time: string;
  altimeterSetting: number;
  cloudBase: number | null;
  cloudCeiling: number | null;
  cloudCover: number;
  dewPoint: number;
  evapotranspiration: number;
  freezingRainIntensity: number;
  humidity: number;
  iceAccumulation: number;
  iceAccumulationLwe: number;
  precipitationProbability: number;
  pressureSeaLevel: number;
  pressureSurfaceLevel: number;
  rainAccumulation: number;
  rainIntensity: number;
  sleetAccumulation: number;
  sleetAccumulationLwe: number;
  sleetIntensity: number;
  snowAccumulation: number;
  snowAccumulationLwe: number;
  snowDepth: number | null;
  snowIntensity: number;
  temperature: number;
  temperatureApparent: number;
  uvHealthConcern: number;
  uvIndex: number;
  visibility: number;
  weatherCode: number;
  windDirection: number;
  windGust: number;
  windSpeed: number;
}

export interface DailyWeather {
  id: string;
  time: string;
  sunriseTime: string;
  sunsetTime: string;
  moonriseTime: string;
  moonsetTime: string;

  // Averages
  temperatureAvg: number;
  temperatureApparentAvg: number;
  humidityAvg: number;
  dewPointAvg: number;
  cloudCoverAvg: number;
  windSpeedAvg: number;
  windDirectionAvg: number;
  pressureSeaLevelAvg: number;
  pressureSurfaceLevelAvg: number;
  uvIndexAvg: number;
  visibilityAvg: number;
  rainIntensityAvg: number;
  sleetIntensityAvg: number;
  snowIntensityAvg: number;
  freezingRainIntensityAvg: number;
  altimeterSettingAvg: number;
  evapotranspirationAvg: number;
  uvHealthConcernAvg: number;

  // Max/Min values
  temperatureMax: number;
  temperatureMin: number;
  temperatureApparentMax: number;
  temperatureApparentMin: number;
  humidityMax: number;
  humidityMin: number;
  pressureSeaLevelMax: number;
  pressureSeaLevelMin: number;
  cloudCoverMax: number;
  cloudCoverMin: number;
  windSpeedMax: number;
  windSpeedMin: number;
  windGustMax: number;
  windGustMin: number;
  uvIndexMax: number;
  uvIndexMin: number;
  visibilityMax: number;
  visibilityMin: number;
  rainIntensityMax: number;
  rainIntensityMin: number;

  // Accumulations/Sums
  rainAccumulationSum: number;
  rainAccumulationAvg: number;
  rainAccumulationMax: number;
  rainAccumulationMin: number;

  sleetAccumulationLweSum: number;
  snowAccumulationLweSum: number;
  iceAccumulationLweSum: number;
  iceAccumulationSum: number;
  snowAccumulationSum: number;
  evapotranspirationSum: number;

  // Weather Codes
  weatherCodeMax: number;
  weatherCodeMin: number;

  // Additional fields
  cloudBaseAvg: number;
  cloudBaseMax: number;
  cloudBaseMin: number;
  cloudCeilingAvg: number;
  cloudCeilingMax: number;
  cloudCeilingMin: number;

  // ... maps to the exhaustive JSON list provided
  dewPointMax: number;
  dewPointMin: number;
  evapotranspirationMax: number;
  evapotranspirationMin: number;
  precipitationProbabilityAvg: number;
  precipitationProbabilityMax: number;
  precipitationProbabilityMin: number;
  pressureSurfaceLevelMax: number;
  pressureSurfaceLevelMin: number;
  uvHealthConcernMax: number;
  uvHealthConcernMin: number;
}

export type WeatherData = {
  daily: DailyWeather[];
  hourly: HourlyWeather[];
  realtime: RealTimeWeather[];
};
