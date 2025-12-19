import { StatusCard } from '@/components/ui/card/StatusCard';
import { Map } from '@/components/ui/Map';
import { parseCategory } from '@/helper/commonHelpers';
import { Card, CardBody, CardHeader, Chip, Image, User } from '@heroui/react';
import { MapPin, Phone, Users } from 'lucide-react';

export const StatusPanel = ({ data }: { data: any }) => {
  // Helper function to format timestamps
  const formatTimestamp = (
    timestamp: { _seconds?: number; _nanoseconds?: number; seconds?: number; nanoseconds?: number } | string | undefined
  ) => {
    if (!timestamp) return 'N/A';

    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleString();
    }

    const seconds = timestamp._seconds || timestamp.seconds || 0;
    const date = new Date(seconds * 1000);
    return date.toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Helper function to get condition color
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'safe':
        return 'success';
      case 'evacuated':
        return 'primary';
      case 'affected':
        return 'warning';
      case 'missing':
        return 'danger';
      default:
        return 'default';
    }
  };

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
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <div className="shrink-0 h-[250px] relative">
        <div className="h-full rounded-lg overflow-hidden">
          {data?.type === 'status' && data.data ? (
            <Map
              key={`map-status-${data.data.id}`}
              data={[
                {
                  uid: data.data.id,
                  lat: data.data.lat,
                  lng: data.data.lng,
                  condition: data.data.condition,
                },
              ]}
              center={[data.data.lat, data.data.lng]}
              hasMapStyleSelector={false}
              zoomControl={false}
              dragging={false}
              hasMapControl={true}
              zoom={15}
              attribution=""
              markerType="status"
            />
          ) : data?.type === 'residentProfile' &&
            data.data &&
            data.data.lat &&
            data.data.lng &&
            data.data.shareLocation ? (
            <Map
              key={`map-residentProfile-${data.data.id || data.data.parentId}`}
              data={[
                {
                  uid: data.data.id || data.data.parentId,
                  lat: data.data.lat,
                  lng: data.data.lng,
                  condition: data.data.condition,
                },
              ]}
              center={[data.data.lat, data.data.lng]}
              hasMapStyleSelector={false}
              zoomControl={false}
              dragging={false}
              hasMapControl={true}
              zoom={15}
              attribution=""
              markerType="status"
            />
          ) : data?.type === 'statusHistory' &&
            data.data &&
            data.data.lat &&
            data.data.lng &&
            data.data.shareLocation ? (
            <Map
              key={`map-statusHistory-${data.data.id || data.data.versionId}`}
              data={[
                {
                  uid: data.data.id || data.data.versionId,
                  lat: data.data.lat,
                  lng: data.data.lng,
                  condition: data.data.condition,
                },
              ]}
              center={[data.data.lat, data.data.lng]}
              hasMapStyleSelector={false}
              zoomControl={false}
              dragging={false}
              hasMapControl={true}
              zoom={15}
              attribution=""
              markerType="status"
            />
          ) : (
            <Map
              key="map-default"
              data={[]}
              center={[14.2965, 120.7925]}
              hasMapStyleSelector={false}
              zoomControl={false}
              dragging={false}
              hasMapControl={true}
              zoom={13}
              attribution=""
              markerType="default"
            />
          )}
        </div>
      </div>

      {/* Status Card Section */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {data?.type === 'status' && data.data ? (
          <StatusCard
            className="h-fit max-h-[500px]"
            uid={data.data.id}
            profileImage={data.data.profileImage}
            firstName={data.data.firstName}
            lastName={data.data.lastName}
            phoneNumber={data.data.phoneNumber || ''}
            condition={data.data.condition}
            location={data.data.location}
            note={data.data.originalStatus?.note || ''}
            image={data.data.originalStatus?.image}
            expiresAt={data.data.originalStatus?.expiresAt}
            createdAt={data.data.originalStatus?.createdAt}
            vid={data.data.vid}
            category={data.data.category}
            people={data.data.people}
          />
        ) : data?.type === 'residentProfile' && data.data ? (
          <div className="space-y-4">
            {/* Status Info Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col w-full gap-2">
                  <div className="flex justify-between items-start">
                    <User
                      name={`${data.data.firstName} ${data.data.lastName}`}
                      description={formatTimestamp(data.data.createdAt)}
                      avatarProps={{ src: data.data.profileImage }}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <p className={`font-bold text-${getStatusTypeColor(data.data.statusType)}`}>
                      {data.data.statusType.toUpperCase()}
                    </p>
                    <Chip size="sm" variant="flat" color={getConditionColor(data.data.condition)}>
                      {data.data.condition.toUpperCase()}
                    </Chip>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                {data.data.image && data.data.image.trim() !== '' && (
                  <div className="w-full overflow-hidden rounded-lg">
                    <Image src={data.data.image} alt="Status" className="w-full object-cover" />
                  </div>
                )}

                {data.data.note && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Note:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{data.data.note}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">People</p>
                      <p className="text-sm font-semibold">{data.data.people}</p>
                    </div>
                  </div>

                  {data.data.shareContact && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Contact</p>
                        <p className="text-sm font-semibold">{data.data.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                </div>

                {data.data.location && (
                  <div className="flex items-start gap-2 pt-2 border-t">
                    <MapPin size={16} className="text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-sm">{data.data.location}</p>
                      {data.data.shareLocation && data.data.lat && data.data.lng && (
                        <p className="text-xs text-gray-400 mt-1">
                          {data.data.lat.toFixed(6)}, {data.data.lng.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {data.data.category && parseCategory(data.data.category).length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-2">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {parseCategory(data.data.category).map((cat: string, idx: number) => (
                        <Chip key={idx} size="sm" color="default" variant="flat">
                          {cat}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-semibold">{data.data.expirationDuration}h</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Expires:</span>
                    <span className="font-semibold">{formatTimestamp(data.data.expiresAt)}</span>
                  </div>
                  {data.data.updatedAt && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Updated:</span>
                      <span className="font-semibold">{formatTimestamp(data.data.updatedAt)}</span>
                    </div>
                  )}
                  {data.data.deletedAt && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Deleted:</span>
                      <span className="font-semibold text-red-500">{formatTimestamp(data.data.deletedAt)}</span>
                    </div>
                  )}
                  {data.data.resolvedAt && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Resolved:</span>
                      <span className="font-semibold text-primary">{formatTimestamp(data.data.resolvedAt)}</span>
                    </div>
                  )}
                  {data.data.resolvedNote && (
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-gray-500">Resolved Note:</span>
                      <span className="font-semibold break-words whitespace-pre-wrap">{data.data.resolvedNote}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-400">Version: {data.data.versionId}</p>
                  <p className="text-xs text-gray-400">Parent: {data.data.parentId}</p>
                </div>
              </CardBody>
            </Card>
          </div>
        ) : data?.type === 'statusHistory' && data.data ? (
          <div className="space-y-4">
            {/* Status Info Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col w-full gap-2">
                  <div className="flex justify-between items-start">
                    <User
                      name={`${data.data.firstName} ${data.data.lastName}`}
                      description={formatTimestamp(data.data.createdAt)}
                      avatarProps={{ src: data.data.profileImage }}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <p className={`font-bold text-${getStatusTypeColor(data.data.statusType)}`}>
                      {data.data.statusType.toUpperCase()}
                    </p>
                    <Chip size="sm" variant="flat" color={getConditionColor(data.data.condition)}>
                      {data.data.condition.toUpperCase()}
                    </Chip>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                {data.data.image && data.data.image.trim() !== '' && (
                  <div className="w-full overflow-hidden rounded-lg">
                    <Image src={data.data.image} alt="Status" className="w-full object-cover" />
                  </div>
                )}

                {data.data.note && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Note:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{data.data.note}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">People</p>
                      <p className="text-sm font-semibold">{data.data.people}</p>
                    </div>
                  </div>

                  {data.data.shareContact && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Contact</p>
                        <p className="text-sm font-semibold">{data.data.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                </div>

                {data.data.location && (
                  <div className="flex items-start gap-2 pt-2 border-t">
                    <MapPin size={16} className="text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-sm">{data.data.location}</p>
                      {data.data.shareLocation && data.data.lat && data.data.lng && (
                        <p className="text-xs text-gray-400 mt-1">
                          {data.data.lat.toFixed(6)}, {data.data.lng.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {data.data.category && parseCategory(data.data.category).length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-2">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {parseCategory(data.data.category).map((cat: string, idx: number) => (
                        <Chip key={idx} size="sm" color="default" variant="flat">
                          {cat}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-semibold">{data.data.expirationDuration}h</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Expires:</span>
                    <span className="font-semibold">{formatTimestamp(data.data.expiresAt)}</span>
                  </div>
                  {data.data.updatedAt && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Updated:</span>
                      <span className="font-semibold">{formatTimestamp(data.data.updatedAt)}</span>
                    </div>
                  )}
                  {data.data.deletedAt && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Deleted:</span>
                      <span className="font-semibold text-red-500">{formatTimestamp(data.data.deletedAt)}</span>
                    </div>
                  )}
                  {data.data.resolvedAt && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Resolved:</span>
                      <span className="font-semibold text-primary">{formatTimestamp(data.data.resolvedAt)}</span>
                    </div>
                  )}
                  {data.data.resolvedNote && (
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-gray-500">Resolved Note:</span>
                      <span className="font-semibold break-words whitespace-pre-wrap">{data.data.resolvedNote}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-400">Version: {data.data.versionId}</p>
                  <p className="text-xs text-gray-400">Parent: {data.data.parentId}</p>
                </div>
              </CardBody>
            </Card>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p>Select a row from the history table to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};
