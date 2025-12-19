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

export type Category =
  | 'flood'
  | 'earthquake'
  | 'fire'
  | 'typhoon'
  | 'landslide'
  | 'storm'
  | 'accident'
  | 'informational'
  | 'extreme-heat'
  | 'tsunami'
  | 'medical-emergency'
  | 'other';

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
  email: string;

  // Status information
  condition: 'safe' | 'evacuated' | 'affected' | 'missing';

  // Location data
  lat: number | null;
  lng: number | null;
  location?: string | null;

  // Additional information
  note: string;
  image: string;
  category: Category[];
  people: number;

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
  | 'email'
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
  onResolved?: () => void;
  onViewDetails?: () => void;
  onViewProfile?: () => void;
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
  maxBounds?: [[number, number], [number, number]];
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
  onMapClick?: (latlng: { lat: number; lng: number }) => void;
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

// panel types from status
export interface StatusCardProps {
  id: string;
  vid: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  condition: 'safe' | 'evacuated' | 'affected' | 'missing';
  phoneNumber?: string;
  location: string;
  lat: number;
  lng: number;
  status: 'current' | 'history' | 'deleted';
  createdAt: string;
  expirationDuration: string;
  parentId?: string;
  originalStatus?: any;
  category: [];
  people: number;
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

export interface Coordinates {
  lat: number;
  lng: number;
}

type CenterTypes = {
  type:
    | 'school'
    | 'barangay hall'
    | 'gymnasium'
    | 'church'
    | 'government building'
    | 'private facility'
    | 'vacant building'
    | 'covered court'
    | 'other';
};

// type for evacuation center
export interface EvacuationCenterFormData {
  name: string;
  location: string;
  coordinates: Coordinates | null;
  capacity: string;
  type: CenterTypes['type'];
  status: 'available' | 'full' | 'closed';
  contact?: string;
  description?: string;
}

export interface EvacuationCenter extends EvacuationCenterFormData {
  images: never[];
  id: string;
  createdAt: FirebaseFirestore.Timestamp | string;
}

// ============================================
// NOTIFICATION TYPES - Mobile Client
// ============================================

/**
 * Base notification interface - matches backend schema
 */
export interface BaseNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number; // Unix timestamp in milliseconds
  createdAt: string; // ISO string for human-readable date

  // User interaction tracking
  readBy?: string[]; // User IDs who have read the notification
  hiddenBy?: string[]; // User IDs who have hidden/deleted from their view

  // Location/barangay targeting
  location: string; // weather zone or specific barangay
  barangays?: string[]; // List of affected barangays

  // Audience targeting
  audience: 'admin' | 'users' | 'both';

  // Delivery tracking
  sentTo: number; // Number of recipients
  deliveryStatus?: {
    success: number;
    failure: number;
    errors?: string[];
  };

  // Type-specific data
  data?: WeatherNotificationData | EarthquakeNotificationData | AnnouncementNotificationData | Record<string, unknown>;
}

/**
 * Notification types
 */
export type NotificationType =
  | 'weather'
  | 'earthquake'
  | 'announcement'
  | 'emergency'
  | 'system'
  | 'evacuation'
  | 'flood'
  | 'typhoon';

/**
 * Weather notification severity levels
 */
export type WeatherSeverity = 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFO';

/**
 * Weather notification data structure
 */
export interface WeatherNotificationData {
  // Weather type
  weatherType: 'current' | 'forecast_3h' | 'forecast_tomorrow';

  // Severity and category
  severity: WeatherSeverity;
  category:
    | 'Heat'
    | 'Rain'
    | 'Wind'
    | 'Visibility'
    | 'UV'
    | 'Storm'
    | 'Flood'
    | 'Clear'
    | 'Cloudy'
    | 'Tropical'
    | 'Combined';

  // Weather metrics
  temperature?: number;
  temperatureApparent?: number;
  humidity?: number;
  rainIntensity?: number;
  rainAccumulation?: number;
  windSpeed?: number;
  windGust?: number;
  windDirection?: number;
  uvIndex?: number;
  visibility?: number;
  precipitationProbability?: number;
  weatherCode?: number;

  // Forecast specific
  forecastTime?: string; // ISO string for forecast time
  forecastHoursAhead?: number;

  // Alert priority (1-5, where 1 is highest)
  priority: number;

  // Source
  source: 'weather_api' | 'manual';
}

/**
 * Earthquake notification data structure
 */
export interface EarthquakeNotificationData {
  // USGS earthquake ID
  earthquakeId: string;

  // Magnitude and location
  magnitude: number;
  place: string;

  // Coordinates
  coordinates: {
    latitude: number;
    longitude: number;
    depth: number; // in kilometers
  };

  data?: any;

  // Severity classification
  severity: 'micro' | 'minor' | 'light' | 'moderate' | 'strong' | 'major' | 'great';

  // Tsunami warning
  tsunamiWarning: boolean;

  // Priority (1-5, where 1 is highest)
  priority: 'critical' | 'high' | 'medium' | 'low';

  // External links
  usgsUrl?: string;
  phivolcsUrl?: string;

  // Source
  source: 'usgs' | 'phivolcs' | 'manual';

  // Distance from Naic (optional)
  distanceFromNaic?: number; // in kilometers

  // Impact radii for visualization
  impact_radii?: {
    felt_radius_km: number;
    moderate_shaking_radius_km: number;
    strong_shaking_radius_km: number;
  };
}

/**
 * Announcement notification data structure
 */
export interface AnnouncementNotificationData {
  // Announcement details
  category: 'general' | 'event' | 'update' | 'maintenance' | 'alert';

  // Optional expiration
  expiresAt?: string; // ISO string

  // Priority
  priority: number; // 1-5, where 1 is highest

  // Source
  source: 'admin' | 'system';
}

export interface StatusDataCard {
  id?: string;
  parentId: string;
  versionId: string;
  statusType: 'current' | 'history' | 'deleted';
  uid: string;
  profileImage: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  condition: 'safe' | 'evacuated' | 'affected' | 'missing';
  lat: number | null;
  lng: number | null;
  location?: string | null;
  note: string;
  image: string;
  category: Category[] | string;
  people: number | string;
  shareLocation: boolean;
  shareContact: boolean;
  expirationDuration: 12 | 24;
  expiresAt: { _seconds: number; _nanoseconds: number };
  createdAt: { _seconds?: number; _nanoseconds?: number; seconds?: number; nanoseconds?: number };
  updatedAt?: { _seconds?: number; _nanoseconds?: number; seconds?: number; nanoseconds?: number };
  deletedAt?: { _seconds: number; _nanoseconds: number };
  retentionUntil: { _seconds: number; _nanoseconds: number };
}
