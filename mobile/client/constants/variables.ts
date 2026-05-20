import { getBarangayOptionsForClient } from '@/config/locationConfig';
import { Category } from '@/types/components';

export const formFields = [
  'firstName',
  'lastName',
  'condition',
  'phoneNumber',
  'lat',
  'lng',
  'location',
  'image',
  'note',
  'category',
  'people',
  'shareLocation',
  'shareContact',
];

export const categories: Category[] = [
  'flood',
  'earthquake',
  'fire',
  'typhoon',
  'landslide',
  'storm',
  'accident',
  'informational',
  'extreme-heat',
  'tsunami',
  'medical-emergency',
  'other',
];

// Compatibility export while Phase 1 moves Naic barangays into location config.
export const barangays = getBarangayOptionsForClient('naic');
