import { Map } from '@/components/ui/Map';
import { parseCategory } from '@/helper/commonHelpers';
import { AnnouncementDataCard, StatusDataCard, UnifiedStatusCardData, UnifiedStatusCardMode } from '@/types/types';
import { Avatar, Button, Card, CardBody, CardFooter, CardHeader, Chip, Image } from '@heroui/react';
import { Clock, MapPin, Megaphone } from 'lucide-react';

interface UnifiedStatusCardProps {
  data?: UnifiedStatusCardData;
  mode?: UnifiedStatusCardMode;
  onViewDetails?: () => void;
}

export const UnifiedStatusCard = ({ data, mode = 'residentProfile', onViewDetails }: UnifiedStatusCardProps) => {
  if (!data) {
    return null;
  }

  const stripHtml = (html: string) => {
    if (!html) return '';
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      return doc.body.textContent?.trim() ?? '';
    } catch {
      return html.replace(/<[^>]*>/g, '').trim();
    }
  };

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

  const getAnnouncementCategoryColor = (category: AnnouncementDataCard['category']) => {
    switch (category) {
      case 'event':
        return 'primary';
      case 'update':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'alert':
      case 'emergency':
        return 'danger';
      case 'general':
      case 'other':
      default:
        return 'default';
    }
  };

  if (mode === 'announcement') {
    const announcement = data as AnnouncementDataCard;
    const thumbnail = announcement.thumbnail;
    const subtitle = announcement.subtitle?.trim();
    const content = stripHtml(announcement.content ?? '');
    const barangays = announcement.barangays ?? [];

    return (
      <Card className="hover:shadow-lg transition-shadow h-full min-h-130 w-full min-w-0 flex flex-col">
        <CardHeader className="flex-col items-start gap-2 pb-2">
          <div className="flex justify-between w-full items-start gap-3">
            <div className="flex items-start gap-2">
              <Megaphone size={16} className="mt-0.5 text-gray-500" />
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-semibold leading-none text-default-700 line-clamp-2">
                  {announcement.title}
                </h4>
                {subtitle && <p className="text-xs text-default-500 line-clamp-1">{subtitle}</p>}
              </div>
            </div>
            <Chip size="sm" color={getAnnouncementCategoryColor(announcement.category)} variant="flat">
              {announcement.category.toUpperCase()}
            </Chip>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={12} />
            {formatDate(announcement.createdAt)}
          </div>
        </CardHeader>

        <CardBody className="flex-1">
          {thumbnail && (
            <Image
              src={thumbnail}
              width={'100%'}
              alt={announcement.title}
              className="w-full h-64 object-cover rounded-lg mb-3"
            />
          )}
          <div className="space-y-2 text-sm">
            {content && <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">{content}</p>}
            {barangays.length > 0 && (
              <div className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0 text-gray-500" />
                <div className="flex flex-wrap gap-1">
                  {barangays.slice(0, 4).map((barangay, idx) => (
                    <Chip key={idx} size="sm" color="default" variant="flat" className="text-xs">
                      {barangay}
                    </Chip>
                  ))}
                  {barangays.length > 4 && (
                    <Chip size="sm" variant="flat" className="text-xs">
                      +{barangays.length - 4}
                    </Chip>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardBody>

        <CardFooter>
          <Button color="primary" className="w-full" onPress={onViewDetails}>
            View Announcement
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const statusData = data as StatusDataCard;
  const parsedCategory = parseCategory(statusData.category);

  return (
    <Card className="hover:shadow-lg transition-shadow h-fit">
      <CardHeader className="flex-col items-start gap-2 pb-2">
        {mode === 'residentProfile' ? (
          <>
            {/* Header for resident's profile */}
            <div className="flex justify-between w-full items-start">
              <p className={`text-${getStatusTypeColor(statusData.statusType)} font-bold`}>
                {statusData.statusType.toUpperCase()}
              </p>
              <Chip size="sm" color={getConditionColor(statusData.condition)} variant="flat">
                {statusData.condition.toUpperCase()}
              </Chip>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock size={12} />
              {formatDate(statusData.createdAt)}
            </div>
          </>
        ) : (
          <>
            {/* Header for version history */}
            <div className="flex justify-between w-full">
              <div className="flex gap-3">
                <Avatar radius="full" size="md" src={statusData.profileImage} />
                <div className="flex flex-col gap-1 items-start justify-center">
                  <h4 className="text-small font-semibold leading-none text-default-600">
                    {statusData.firstName} {statusData.lastName}
                  </h4>
                  <p className="text-xs text-default-500 line-clamp-1">{statusData.location}</p>
                  <p className="text-xs text-default-400">{formatDate(statusData.createdAt)}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Chip size="sm" color={getConditionColor(statusData.condition)} variant="flat">
                  {statusData.condition.toUpperCase()}
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
            {statusData.image && (
              <Image
                src={statusData.image}
                width={'100%'}
                alt="Status"
                className="w-full h-60 object-cover rounded-lg mb-3"
              />
            )}
          </>
        ) : (
          <>
            {/* Display map for version history */}
            {statusData.lat && statusData.lng && statusData.shareLocation && (
              <div className="w-full h-48 rounded-lg overflow-hidden mb-3">
                <Map
                  data={[
                    {
                      uid: statusData.versionId,
                      lat: statusData.lat,
                      lng: statusData.lng,
                      condition: statusData.condition,
                    },
                  ]}
                  center={[statusData.lat, statusData.lng]}
                  hasMapControl={false}
                  hasMapStyleSelector={false}
                  dragging={false}
                  zoomControl={false}
                  zoom={15}
                  attribution=""
                  markerType="status"
                  maxBounds={null as any}
                />
              </div>
            )}
          </>
        )}

        <div className="space-y-2 text-sm">
          {statusData.location && (
            <div className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5 shrink-0 text-gray-500" />
              <span className="line-clamp-2 text-xs">{statusData.location}</span>
            </div>
          )}

          {statusData.note && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{statusData.note}</p>
          )}

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
              <p className="text-default-400 text-xs">Version: {statusData.versionId}</p>
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
