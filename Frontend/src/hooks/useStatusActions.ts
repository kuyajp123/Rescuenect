import { db } from '@/lib/firebaseConfig';
import { collectionGroup, getDocs, limit, orderBy, query, where } from 'firebase/firestore';

interface StatusData {
  id: string;
  parentId: string;
  uid: string;
  versionId: string;
  firstName: string;
  lastName: string;
  condition: string;
  location: string;
  profileImage: string;
  createdAt: any;
  statusType: string;
  // ... other fields
}

interface TransformedUser {
  id: string;
  parentId: string;
  name: string;
  profileImage: string;
  vid: string;
  originalStatus: any;
}

/**
 * Hook for handling History table actions
 * Provides functions for View Details, View History, and View Profile
 */
export const useStatusActions = () => {
  /**
   * View Details: Show complete latest status information for a parentId
   */
  const handleViewDetails = async (user: TransformedUser) => {
    try {
      // Fetch the specific latest status for this parentId
      const statusQuery = query(
        collectionGroup(db, 'statuses'),
        where('parentId', '==', user.parentId),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(statusQuery);
      if (!snapshot.empty) {
        const latestStatus = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };

        console.log('📋 Latest status details:', latestStatus);
        // TODO: Open details modal/page with full status information
        // openStatusDetailsModal(latestStatus);

        return latestStatus;
      }
    } catch (error) {
      console.error('❌ Error fetching status details:', error);
    }
  };

  /**
   * View History: Show all versions of a parentId status timeline
   */
  const handleViewHistory = async (user: TransformedUser) => {
    try {
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
      })) as StatusData[];

      console.log('📚 Status history:', {
        parentId: user.parentId,
        versionsCount: statusHistory.length,
        versions: statusHistory,
      });

      // TODO: Open history modal/page showing version timeline
      // openStatusHistoryModal({
      //   parentId: user.parentId,
      //   versions: statusHistory,
      //   userName: user.name
      // });

      return statusHistory;
    } catch (error) {
      console.error('❌ Error fetching status history:', error);
    }
  };

  /**
   * View User Profile: Show user's complete profile with all their parent statuses
   */
  const handleViewUserProfile = async (user: TransformedUser) => {
    try {
      // Fetch user's complete status information across all parentIds
      const userQuery = query(
        collectionGroup(db, 'statuses'),
        where('uid', '==', user.id),
        orderBy('createdAt', 'desc'),
        limit(20) // Get recent statuses for profile context
      );

      const snapshot = await getDocs(userQuery);
      const userStatuses = snapshot.docs.map(doc => doc.data()) as StatusData[];

      // Group by parentId to show distinct status timelines
      const statusesByParent = userStatuses.reduce(
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

      console.log('👤 User profile data:', {
        uid: user.id,
        name: user.name,
        totalStatuses: userStatuses.length,
        distinctParentIds: Object.keys(statusesByParent).length,
        statusesByParent,
      });

      // TODO: Open user profile modal/page
      // openUserProfileModal({
      //   uid: user.id,
      //   name: user.name,
      //   profileImage: user.profileImage,
      //   statusesByParent,
      //   recentStatuses: userStatuses.slice(0, 10)
      // });

      return {
        userStatuses,
        statusesByParent,
        totalParentIds: Object.keys(statusesByParent).length,
      };
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
    }
  };

  return {
    handleViewDetails,
    handleViewHistory,
    handleViewUserProfile,
  };
};

/**
 * Example usage in History component:
 *
 * const { handleViewDetails, handleViewHistory, handleViewUserProfile } = useStatusActions();
 *
 * const handleAction = async (key: any, user: TransformedUser) => {
 *   switch (key) {
 *     case 'details':
 *       await handleViewDetails(user);
 *       break;
 *     case 'history':
 *       await handleViewHistory(user);
 *       break;
 *     case 'user':
 *       await handleViewUserProfile(user);
 *       break;
 *   }
 * };
 */
