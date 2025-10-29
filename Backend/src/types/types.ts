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
