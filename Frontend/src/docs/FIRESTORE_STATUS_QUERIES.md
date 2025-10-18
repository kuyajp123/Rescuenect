# Firestore Status Collection Queries Documentation

## Overview

This document provides comprehensive guidance on querying the status collection to retrieve all currently active statuses across all users in the disaster response app. It covers collection group queries, real-time listeners, and performance optimizations.

## Key Concepts

### Status Collection Structure

```
status (collection)
├── {userId} (document)
│   └── statuses (subcollection)
│       ├── {statusId-v1} (document) - statusType: "current" | "history" | "deleted"
│       ├── {statusId-v2} (document) - statusType: "current" | "history" | "deleted"
│       └── {statusId-v3} (document) - statusType: "current" | "history" | "deleted"
```

### User Status States

1. **User doesn't exist in status collection** → Never created a status
2. **User exists but no "current" status** → Had a status that expired/was deleted
3. **User exists with "current" status** → Has an active status

**Important**: Only users with `statusType: "current"` will appear in query results.

## 🎯 Primary Solution: Collection Group Query

### Basic Real-time Listener

```typescript
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

// Listen to ALL current statuses across all users
const listenToAllCurrentStatuses = (callback: (statuses: StatusData[]) => void) => {
  return db
    .collectionGroup('statuses') // Queries ALL 'statuses' subcollections
    .where('statusType', '==', 'current')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snapshot => {
        const currentStatuses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as StatusData[];

        console.log(`📋 Found ${currentStatuses.length} active statuses`);
        callback(currentStatuses);
      },
      error => {
        console.error('❌ Error listening to current statuses:', error);
      }
    );
};
```

### React Hook Implementation

```typescript
// Custom hook for status management
const useCurrentStatuses = () => {
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

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
          setError(null);
        },
        err => {
          console.error('Error fetching statuses:', err);
          setError(err.message);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  // Derived state for easy filtering
  const statusesByCondition = useMemo(() => {
    return {
      safe: statuses.filter(s => s.condition === 'safe'),
      evacuated: statuses.filter(s => s.condition === 'evacuated'),
      affected: statuses.filter(s => s.condition === 'affected'),
      missing: statuses.filter(s => s.condition === 'missing'),
    };
  }, [statuses]);

  return {
    statuses,
    statusesByCondition,
    loading,
    error,
    totalCount: statuses.length,
  };
};
```

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
