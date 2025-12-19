import { UnifiedStatusCard } from '@/components/ui/card/StatusCard/UnifiedStatusCard';
import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { usePanelStore } from '@/stores/panelStore';
import { useVersionHistoryStore } from '@/stores/useVersionHistoryStore';
import { StatusDataCard } from '@/types/types';
import { Card, CardBody, Skeleton } from '@heroui/react';
import axios from 'axios';
import { useEffect } from 'react';

const HistoryVersions = () => {
  const currentParentId = useVersionHistoryStore(state => state.currentParentId);
  const uid = useVersionHistoryStore(state => state.uid);
  const versions = useVersionHistoryStore(state => state.versions);
  const isLoading = useVersionHistoryStore(state => state.isLoading);
  const error = useVersionHistoryStore(state => state.error);
  const setVersions = useVersionHistoryStore(state => state.setVersions);
  const setLoading = useVersionHistoryStore(state => state.setLoading);
  const setError = useVersionHistoryStore(state => state.setError);
  const resetData = useVersionHistoryStore(state => state.resetData);
  const { openStatusHistoryPanel, closePanel, setSelectedUser, isOpen } = usePanelStore();

  const user = auth.currentUser;

  const gridClasses = isOpen
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  useEffect(() => {
    return () => {
      closePanel();
      setSelectedUser(null);
    };
  }, [closePanel, setSelectedUser]);

  useEffect(() => {
    const fetchVersionHistory = async () => {
      // Check if we have a parent ID to fetch versions for
      if (!currentParentId) {
        console.warn('No parent ID provided for version history');
        return;
      }

      const token = await user?.getIdToken();

      if (!token) {
        console.error('User is not authenticated');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = { parentId: currentParentId, uid: uid };

        const response = await axios.get(API_ENDPOINTS.STATUS.GET_VERSIONS, {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Handle both old and new response formats
        const versions = (response.data as any).versions || response.data || [];
        setVersions(versions);
      } catch (error: any) {
        console.error('Error fetching version history:', error);

        // More detailed error handling
        let errorMessage = 'Failed to fetch version history';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        console.error('Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchVersionHistory();

    // Cleanup on unmount
    return () => {
      resetData();
    };
  }, [currentParentId, setVersions, setLoading, setError, resetData]);

  const getStatusTypeColor = (statusType: string) => {
    switch (statusType) {
      case 'current':
        return 'success';
      case 'history':
        return 'warning';
      case 'resolved':
        return 'primary';
      default:
        return 'danger';
    }
  };

  return (
    <div className="max-h-screen overflow-y-auto w-full">
      {/* Header */}
      <div className="col-span-4 flex font-bold p-4">
        <div>
          <p className="text-3xl font-bold mb-2">Version History</p>
          {currentParentId && (
            <div className="flex gap-4">
              <p className="text-sm text-default-500">Parent ID: {currentParentId}</p>{' '}
              <p className={`text-${getStatusTypeColor(versions[0]?.statusType)}`}>
                {versions[0]?.statusType.toUpperCase()}
              </p>
            </div>
          )}
          {!currentParentId && <p className="text-sm text-default-500 mt-1">No status selected</p>}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className={`grid gap-4 pb-6 px-4 ${gridClasses}`}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardBody>
                <div className="flex flex-col items-start">
                  <Skeleton className="w-16 h-16 rounded-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center p-12">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Versions Grid */}
      {!isLoading && !error && versions.length > 0 && (
        <div className={`grid gap-4 pb-6 px-4 ${gridClasses}`}>
          {versions.map(version => (
            <UnifiedStatusCard
              key={version.versionId}
              data={version as unknown as StatusDataCard}
              mode="versionHistory"
              onViewDetails={() => {
                openStatusHistoryPanel(version as any);
              }}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && versions.length === 0 && currentParentId && (
        <div className="flex flex-col items-center justify-center p-12">
          <p className="text-gray-500 text-lg">No version history found</p>
          <p className="text-gray-400 text-sm mt-2">This status has no previous versions.</p>
        </div>
      )}

      {/* No Selection State */}
      {!isLoading && !error && !currentParentId && (
        <div className="flex flex-col items-center justify-center p-12">
          <p className="text-gray-500 text-lg">No status selected</p>
          <p className="text-gray-400 text-sm mt-2">Select a status to view its version history.</p>
        </div>
      )}
    </div>
  );
};

export default HistoryVersions;
