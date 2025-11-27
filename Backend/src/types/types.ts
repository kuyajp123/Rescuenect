export interface WeatherData {
  timelines: {
    hourly: any;
    daily: any;
  };
}

export type WeatherLocationKey =
  | 'coastal_west'
  | 'coastal_east'
  | 'central_naic'
  | 'sabang'
  | 'farm_area'
  | 'naic_boundary';

export interface forecastData {
  time: string;
  values: Record<string, any>;
}

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

export interface VersionHistoryItem {
  versionId: string;
  parentId: string;
  uid: string;
  createdAt?: string;
  profileImage: string;
  firstName: string;
  lastName: string;
  note?: string;
  location: string;
  lat: number;
  lng: number;
  condition: string;
}

interface coordinates {
  lat: number;
  lng: number;
}

export interface EvacuationCenterFormData {
  name: string;
  location: string;
  coordinates: coordinates | null;
  capacity: string;
  type: string;
  status: string;
  contact?: string;
  description?: string;
}