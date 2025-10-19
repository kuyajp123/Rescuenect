import FirebaseFirestore from 'firebase/firestore';

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

export interface StatusData {
  // Core versioning fields
  parentId: string;
  versionId: string;
  statusType: 'current' | 'history' | 'deleted';

  // User identification
  uid: string;

  profileImage: string;

  // Personal information
  firstName: string;
  lastName: string;
  phoneNumber: string;

  // Status information
  condition: 'safe' | 'evacuated' | 'affected' | 'missing';

  // Location data
  lat: number | null;
  lng: number | null;
  location?: string | null;

  // Additional information
  note: string;
  image: string;

  // Privacy settings
  shareLocation: boolean;
  shareContact: boolean;

  // Expiration settings (user-controlled)
  expirationDuration: 12 | 24; // hours
  expiresAt: FirebaseFirestore.Timestamp; // when status becomes inactive

  // Timestamps
  createdAt: FirebaseFirestore.Timestamp | string;
  updatedAt?: FirebaseFirestore.Timestamp | string;
  deletedAt?: FirebaseFirestore.Timestamp | string;

  // System-managed cleanup (30 days retention for history)
  retentionUntil: FirebaseFirestore.Timestamp; // when history is permanently deleted
}

export type StatusTemplateProps = Omit<
  StatusData,
  | 'parentId'
  | 'versionId'
  | 'statusType'
  | 'shareLocation'
  | 'shareContact'
  | 'expirationDuration'
  | 'updatedAt'
  | 'deletedAt'
  | 'retentionUntil'
  | 'lat'
  | 'lng'
> & {
  style?: React.CSSProperties;
};

// Define the data structure for map markers
export interface MapMarkerData {
  uid: string;
  lat: number;
  lng: number;
  condition: 'safe' | 'evacuated' | 'affected' | 'missing';
}

// Define props for the Map component
export interface MapProps {
  // Required props
  data: MapMarkerData[];

  // Optional props with defaults
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  height?: string;
  width?: string;

  // Customization props
  markerType?: 'status' | 'default';
  tileLayerUrl?: string;
  attribution?: string;

  // Popup customization
  renderPopup?: (item: MapMarkerData) => React.ReactNode;
  popupType?: 'default' | 'coordinates' | 'custom';
  showCoordinates?: boolean;

  // Event handlers
  onMarkerClick?: (item: MapMarkerData) => void;
  className?: string;
}
