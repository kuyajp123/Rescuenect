// import { NameHere } from '@/components/shared/types/components';
import FirebaseFirestore from 'firebase/firestore';

export type StatusTemplateProps = {
  style?: object;
  id?: string | number;
  picture: string;
  firstName: string;
  lastName: string;
  loc?: string;
  lat?: number;
  lng?: number;
  status?: string;
  description?: string;
  image?: string;
  person?: number;
  contact?: string;
  date: string;
  time: string;
  category?: string;
  itemName?: string;
  quantity?: number;
};

export type CarouselItem = {
  id: number;
  category: string;
  current_item: number;
  target_item: number;
};

export type UserData = {
  firstName: string;
  lastName: string;
  profileImage: string;
};

export interface CommunityStatusProps {
  safe: number | null;
  evacuated: number | null;
  affected: number | null;
  missing: number | null;
}

export interface ImageModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  alt?: string;
}

export interface Event {
  id?: string;
  title: string;
  description?: string;
  image?: any; // Changed to 'any' to accept require() imports
  date: string;
  location: string;
}

export interface User {
  firstName: string;
  lastName: string;
  profileImage?: string;
  location: string;
  condition: string;
}

export interface loggedInUser {
  firstName: string;
  lastName: string;
  profileImage?: string;
}

export type FiveDaysForecastProps = {
  day?: string;
  date?: string;
  weatherCode?: number;
  temperature?: string;
  isNight?: boolean;
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

interface StatusData {
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
  condition: 'safe' | 'evacuated' | 'affected' | 'missing' | '';

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
  shareLocation: boolean | undefined;
  shareContact: boolean | undefined;

  // Expiration settings (user-controlled)
  expirationDuration: 12 | 24 | undefined; // hours
  expiresAt: FirebaseFirestore.Timestamp; // when status becomes inactive

  // Timestamps
  createdAt: FirebaseFirestore.Timestamp | string;
  updatedAt?: FirebaseFirestore.Timestamp | string;
  deletedAt?: FirebaseFirestore.Timestamp | string;

  // System-managed cleanup (30 days retention for history)
  retentionUntil: FirebaseFirestore.Timestamp; // when history is permanently deleted
}

export type CreateStatusData = Omit<
  StatusData,
  'parentId' | 'versionId' | 'statusType' | 'expiresAt' | 'createdAt' | 'retentionUntil' | 'updatedAt' | 'deletedAt'
>;

export type StatusStateData = CreateStatusData & {
  parentId?: string;
  versionId?: string;
  createdAt?: FirebaseFirestore.Timestamp | undefined;
  statusType?: 'current' | 'history' | 'deleted';
  category: Category[];
  people: number;
};

export type StatusFormErrors = {
  [K in keyof CreateStatusData]?: string; // every field maps to a string error
} & {
  errMessage?: string;
  parentId?: string;
  versionId?: string;
  createdAt?: string;
};

// Types for a single address component
interface AddressComponents {
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country: string;
  country_code: string;
  postcode?: string;
  road?: string;
  suburb?: string;
  [key: string]: any; // keep flexible because OpenCage can return extra fields
}

// Types for the whole address state
export interface AddressState {
  formatted: string;
  components: AddressComponents;
}

// Weather data types
export interface Location {
  lat: number;
  lon: number;
}

export interface RealtimeWeather {
  id: string;
  location?: {
    lon: number;
    lat: number;
  };
  weatherCode: number;
  precipitationProbability: number;
  rainIntensity: number;
  humidity: number;
  temperature: number;
  temperatureApparent: number;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  cloudCover: number;
  cloudBase: number;
  cloudCeiling: number;
  visibility: number;
  uvIndex: number;
  uvHealthConcern: number;
  dewPoint: number;
  pressureSeaLevel: number;
  pressureSurfaceLevel: number;
  altimeterSetting: number;
  time: string;
  snowIntensity: number;
  sleetIntensity: number;
  freezingRainIntensity: number;
}

export interface DailyForecast {
  id: string;
  time: string;
  temperatureAvg: number;
  temperatureMax: number;
  temperatureMin: number;
  weatherCodeMax: number;
  weatherCodeMin: number;
  humidityAvg: number;
  precipitationProbabilityMax: number;
  windSpeedAvg: number;
  uvIndexMax: number;
}

export interface HourlyForecast {
  id: string;
  time: string;
  weatherCode: number;
  temperature: number;
  temperatureApparent: number;
  humidity: number;
  windSpeed: number;
  precipitationProbability: number;
  rainIntensity: number;
  rainAccumulation: number;
  cloudCover: number;
  uvIndex: number;
}

export interface WeatherData {
  realtime: RealtimeWeather[];
  daily: DailyForecast[];
  hourly: HourlyForecast[];
}

// Store type
export interface WeatherStore {
  weather: WeatherData | null;
  // Add other store methods/state as needed
  setWeather?: (weather: WeatherData) => void;
  clearWeather?: () => void;
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

export interface Coordinates {
  lat: number;
  lng: number;
}

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
  id: string,
  createdAt: FirebaseFirestore.Timestamp | string;
  images?: string[]; // Array of image URLs
}