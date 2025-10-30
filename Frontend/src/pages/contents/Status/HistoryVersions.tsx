import { Map } from '@/components/ui/Map';
import { API_ENDPOINTS } from '@/config/endPoints';
import { formatTimeSince } from '@/helper/commonHelpers';
import { auth } from '@/lib/firebaseConfig';
import { useVersionHistoryStore } from '@/stores/useVersionHistoryStore';
import { Avatar, Card, CardBody, CardFooter, CardHeader, Chip } from '@heroui/react';
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

  const user = auth.currentUser;

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

  return (
    <div className="grid grid-cols-4 grid-rows-[0.2fr_1fr_1fr] gap-4 max-h-screen overflow-y-auto w-full">
      {/* Header */}
      <div className="col-span-4 flex items-center justify-center font-bold p-4">
        <div className="text-center">
          <h1 className="text-lg font-semibold">Version History</h1>
          {currentParentId && <p className="text-sm text-default-500 mt-1">Showing versions for: {currentParentId}</p>}
          {!currentParentId && <p className="text-sm text-default-500 mt-1">No status selected</p>}
        </div>
      </div>

      <div
        className="col-span-4 row-span-2 grid gap-4 px-3
        grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4"
      >
        {/* Show loading state */}
        {isLoading && (
          <div className="col-span-full flex items-center justify-center h-40">
            <p className="text-default-500">Loading version history...</p>
          </div>
        )}

        {/* Show error state */}
        {!isLoading && error && (
          <div className="col-span-full flex items-center justify-center h-40">
            <p className="text-danger">{error}</p>
          </div>
        )}

        {/* Show no parent ID selected state */}
        {!isLoading && !error && !currentParentId && versions.length === 0 && (
          <div className="col-span-full flex items-center justify-center h-40">
            <p className="text-default-500">No parent ID selected. Please select a status from the history page.</p>
          </div>
        )}

        {/* Show no versions found state */}
        {!isLoading && !error && currentParentId && versions.length === 0 && (
          <div className="col-span-full flex items-center justify-center h-40">
            <p className="text-default-500">No versions found for this status.</p>
          </div>
        )}

        {/* Show versions when we have data */}
        {!isLoading &&
          !error &&
          versions.length > 0 &&
          versions.map(version => (
            //   <div key={card.id} className="border h-80 rounded p-4 text-center">
            //     {card.name}
            //   </div>
            <Card className="py-4 h-80 rounded-lg" key={version.versionId}>
              <CardHeader className="justify-between">
                <div className="flex gap-5">
                  <Avatar radius="full" size="md" src={version.profileImage} />
                  <div className="flex flex-col gap-1 items-start justify-center">
                    <h4 className="text-small font-semibold leading-none text-default-600">
                      {version.firstName} {version.lastName}
                    </h4>
                    <p className="text-xs text-default-500">{version.location}</p>
                    <p className="text-xs text-default-400">{formatTimeSince(version.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  {version.condition === 'safe' && (
                    <Chip color="success" className="text-white">
                      Safe
                    </Chip>
                  )}
                  {version.condition === 'evacuated' && (
                    <Chip color="primary" className="text-white">
                      Evacuated
                    </Chip>
                  )}
                  {version.condition === 'affected' && (
                    <Chip color="warning" className="text-white">
                      Affected
                    </Chip>
                  )}
                  {version.condition === 'missing' && (
                    <Chip color="danger" className="text-white">
                      Missing
                    </Chip>
                  )}
                </div>
              </CardHeader>
              <CardBody className="min-h-[200px] max-h-[200px] gap-2 overflow-y-auto">
                <div className="flex flex-col gap-2 h-full">
                  <p className="text-sm text-default-600">{version.note || ''}</p>
                  <div className="flex-1 min-h-[150px]">
                    <Map
                      data={
                        version.location
                          ? [
                              {
                                uid: version.versionId,
                                condition: version.condition as 'safe' | 'evacuated' | 'affected' | 'missing',
                                lat: version.lat,
                                lng: version.lng,
                              },
                            ]
                          : []
                      }
                      center={[version.lat, version.lng]}
                      hasMapControl={false}
                      hasMapStyleSelector={false}
                      dragging={false}
                      zoomControl={false}
                      attribution=""
                    />
                  </div>
                </div>
              </CardBody>
              <CardFooter className="gap-3">
                <div className="flex gap-1">
                  <p className="text-default-400 text-small">{version.versionId}</p>
                </div>
              </CardFooter>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default HistoryVersions;
