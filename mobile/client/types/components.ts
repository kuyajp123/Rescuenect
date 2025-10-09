// import { NameHere } from '@/components/shared/types/components';
import FirebaseFirestore from 'firebase/firestore';

export type StatusTemplateProps = {
  style?: object
  id?: string | number
  picture: string
  firstName: string
  lastName: string
  loc?: string
  lat?: number
  lng?: number
  status?: string
  description?: string
  image?: string
  person?: number
  contact?: string
  date: string
  time: string
  category?: string
  itemName?: string
  quantity?: number
}

export type CarouselItem = {
  id: number;
  category: string;
  current_item: number;
  target_item: number;
}

export type UserData = {
  firstName: string;
  lastName: string;
  profileImage: string;
}

export interface CommunityStatusProps {
    safe: number | null
    evacuated: number | null
    affected: number | null
    missing: number | null
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
    date: string;
    time: string;
    status: string;
}

export interface LogedInUser {
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
}

interface StatusData {
  // Core versioning fields
  parentId: string;
  versionId: string;
  statusType: "current" | "history" | "deleted";

  // User identification
  uid: string;

  profileImage: string;

  // Personal information
  firstName: string;
  lastName: string;
  phoneNumber: string;

  // Status information
  condition: "safe" | "evacuated" | "affected" | "missing" | "";

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

export type CreateStatusData = Omit<
  StatusData,
  | "parentId"
  | "versionId"
  | "statusType"
  | "expiresAt"
  | "createdAt"
  | "retentionUntil"
  | "updatedAt"
  | "deletedAt"
>;

export type StatusStateData = CreateStatusData & {
  parentId?: string;
  versionId?: string;
  expiresAt?: string;
};

export type StatusFormErrors = {
  [K in keyof CreateStatusData]?: string; // every field maps to a string error
} & {
  errMessage?: string;
  parentId?: string;
  versionId?: string;
  expiresAt?: string;
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
