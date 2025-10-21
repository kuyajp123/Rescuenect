import { db } from '@/lib/firebaseConfig';
import { StatusData } from '@/types/types';
import { collectionGroup, getDocs, orderBy, query } from 'firebase/firestore';
import React from 'react';
import { formatTimeSince } from '@/helper/commonHelpers';

// Transform Firebase data to table format
interface FirebaseStatusData {
  id: string;
  note: string;
  retentionUntil: any;
  lng: number;
  profileImage: string;
  parentId: string;
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

export const users = [
  {
    id: '1',
    vid: 'status-123456-v1',
    email: 'john.doe@example.com',
    profileImage: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    name: 'John Doe',
    condition: 'evacuated',
    location: 'Naic, Cavite',
    lat: 14.305580227490012,
    lng: 120.79735799230258,
    status: 'current',
    createdAt: '2 hours ago',
    expirationDuration: '24 hours',
  },
];

type User = (typeof users)[0] & {
  parentId?: string;
  originalStatus?: FirebaseStatusData;
};

const transformStatusData = (dynamicData: StatusData[]): User[] => {
  return dynamicData.map((item, index) => ({
    no: index + 1,
    id: item.uid || '',
    vid: item.versionId || '',
    email: `${item.firstName?.toLowerCase() || 'unknown'}.${item.lastName?.toLowerCase() || 'user'}@example.com`,
    profileImage: item.profileImage || '',
    name: `${item.firstName || 'Unknown'} ${item.lastName || 'User'}`,
    condition: item.condition,
    location: item.location || 'Unknown Location',
    lat: item.lat || 0,
    lng: item.lng || 0,
    status: item.statusType,
    createdAt: formatTimeSince(item.createdAt),
    expirationDuration: `${item.expirationDuration || 0} hours`,
    // Additional fields for action handlers
    parentId: item.parentId,
    originalStatus: {
      ...item,
      id: item.uid || item.versionId || '', // Add the required id property
    } as FirebaseStatusData, // Keep original for detailed actions
  }));
};

export const useLatestStatusesForHistory = () => {
  const [statuses, setStatuses] = React.useState<StatusData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchStatuses = async () => {
      setLoading(true);

      try {
        const snapshot = await getDocs(query(collectionGroup(db, 'statuses'), orderBy('createdAt', 'desc')));

        const latestStatusMap = new Map<string, StatusData>();

        // Process all statuses and keep only latest version per parentId
        snapshot.docs.forEach(doc => {
          const statusData = { id: doc.id, ...doc.data() } as unknown as StatusData;
          const parentId = statusData.parentId;

          // Check if this is the latest version for this parentId
          const existing = latestStatusMap.get(parentId);

          // Helper function to get timestamp value
          const getTimestamp = (timestamp: any): number => {
            if (!timestamp) return 0;
            if (typeof timestamp === 'string') return new Date(timestamp).getTime();
            if (timestamp.seconds) return timestamp.seconds * 1000;
            if (timestamp.toDate) return timestamp.toDate().getTime();
            return new Date(timestamp).getTime();
          };

          if (!existing || getTimestamp(statusData.createdAt) > getTimestamp(existing.createdAt)) {
            latestStatusMap.set(parentId, statusData);
          }
        });

        const latestStatuses = Array.from(latestStatusMap.values()).sort((a, b) => {
          const getTimestamp = (timestamp: any): number => {
            if (!timestamp) return 0;
            if (typeof timestamp === 'string') return new Date(timestamp).getTime();
            if (timestamp.seconds) return timestamp.seconds * 1000;
            if (timestamp.toDate) return timestamp.toDate().getTime();
            return new Date(timestamp).getTime();
          };
          return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
        });

        setStatuses(latestStatuses);
        setLoading(false);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching latest statuses:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStatuses();
  }, []);

  const transformedStatuses = React.useMemo(() => {
    return transformStatusData(statuses);
  }, [statuses]);

  return {
    statuses: transformedStatuses,
    loading,
    error,
    totalCount: transformedStatuses.length,
  };
};
