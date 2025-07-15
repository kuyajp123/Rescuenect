// import { NameHere } from '@/components/shared/types/components';

export type StatusTemplateProps = {
  style?: object
  id?: string | number
  profileImage: string
  firstName: string
  lastName: string
  location?: string
  longitude?: string
  latitude?: string
  status?: string
  description?: string
  image?: string
  numberOfPeople?: number
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