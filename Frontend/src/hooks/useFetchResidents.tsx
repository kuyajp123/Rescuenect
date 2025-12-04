import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { create } from 'zustand';
import axios from 'axios';

interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

export interface ResidentTypes {
  id: string;
  uid?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  e164PhoneNumber?: string;
  barangay?: string;
  photo?: string;
  fcmToken?: string;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
  savedLocations?: Array<{
    id: string;
    label: string;
    location: string;
    lat: number;
    lng: number;
  }>;
}

interface ResidentsState {
  residents: ResidentTypes[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  fetchResidents: () => Promise<void>;
}

export const useResidentsStore = create<ResidentsState>(set => ({
  residents: [],
  totalCount: 0,
  loading: false,
  error: null,

  fetchResidents: async () => {
    const idToken = await auth.currentUser?.getIdToken();
    set({ loading: true, error: null });
    try {
      const response = await axios.get<{ residents: ResidentTypes[] }>(API_ENDPOINTS.RESIDENTS.GET_RESIDENTS, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      // Filter out incomplete resident records (those without firstName or email)
      const validResidents = (response.data.residents || []).filter(
        (resident: ResidentTypes) => resident.firstName && resident.email
      );

      set({ residents: validResidents, totalCount: validResidents.length });
    } catch (error) {
      console.error('error fetching user:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch residents' });
    } finally {
      set({ loading: false });
    }
  },
}));
