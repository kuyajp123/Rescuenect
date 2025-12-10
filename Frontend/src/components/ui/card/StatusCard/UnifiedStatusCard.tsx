import { Map } from '@/components/ui/Map';
import { parseCategory } from '@/helper/commonHelpers';
import { StatusDataCard } from '@/types/types';
import { Avatar, Button, Card, CardBody, CardFooter, CardHeader, Chip, Image } from '@heroui/react';
import { Clock, MapPin } from 'lucide-react';

interface StatusCardVersionTwoProps {
  data?: StatusDataCard;
  mode?: 'residentProfile' | 'versionHistory';
  onViewDetails?: () => void;
}

export const UnifiedStatusCard = ({ data, mode = 'residentProfile', onViewDetails }: StatusCardVersionTwoProps) => {
  if (!data) {
    return null;
  }

  const formatDate = (timestamp: {
    _seconds?: number;
    _nanoseconds?: number;
    seconds?: number;
    nanoseconds?: number;
  }) => {
    const seconds = timestamp._seconds || timestamp.seconds || 0;
    const date = new Date(seconds * 1000);
    return date.toLocaleDateString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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

  const parsedCategory = parseCategory(data.category);

  return (
    <Card className="hover:shadow-lg transition-shadow h-fit">
      <CardHeader className="flex-col items-start gap-2 pb-2">
        {mode === 'residentProfile' ? (
          <>
            {/* Header for resident's profile */}
            <div className="flex justify-between w-full items-start">
              <p className={`text-${getStatusTypeColor(data.statusType)} font-bold`}>{data.statusType.toUpperCase()}</p>
              <Chip size="sm" color={getConditionColor(data.condition)} variant="flat">
                {data.condition.toUpperCase()}
              </Chip>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock size={12} />
              {formatDate(data.createdAt)}
            </div>
          </>
        ) : (
          <>
            {/* Header for version history */}
            <div className="flex justify-between w-full">
              <div className="flex gap-3">
                <Avatar radius="full" size="md" src={data.profileImage} />
                <div className="flex flex-col gap-1 items-start justify-center">
                  <h4 className="text-small font-semibold leading-none text-default-600">
                    {data.firstName} {data.lastName}
                  </h4>
                  <p className="text-xs text-default-500 line-clamp-1">{data.location}</p>
                  <p className="text-xs text-default-400">{formatDate(data.createdAt)}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Chip size="sm" color={getConditionColor(data.condition)} variant="flat">
                  {data.condition.toUpperCase()}
                </Chip>
              </div>
            </div>
          </>
        )}
      </CardHeader>

      <CardBody className="max-h-95">
        {mode === 'residentProfile' ? (
          <>
            {/* Display image for resident's profile */}
            {data.image && (
              <Image
                src={data.image}
                width={'100%'}
                alt="Status"
                className="w-full h-60 object-cover rounded-lg mb-3"
              />
            )}
          </>
        ) : (
          <>
            {/* Display map for version history */}
            {data.lat && data.lng && data.shareLocation && (
              <div className="w-full h-48 rounded-lg overflow-hidden mb-3">
                <Map
                  data={[
                    {
                      uid: data.versionId,
                      lat: data.lat,
                      lng: data.lng,
                      condition: data.condition,
                    },
                  ]}
                  center={[data.lat, data.lng]}
                  hasMapControl={false}
                  hasMapStyleSelector={false}
                  dragging={false}
                  zoomControl={false}
                  zoom={15}
                  attribution=""
                  markerType="status"
                />
              </div>
            )}
          </>
        )}

        <div className="space-y-2 text-sm">
          {data.location && (
            <div className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-500" />
              <span className="line-clamp-2 text-xs">{data.location}</span>
            </div>
          )}

          {data.note && <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{data.note}</p>}

          {parsedCategory.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {parsedCategory.slice(0, 4).map((cat, idx) => (
                <Chip key={idx} size="sm" color="default" variant="flat" className="text-xs">
                  {cat}
                </Chip>
              ))}
              {parsedCategory.length > 4 && (
                <Chip size="sm" variant="flat" className="text-xs">
                  +{parsedCategory.length - 4}
                </Chip>
              )}
            </div>
          )}

          {mode === 'versionHistory' && (
            <div className="pt-1">
              <p className="text-default-400 text-xs">Version: {data.versionId}</p>
            </div>
          )}
        </div>
      </CardBody>

      <CardFooter>
        <Button color="primary" className="w-full" onPress={onViewDetails}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};
