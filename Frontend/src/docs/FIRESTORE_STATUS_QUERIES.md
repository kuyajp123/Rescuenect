# Firestore Status Collection Queries Documentation

## Overview

This document provides comprehensive guidance on querying the status collection to retrieve the latest status version for each parent status across all users in the disaster response app. The History table displays the most recent status version per `parentId`, while individual status histories are fetched when viewing details.

## Key Concepts

### Status Collection Structure

```
status (collection)
├── {userId} (document)
│   └── statuses (subcollection)
│       ├── {parentId-v1} (document) - Original status
│       ├── {parentId-v2} (document) - Updated version
│       ├── {parentId-v3} (document) - Latest version
│       ├── {newParentId-v1} (document) - New status after deletion
│       └── {newParentId-v2} (document) - Updated new status
```

### Status Version Logic

1. **parentId Groups**: Each `parentId` represents a unique status timeline
2. **Version Evolution**: v1 → v2 → v3 (same parentId, different versions)
3. **New Status Creation**: Creates new `parentId` when user deletes and creates fresh status
4. **Latest Status Display**: Show only the highest version number for each `parentId`

**Key Requirement**: Display latest version of each `parentId` per user in the History table.

## 🎯 Primary Solution: Latest Status Per Parent Query

### Basic Real-time Listener for History Table

```typescript
import { db } from '@/lib/firebaseConfig';
import { collection, query, orderBy, onSnapshot, QuerySnapshot } from 'firebase/firestore';

// Listen to ALL status versions and filter for latest per parentId
const listenToLatestStatusPerParent = (callback: (statuses: StatusData[]) => void) => {
  return db
    .collectionGroup('statuses') // Queries ALL 'statuses' subcollections
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snapshot => {
        const latestStatusMap = new Map<string, StatusData>();

        // Process all statuses and keep only latest version per parentId
        snapshot.docs.forEach(doc => {
          const statusData = { id: doc.id, ...doc.data() } as StatusData;
          const parentId = statusData.parentId;

          // Check if this is the latest version for this parentId
          const existing = latestStatusMap.get(parentId);
          if (!existing || statusData.createdAt > existing.createdAt) {
            latestStatusMap.set(parentId, statusData);
          }
        });

        const latestStatuses = Array.from(latestStatusMap.values()).sort(
          (a, b) => b.createdAt.seconds - a.createdAt.seconds
        );

        console.log(`📋 Found ${latestStatuses.length} latest statuses across all parent IDs`);
        callback(latestStatuses);
      },
      error => {
        console.error('❌ Error listening to latest statuses:', error);
      }
    );
};
```

### React Hook for History Table

```typescript
// Custom hook for History table data
const useLatestStatusesForHistory = () => {
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = db
      .collectionGroup('statuses')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snapshot => {
          const latestStatusMap = new Map<string, StatusData>();

          // Process all statuses and keep only latest version per parentId
          snapshot.docs.forEach(doc => {
            const statusData = { id: doc.id, ...doc.data() } as StatusData;
            const parentId = statusData.parentId;

            // Check if this is the latest version for this parentId
            const existing = latestStatusMap.get(parentId);
            if (!existing || statusData.createdAt.seconds > existing.createdAt.seconds) {
              latestStatusMap.set(parentId, statusData);
            }
          });

          const latestStatuses = Array.from(latestStatusMap.values()).sort(
            (a, b) => b.createdAt.seconds - a.createdAt.seconds
          );

          setStatuses(latestStatuses);
          setLoading(false);
          setError(null);
        },
        err => {
          console.error('Error fetching latest statuses:', err);
          setError(err.message);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  // Transform data for History table compatibility
  const transformedStatuses = useMemo(() => {
    return statuses.map(status => ({
      id: status.uid, // Use uid as unique identifier for table
      vid: status.versionId,
      email: `${status.firstName?.toLowerCase()}.${status.lastName?.toLowerCase()}@example.com`,
      profileImage: status.profileImage,
      name: `${status.firstName} ${status.lastName}`,
      condition: status.condition,
      location: status.location,
      lat: status.lat,
      lng: status.lng,
      status: status.statusType === 'current' ? 'current' : 'history',
      createdAt: formatTimeSince(status.createdAt),
      expirationDuration: `${status.expirationDuration} hours`,
      parentId: status.parentId, // Keep parentId for history viewing
    }));
  }, [statuses]);

  return {
    statuses: transformedStatuses,
    loading,
    error,
    totalCount: transformedStatuses.length,
  };
};
```

## 🔍 Action Handlers for History Table

### 1. View Details Handler

```typescript
const handleViewDetails = async (user: TransformedUser) => {
  // Fetch the specific latest status for this parentId
  const statusQuery = query(
    collectionGroup(db, 'statuses'),
    where('parentId', '==', user.parentId),
    orderBy('createdAt', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(statusQuery);
  const latestStatus = snapshot.docs[0]?.data();

  // Open details modal/page with full status information
  openStatusDetailsModal(latestStatus);
};
```

### 2. View History Handler

```typescript
const handleViewHistory = async (user: TransformedUser) => {
  // Fetch ALL versions of this parentId status
  const historyQuery = query(
    collectionGroup(db, 'statuses'),
    where('parentId', '==', user.parentId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(historyQuery);
  const statusHistory = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Open history modal/page showing version timeline
  openStatusHistoryModal({
    parentId: user.parentId,
    versions: statusHistory,
    userName: user.name,
  });
};
```

### 3. View User Profile Handler

```typescript
const handleViewUserProfile = async (user: TransformedUser) => {
  // Fetch user's complete profile information
  const userQuery = query(
    collectionGroup(db, 'statuses'),
    where('uid', '==', user.id),
    orderBy('createdAt', 'desc'),
    limit(10) // Get recent statuses for profile context
  );

  const snapshot = await getDocs(userQuery);
  const userStatuses = snapshot.docs.map(doc => doc.data());

  // Open user profile modal/page
  openUserProfileModal({
    uid: user.id,
    name: user.name,
    profileImage: user.profileImage,
    recentStatuses: userStatuses,
  });
};
```

## 📄 Advanced Queries for History Features

### Get All Versions of Specific Parent Status

```typescript
const getStatusHistory = async (parentId: string): Promise<StatusData[]> => {
  const historyQuery = query(
    collectionGroup(db, 'statuses'),
    where('parentId', '==', parentId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(historyQuery);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as StatusData[];
};
```

### Get User's All Parent Statuses

```typescript
const getUserAllStatuses = async (uid: string): Promise<Record<string, StatusData[]>> => {
  const userQuery = query(collectionGroup(db, 'statuses'), where('uid', '==', uid), orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(userQuery);
  const allStatuses = snapshot.docs.map(doc => doc.data()) as StatusData[];

  // Group by parentId
  const groupedByParent = allStatuses.reduce(
    (acc, status) => {
      const parentId = status.parentId;
      if (!acc[parentId]) {
        acc[parentId] = [];
      }
      acc[parentId].push(status);
      return acc;
    },
    {} as Record<string, StatusData[]>
  );

  return groupedByParent;
};
```

## 🔄 Status Type Filtering for History Table

### Filter by Status Type (Current/History)

```typescript
const useFilteredStatusHistory = (statusTypeFilter: 'current' | 'history' | 'all' = 'all') => {
  const { statuses, loading, error } = useLatestStatusesForHistory();

  const filteredStatuses = useMemo(() => {
    if (statusTypeFilter === 'all') return statuses;

    return statuses.filter(status => {
      if (statusTypeFilter === 'current') {
        return status.status === 'current';
      } else {
        return status.status === 'history';
      }
    });
  }, [statuses, statusTypeFilter]);

  return { statuses: filteredStatuses, loading, error };
};
```

## 📋 Data Transformation for History Table

### Complete Transformation Function

```typescript
// Helper function to format Firestore timestamp
const formatTimeSince = (timestamp: any): string => {
  if (!timestamp) return 'Unknown';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
  const now = new Date();
  const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hours ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Transform Firebase data to History table format
const transformStatusForTable = (statuses: StatusData[]): TransformedUser[] => {
  return statuses.map(status => ({
    id: status.uid, // Table row identifier
    vid: status.versionId,
    email: `${status.firstName?.toLowerCase()}.${status.lastName?.toLowerCase()}@example.com`,
    profileImage: status.profileImage,
    name: `${status.firstName} ${status.lastName}`,
    condition: status.condition as 'safe' | 'evacuated' | 'affected' | 'missing',
    location: status.location,
    lat: status.lat,
    lng: status.lng,
    status: status.statusType === 'current' ? 'current' : 'history',
    createdAt: formatTimeSince(status.createdAt),
    expirationDuration: `${status.expirationDuration} hours`,

    // Additional fields for action handlers
    parentId: status.parentId,
    uid: status.uid,
    originalStatus: status, // Keep original for detailed actions
  }));
};
```

## 🚀 Integration with History Component

### Updated History Component

```typescript
// History.tsx integration
import { useLatestStatusesForHistory } from '@/hooks/useLatestStatusesForHistory';

export const StatusHistory = () => {
  // Get real-time data instead of static users array
  const { statuses: firebaseStatuses, loading: firebaseLoading } = useLatestStatusesForHistory();

  // Use Firebase data instead of static data
  const users = useMemo(() => firebaseStatuses, [firebaseStatuses]);

  const [isLoading, setIsLoading] = useState(firebaseLoading);

  useEffect(() => {
    setIsLoading(firebaseLoading);
  }, [firebaseLoading]);

  // Updated action handlers
  const handleAction = async (key: any, user: TransformedUser) => {
    switch (key) {
      case 'details':
        await handleViewDetails(user);
        break;
      case 'history':
        await handleViewHistory(user);
        break;
      case 'user':
        await handleViewUserProfile(user);
        break;
    }
  };

  // Rest of component remains the same...
};
```

## 🔍 Required Firestore Indexes

### Optimized Indexes for New Query Pattern

```
Collection Group: statuses

Required Indexes:
1. parentId (ASC) + createdAt (DESC)
2. uid (ASC) + createdAt (DESC)
3. statusType (ASC) + createdAt (DESC)
4. condition (ASC) + createdAt (DESC)
5. parentId (ASC) + statusType (ASC) + createdAt (DESC)
```

## 📊 Performance Considerations

### Efficient Latest Status Query

```typescript
// Optimized query with client-side filtering for better performance
const useOptimizedLatestStatuses = () => {
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get all statuses ordered by creation time
    const unsubscribe = onSnapshot(query(collectionGroup(db, 'statuses'), orderBy('createdAt', 'desc')), snapshot => {
      const statusMap = new Map<string, StatusData>();

      // Client-side filtering for latest per parentId
      snapshot.docs.forEach(doc => {
        const data = { id: doc.id, ...doc.data() } as StatusData;
        const existing = statusMap.get(data.parentId);

        if (!existing || data.createdAt.seconds > existing.createdAt.seconds) {
          statusMap.set(data.parentId, data);
        }
      });

      setStatuses(Array.from(statusMap.values()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { statuses, loading };
};
```

## 📋 Summary

### What the History Table Shows

✅ **Latest version of each parentId per user**  
✅ **Real-time updates when users create/update statuses**  
✅ **Multiple entries per user if they have multiple parent statuses**  
✅ **Proper filtering by condition, status type, and search**

### Action Button Behaviors

- **View Details**: Shows complete latest status information
- **View History**: Shows all versions of that specific parentId timeline
- **View User**: Shows user profile with all their parent statuses

### Key Benefits

- **Accurate representation**: Shows user's current status landscape
- **Efficient querying**: Single collection group query with client filtering
- **Real-time updates**: Automatic updates when statuses change
- **Flexible history**: Detailed version tracking per parent status

This approach ensures your History table displays the most relevant and up-to-date status information while maintaining the ability to drill down into complete status histories when needed.

## 🔍 Advanced Filtering Options

### 1. Filter by Condition

```typescript
// Get only missing persons
const listenToMissingPersons = (callback: (statuses: StatusData[]) => void) => {
  return db
    .collectionGroup('statuses')
    .where('statusType', '==', 'current')
    .where('condition', '==', 'missing')
    .orderBy('createdAt', 'desc')
    .onSnapshot(callback);
};

// Get safe and evacuated statuses
const listenToSafeStatuses = (callback: (statuses: StatusData[]) => void) => {
  return db
    .collectionGroup('statuses')
    .where('statusType', '==', 'current')
    .where('condition', 'in', ['safe', 'evacuated'])
    .orderBy('createdAt', 'desc')
    .onSnapshot(callback);
};
```

### 2. Filter by Location Sharing

```typescript
// Get statuses with shared location
const listenToStatusesWithLocation = (callback: (statuses: StatusData[]) => void) => {
  return db
    .collectionGroup('statuses')
    .where('statusType', '==', 'current')
    .where('shareLocation', '==', true)
    .orderBy('createdAt', 'desc')
    .onSnapshot(callback);
};
```

### 3. Real-time Status Counts

```typescript
interface StatusCounts {
  safe: number;
  evacuated: number;
  affected: number;
  missing: number;
  total: number;
}

const listenToStatusCounts = (callback: (counts: StatusCounts) => void) => {
  return db
    .collectionGroup('statuses')
    .where('statusType', '==', 'current')
    .onSnapshot(snapshot => {
      const counts: StatusCounts = {
        safe: 0,
        evacuated: 0,
        affected: 0,
        missing: 0,
        total: snapshot.size,
      };

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const condition = data.condition as keyof Omit<StatusCounts, 'total'>;
        if (counts.hasOwnProperty(condition)) {
          counts[condition]++;
        }
      });

      callback(counts);
    });
};
```

## 📄 Pagination for Large Datasets

### Basic Pagination

```typescript
const listenToCurrentStatusesPaginated = (
  pageSize: number = 50,
  callback: (statuses: StatusData[], hasMore: boolean) => void
) => {
  return db
    .collectionGroup('statuses')
    .where('statusType', '==', 'current')
    .orderBy('createdAt', 'desc')
    .limit(pageSize)
    .onSnapshot(snapshot => {
      const statuses = snapshot.docs.map(doc => doc.data()) as StatusData[];
      const hasMore = snapshot.docs.length === pageSize;

      callback(statuses, hasMore);
    });
};
```

### Advanced Pagination with Cursor

```typescript
const usePaginatedStatuses = (pageSize: number = 20) => {
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    let query = db
      .collectionGroup('statuses')
      .where('statusType', '==', 'current')
      .orderBy('createdAt', 'desc')
      .limit(pageSize);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    try {
      const snapshot = await query.get();
      const newStatuses = snapshot.docs.map(doc => doc.data()) as StatusData[];

      setStatuses(prev => [...prev, ...newStatuses]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === pageSize);
    } catch (error) {
      console.error('Error loading more statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  return { statuses, loading, hasMore, loadMore };
};
```

## 🚀 Performance Optimizations

### Required Firestore Indexes

You need to create these composite indexes in Firebase Console:

```
Collection Group: statuses

Required Indexes:
1. statusType (ASC) + createdAt (DESC)
2. statusType (ASC) + condition (ASC) + createdAt (DESC)
3. statusType (ASC) + shareLocation (ASC) + createdAt (DESC)
4. statusType (ASC) + condition (IN) + createdAt (DESC)
```

### Creating Indexes

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes**
4. Click **Create Index**
5. Set **Collection Group** to `statuses`
6. Add the field combinations listed above

### Query Performance Tips

```typescript
// ✅ GOOD: Efficient query with proper index
const efficientQuery = db
  .collectionGroup('statuses')
  .where('statusType', '==', 'current')
  .where('condition', '==', 'missing')
  .orderBy('createdAt', 'desc')
  .limit(50);

// ❌ AVOID: Too many filters without proper index
const inefficientQuery = db
  .collectionGroup('statuses')
  .where('statusType', '==', 'current')
  .where('condition', '==', 'missing')
  .where('shareLocation', '==', true)
  .where('shareContact', '==', true) // Too many equality filters
  .orderBy('createdAt', 'desc');
```

## 📱 Component Integration Examples

### Status Dashboard Component

```typescript
// StatusDashboard.tsx
import { useCurrentStatuses } from '@/hooks/useCurrentStatuses';

const StatusDashboard = () => {
  const { statuses, statusesByCondition, loading, totalCount } = useCurrentStatuses();

  if (loading) {
    return <div className="loading">Loading current statuses...</div>;
  }

  return (
    <div className="status-dashboard">
      <div className="status-summary">
        <h2>Current Emergency Status ({totalCount} active)</h2>
        <div className="counts-grid">
          <div className="count-card safe">
            <span className="label">Safe</span>
            <span className="number">{statusesByCondition.safe.length}</span>
          </div>
          <div className="count-card evacuated">
            <span className="label">Evacuated</span>
            <span className="number">{statusesByCondition.evacuated.length}</span>
          </div>
          <div className="count-card affected">
            <span className="label">Affected</span>
            <span className="number">{statusesByCondition.affected.length}</span>
          </div>
          <div className="count-card missing">
            <span className="label">Missing</span>
            <span className="number">{statusesByCondition.missing.length}</span>
          </div>
        </div>
      </div>

      <div className="status-list">
        {statuses.map(status => (
          <StatusCard
            key={status.versionId}
            {...status}
          />
        ))}
      </div>
    </div>
  );
};
```

### Missing Persons Component

```typescript
// MissingPersons.tsx
const MissingPersons = () => {
  const [missingPersons, setMissingPersons] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToMissingPersons((persons) => {
      setMissingPersons(persons);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="missing-persons">
      <h2>Missing Persons ({missingPersons.length})</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="persons-grid">
          {missingPersons.map(person => (
            <MissingPersonCard key={person.versionId} {...person} />
          ))}
        </div>
      )}
    </div>
  );
};
```

## 🔄 Real-time Updates

### Handling Real-time Changes

```typescript
const useRealtimeStatusUpdates = () => {
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = db
      .collectionGroup('statuses')
      .where('statusType', '==', 'current')
      .orderBy('updatedAt', 'desc')
      .onSnapshot(snapshot => {
        // Track document changes
        const changes = snapshot.docChanges();
        const newUpdates: string[] = [];

        changes.forEach(change => {
          if (change.type === 'added') {
            console.log('📝 New status:', change.doc.data());
            newUpdates.push(`New status from ${change.doc.data().firstName}`);
          }
          if (change.type === 'modified') {
            console.log('✏️ Status updated:', change.doc.data());
            newUpdates.push(`${change.doc.data().firstName} updated their status`);
          }
          if (change.type === 'removed') {
            console.log('🗑️ Status removed:', change.doc.data());
            newUpdates.push(`${change.doc.data().firstName} removed their status`);
          }
        });

        // Update statuses
        const currentStatuses = snapshot.docs.map(doc => doc.data()) as StatusData[];
        setStatuses(currentStatuses);

        // Add recent updates
        if (newUpdates.length > 0) {
          setRecentUpdates(prev => [...newUpdates, ...prev].slice(0, 10));
        }
      });

    return () => unsubscribe();
  }, []);

  return { statuses, recentUpdates };
};
```

## 🛠️ Error Handling

### Robust Error Handling

```typescript
const useStatusesWithErrorHandling = () => {
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const setupListener = useCallback(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = db
      .collectionGroup('statuses')
      .where('statusType', '==', 'current')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snapshot => {
          const currentStatuses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as StatusData[];

          setStatuses(currentStatuses);
          setLoading(false);
          setRetryCount(0); // Reset retry count on success
        },
        err => {
          console.error('Error fetching statuses:', err);
          setError(err.message);
          setLoading(false);

          // Auto-retry with exponential backoff
          if (retryCount < 3) {
            setTimeout(
              () => {
                setRetryCount(prev => prev + 1);
                setupListener();
              },
              Math.pow(2, retryCount) * 1000
            ); // 1s, 2s, 4s delays
          }
        }
      );

    return unsubscribe;
  }, [retryCount]);

  useEffect(() => {
    const unsubscribe = setupListener();
    return () => unsubscribe?.();
  }, [setupListener]);

  const retry = () => {
    setRetryCount(0);
    setupListener();
  };

  return { statuses, loading, error, retry };
};
```

## 📋 Summary

### What Gets Returned

✅ **Users with active status** (`statusType: 'current'`)  
❌ **Users with expired status** (`statusType: 'history'`)  
❌ **Users with deleted status** (`statusType: 'deleted'`)  
❌ **Users who never created a status** (no documents)

### Key Benefits

- **Real-time updates** across all users
- **Efficient querying** with collection group queries
- **Automatic filtering** of inactive statuses
- **Scalable pagination** for large datasets
- **Performance optimized** with proper indexing

### Next Steps

1. Create the required Firestore indexes
2. Implement the `useCurrentStatuses` hook
3. Add error handling and retry logic
4. Set up real-time notifications for status changes
5. Implement pagination for better performance

---

**Note**: Remember to test your queries with the Firebase Emulator during development to avoid unnecessary read costs.
