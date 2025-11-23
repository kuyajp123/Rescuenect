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
  className?: string;
  vid?: string;
};

// Define the data structure for map markers
export interface MapMarkerData {
  uid: string;
  lat: number;
  lng: number;
  condition?: 'safe' | 'evacuated' | 'affected' | 'missing';
  // Earthquake-specific fields
  severity?: 'micro' | 'minor' | 'light' | 'moderate' | 'strong' | 'major' | 'great';
  magnitude?: number;
}

// Define props for the Map component
export interface MapProps {
  // Data props - can use either single data array or separate arrays
  data?: MapMarkerData[];
  earthquakeData?: MapMarkerData[];
  statusData?: StatusData[];

  // Optional props with defaults
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  height?: string;
  width?: string;
  zoomControl?: boolean;
  dragging?: boolean;
  hasMapControl?: boolean;

  // Customization props
  markerType?: 'status' | 'default' | 'earthquake' | 'circle' | 'mixed';
  tileLayerUrl?: string;
  attribution?: string;

  // Circle marker customization (for earthquake and circle types)
  circleRadius?: number;
  circleOpacity?: number;
  circleStrokeWidth?: number;
  circleStrokeColor?: string;

  // Popup customization
  renderPopup?: (item: MapMarkerData) => React.ReactNode;
  popupType?: 'default' | 'coordinates' | 'custom';
  showCoordinates?: boolean;

  // Event handlers
  onMarkerClick?: (item: MapMarkerData) => void;
  onTileLayerChange?: (url: string) => void;
  className?: string;

  // Overlay components
  hasMapStyleSelector?: boolean;
  overlayComponent?: React.ReactNode;
  overlayPosition?: 'topright' | 'topleft' | 'bottomright' | 'bottomleft';
  overlayClassName?: string;
  CustomSettingControl?: React.ReactNode;
}

// GeoJSON Earthquake format (from JSON file)
export interface GeoJSONEarthquake {
  type: 'Feature';
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    url: string;
    tsunami: number;
    status: string;
    title: string;
    [key: string]: any; // for additional properties
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [longitude, latitude, depth]
  };
  id: string;
}

// Database Earthquake format (from Firestore)
export interface ProcessedEarthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  updated: number;
  coordinates: {
    longitude: number;
    latitude: number;
    depth: number;
  };
  severity: 'micro' | 'minor' | 'light' | 'moderate' | 'strong' | 'major' | 'great';
  priority: 'low' | 'normal' | 'high' | 'critical';
  tsunami_warning: boolean;
  usgs_url: string;
  distance_km?: number;
  impact_radii: {
    felt_radius_km: number;
    moderate_shaking_radius_km: number;
    strong_shaking_radius_km: number;
    estimation_params: {
      feltA: number;
      moderateA: number;
      strongA: number;
      B: number;
      D: number;
    };
  };
  notification_sent: boolean;
}

// Unified earthquake type for components
export type UnifiedEarthquake = ProcessedEarthquake;

// GeoJSON collection type
export interface EarthquakeGeoJSONCollection {
  type: 'FeatureCollection';
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: GeoJSONEarthquake[];
}
