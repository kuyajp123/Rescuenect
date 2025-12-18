import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { StatusData } from '@/types/types';
import axios from 'axios';
import { create } from 'zustand';

export const users = [
  {
    id: '1',
    vid: 'status-123456-v1',
    email: 'john.doe@example.com',
    profileImage: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    firstName: 'John',
    lastName: 'Doe',
    condition: 'evacuated',
    location: 'Naic, Cavite',
    lat: 14.305580227490012,
    lng: 120.79735799230258,
    status: 'current',
    createdAt: '2 hours ago',
    expirationDuration: '24 hours',
  },
];

interface FirebaseStatusData {
  id: string;
  note: string;
  retentionUntil: any;
  lng: number;
  profileImage: string;
  parentId: string;
  email: string;
  phoneNumber: string;
  image?: string;
  firstName: string;
  condition: 'missing' | 'safe' | 'affected' | 'evacuated';
  expirationDuration: number;
  location: string;
  shareLocation: boolean;
  expiresAt: any;
  versionId: string;
  shareContact: boolean;
  createdAt: any;
  lastName: string;
  lat: number;
  uid: string;
  statusType: 'current' | 'history' | 'deleted';
  updatedAt?: any;
}

type User = Omit<(typeof users)[0], 'createdAt'> & {
  createdAt: any; // Allow Firestore timestamp objects for proper sorting
  parentId?: string;
  originalStatus?: FirebaseStatusData;
};

type StatusStore = {
  statuses: User[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  fetchStatusHistory: () => Promise<void>; // this replaces useEffect logic
};

const transformStatusData = (dynamicData: StatusData[]): User[] => {
  return dynamicData.map((item, index) => ({
    no: index + 1,
    id: item.uid || '',
    vid: item.versionId || '',
    email: item.email || '',
    profileImage: item.profileImage || '',
    firstName: item.firstName || 'Unknown',
    lastName: item.lastName || 'User',
    condition: item.condition,
    location: item.location || 'Unknown Location',
    lat: item.lat || 0,
    lng: item.lng || 0,
    status: item.statusType,
    createdAt: item.createdAt,
    expirationDuration: `${item.expirationDuration || 0} hours`,
    // Additional fields for action handlers
    parentId: item.parentId,
    originalStatus: {
      ...item,
      id: item.uid || item.versionId || '', // Add the required id property
    } as FirebaseStatusData, // Keep original for detailed actions
  }));
};

export const useStatusHistory = create<StatusStore>(set => ({
  statuses: [],
  loading: false,
  error: null,
  totalCount: 0,

  fetchStatusHistory: async () => {
    set({ loading: true });

    try {
      // Wait for auth to be ready
      let user = auth.currentUser;

      // If no user initially, wait for auth state to resolve
      if (!user) {
        await new Promise<void>(resolve => {
          const unsubscribe = auth.onAuthStateChanged(authUser => {
            if (authUser) {
              user = authUser;
              unsubscribe();
              resolve();
            }
          });

          // Timeout after 5 seconds
          setTimeout(() => {
            unsubscribe();
            resolve();
          }, 5000);
        });
      }

      if (!user) {
        console.error('User is not authenticated');
        set({ loading: false, error: 'Not authenticated' });
        return;
      }

      const token = await user.getIdToken();

      const response = await axios.get<{ statuses: StatusData[]; totalCount: number }>(
        API_ENDPOINTS.STATUS.GET_STATUS_HISTORY,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const transformed = transformStatusData(response.data.statuses);

      set({
        statuses: transformed,
        totalCount: response.data.totalCount,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      console.error('Error fetching status history:', err);
      set({ error: err.message, loading: false });
    }
  },
}));
