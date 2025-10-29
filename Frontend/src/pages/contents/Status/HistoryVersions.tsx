import { Map } from '@/components/ui/Map';
import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { useVersionHistoryStore, VersionHistoryState } from '@/stores/useVersionHistoryStore';
import { Avatar, Button, Card, CardBody, CardFooter, CardHeader } from '@heroui/react';
import axios from 'axios';
import { useEffect } from 'react';

const HistoryVersions = () => {
  const { currentParentId, versions, isLoading, error, setVersions, setLoading, setError, resetData } =
    useVersionHistoryStore();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchVersionHistory = async () => {
      // Check if we have a parent ID to fetch versions for
      if (!currentParentId) {
        console.warn('No parent ID provided for version history');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching versions for parent ID: ${currentParentId}`);
        const response = await axios.get(API_ENDPOINTS.STATUS.GET_VERSIONS(currentParentId), {
          headers: {
            Authorization: `Bearer ${await user?.getIdToken()}`,
          },
        });

        console.log('Version history response:', response.data);
        const data = response.data as VersionHistoryState;
        setVersions(data.versions || data || []);
      } catch (error) {
        console.error('Error fetching version history:', error);
        setError('Failed to fetch version history');
      } finally {
        setLoading(false);
      }
    };

    fetchVersionHistory();

    // Cleanup on unmount
    // return () => {
    //   resetData();
    // };
  }, [currentParentId, setVersions, setLoading, setError, resetData]);

  return (
    <div className="grid grid-cols-4 grid-rows-[0.2fr_1fr_1fr] gap-4 max-h-screen overflow-y-auto w-full">
      {/* Header */}
      <div className="col-span-4 border flex items-center justify-center font-bold p-4">
        <div className="text-center">
          <h1 className="text-lg font-semibold">Version History</h1>
          {currentParentId && <p className="text-sm text-default-500 mt-1">Showing versions for: {currentParentId}</p>}
          {!currentParentId && <p className="text-sm text-default-500 mt-1">No status selected</p>}
        </div>
      </div>

      {/* Cards container */}
      <div
        className="col-span-4 row-span-2 grid gap-4 px-3
        grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4"
      >
        {isLoading && (
          <div className="col-span-full flex items-center justify-center h-40">
            <p className="text-default-500">Loading version history...</p>
          </div>
        )}

        {error && (
          <div className="col-span-full flex items-center justify-center h-40">
            <p className="text-danger">{error}</p>
          </div>
        )}

        {!isLoading && !error && !currentParentId && (
          <div className="col-span-full flex items-center justify-center h-40">
            <p className="text-default-500">No parent ID selected. Please select a status from the history page.</p>
          </div>
        )}

        {!isLoading && !error && versions.length === 0 && currentParentId && (
          <div className="col-span-full flex items-center justify-center h-40">
            <p className="text-default-500">No versions found for this status.</p>
          </div>
        )}

        {versions.map((version, index) => (
          //   <div key={card.id} className="border h-80 rounded p-4 text-center">
          //     {card.name}
          //   </div>
          <Card className="py-4 h-80 rounded-lg" key={version.versionId}>
            <CardHeader className="justify-between">
              <div className="flex gap-5">
                <Avatar
                  isBordered
                  radius="full"
                  size="md"
                  src={version.userPhoto || 'https://heroui.com/avatars/avatar-1.png'}
                />
                <div className="flex flex-col gap-1 items-start justify-center">
                  <h4 className="text-small font-semibold leading-none text-default-600">Version {index + 1}</h4>
                  <p className="text-xs text-default-500">
                    {version.location ? `${version.location.lat}, ${version.location.lng}` : 'Location not available'}
                  </p>
                  {version.createdAt && (
                    <p className="text-xs text-default-400">{new Date(version.createdAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
              <Button
                className="bg-transparent text-foreground border-default-200"
                color="primary"
                radius="full"
                size="sm"
                variant="bordered"
                onClick={() => console.log('View version:', version.versionId)}
              >
                View
              </Button>
            </CardHeader>
            <CardBody className="py-2 min-h-[200px] max-h-[200px] gap-2 overflow-y-auto">
              <div className="flex flex-col gap-2 h-full">
                <p className="text-sm text-default-600">
                  {version.description || version.message || 'No description available'}
                </p>
                <div className="flex-1 min-h-[150px]">
                  <Map
                    data={
                      version.location
                        ? [
                            {
                              uid: version.versionId,
                              condition: version.condition || 'safe',
                              lat: version.location.lat,
                              lng: version.location.lng,
                            },
                          ]
                        : []
                    }
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
                <p className="font-semibold text-default-400 text-small">ID:</p>
                <p className="text-default-400 text-small">{version.versionId.slice(0, 8)}...</p>
              </div>
              <div className="flex gap-1">
                <p className="font-semibold text-default-400 text-small">Parent:</p>
                <p className="text-default-400 text-small">{version.parentId.slice(0, 8)}...</p>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HistoryVersions;
