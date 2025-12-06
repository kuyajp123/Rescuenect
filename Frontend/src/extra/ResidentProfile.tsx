import { Map } from '@/components/ui/Map';
import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { Category } from '@/types/types';
import { Avatar, Button, Card, CardBody, CardFooter, CardHeader, Chip, Image, Skeleton, User } from '@heroui/react';
import axios from 'axios';
import { Calendar, Clock, Eye, MapPin, Phone, Shield, UserRound, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface StatusData {
  id: string;
  parentId: string;
  versionId: string;
  statusType: 'current' | 'history' | 'deleted';
  uid: string;
  profileImage: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  condition: 'safe' | 'evacuated' | 'affected' | 'missing';
  lat: number | null;
  lng: number | null;
  location?: string | null;
  note: string;
  image: string;
  category: Category[];
  people: number;
  shareLocation: boolean;
  shareContact: boolean;
  expirationDuration: 12 | 24;
  expiresAt: { _seconds: number; _nanoseconds: number };
  createdAt: { _seconds: number; _nanoseconds: number };
  updatedAt?: { _seconds: number; _nanoseconds: number };
  deletedAt?: { _seconds: number; _nanoseconds: number };
  retentionUntil: { _seconds: number; _nanoseconds: number };
}

const ResidentsProfile = () => {
  const location = useLocation();
  const { resident } = location.state || {};
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<StatusData | null>(null);

  useEffect(() => {
    const fetchResidentStatuses = async () => {
      if (!resident?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const idToken = await auth.currentUser?.getIdToken();
        const response = await axios.get<any>(API_ENDPOINTS.RESIDENTS.GET_RESIDENTS_STATUS, {
          params: { residentId: resident.id },
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        const fetchedStatuses = (response.data.statuses || []).map((status: any) => {
          let parsedCategory = [];

          if (typeof status.category === 'string' && status.category) {
            try {
              // Clean and parse the category string
              let cleanedCategory = status.category.trim();

              // Handle double-encoded JSON (e.g., "\"[...]\"")
              if (cleanedCategory.startsWith('"') && cleanedCategory.endsWith('"')) {
                cleanedCategory = cleanedCategory.slice(1, -1);
              }

              // Remove any leading/trailing newlines or quotes
              cleanedCategory = cleanedCategory.replace(/^\n*"?|"?\n*$/g, '');

              parsedCategory = JSON.parse(cleanedCategory);
            } catch (e) {
              console.warn('Failed to parse category for status:', status.id, 'Raw value:', status.category);
              // If it's comma-separated string, split it
              if (status.category.includes(',')) {
                parsedCategory = status.category.split(',').map((c: string) => c.trim());
              } else {
                parsedCategory = [];
              }
            }
          } else if (Array.isArray(status.category)) {
            parsedCategory = status.category;
          }

          return {
            ...status,
            category: parsedCategory,
          };
        });

        setStatuses(fetchedStatuses);
      } catch (error) {
        console.error('Error fetching resident statuses:', error);
        setError('Failed to load statuses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResidentStatuses();
  }, [resident?.id]);

  const formatTimestamp = (timestamp: { _seconds: number; _nanoseconds: number }) => {
    const date = new Date(timestamp._seconds * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: { _seconds: number; _nanoseconds: number }) => {
    const date = new Date(timestamp._seconds * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  if (!resident) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No resident data available</p>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 p-6">
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${selectedStatus ? 'mr-0' : 'mr-0'}`}>
        {/* Resident Header Card */}
        <Card className="mb-6">
          <CardBody className="p-6">
            <div className="flex items-start gap-4">
              <Avatar src={resident.photo} size="lg" className="w-20 h-20" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">
                  {resident.firstName} {resident.lastName}
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone size={16} />
                    <span>{resident.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin size={16} />
                    <span>{resident.barangay || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar size={16} />
                    <span>Registered: {resident.createdAt ? formatDate(resident.createdAt) : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <UserRound size={16} />
                    <span>{resident.email || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Status History */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Status History ({statuses.length})</h2>

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="w-full">
                  <CardHeader className="flex gap-3">
                    <Skeleton className="flex rounded-full w-12 h-12" />
                    <div className="flex flex-col gap-2 flex-1">
                      <Skeleton className="h-4 w-3/5 rounded-lg" />
                      <Skeleton className="h-3 w-4/5 rounded-lg" />
                    </div>
                  </CardHeader>
                  <CardBody>
                    <Skeleton className="h-32 rounded-lg" />
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center p-8">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {!isLoading && !error && statuses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statuses.map(status => (
                <Card key={status.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="flex-col items-start gap-2 pb-2">
                    <div className="flex justify-between w-full items-start">
                      <Chip size="sm" color={'default'} variant="flat">
                        {status.statusType.toUpperCase()}
                      </Chip>
                      <Chip size="sm" color={getConditionColor(status.condition)} variant="flat">
                        {status.condition.toUpperCase()}
                      </Chip>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={12} />
                      {formatDate(status.createdAt)}
                    </div>
                  </CardHeader>

                  <CardBody className="py-2">
                    {status.image && (
                      <Image src={status.image} alt="Status" className="w-full h-40 object-cover rounded-lg mb-3" />
                    )}

                    <div className="space-y-2 text-sm">
                      {status.location && (
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-500" />
                          <span className="line-clamp-2 text-xs">{status.location}</span>
                        </div>
                      )}

                      {status.note && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{status.note}</p>
                      )}

                      {status.category && Array.isArray(status.category) && status.category.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {status.category.slice(0, 3).map((cat, idx) => (
                            <Chip key={idx} size="sm" color={'default'} variant="flat" className="text-xs">
                              {cat}
                            </Chip>
                          ))}
                          {status.category.length > 3 && (
                            <Chip size="sm" variant="flat" className="text-xs">
                              +{status.category.length - 3}
                            </Chip>
                          )}
                        </div>
                      )}
                    </div>
                  </CardBody>

                  <CardFooter className="pt-2">
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      startContent={<Eye size={16} />}
                      className="w-full"
                      onPress={() => setSelectedStatus(status)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && !error && statuses.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
              <Shield size={48} className="text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No status history available</p>
              <p className="text-gray-400 text-sm mt-2">This resident hasn't created any status updates yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Side Panel */}
      {selectedStatus && (
        <div className="w-[500px] flex-shrink-0 border-l pl-4 overflow-y-auto max-h-[calc(100vh-120px)]">
          <div className="sticky top-0 bg-background z-10 pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Status Details</h3>
              <Button isIconOnly size="sm" variant="light" onPress={() => setSelectedStatus(null)}>
                <X size={20} />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Map */}
            {selectedStatus.lat && selectedStatus.lng && selectedStatus.shareLocation && (
              <Card>
                <CardBody className="p-0">
                  <div className="h-48 rounded-lg overflow-hidden">
                    <Map
                      data={[
                        {
                          uid: selectedStatus.id,
                          lat: selectedStatus.lat,
                          lng: selectedStatus.lng,
                          condition: selectedStatus.condition,
                        },
                      ]}
                      center={[selectedStatus.lat, selectedStatus.lng]}
                      hasMapStyleSelector={false}
                      zoomControl={false}
                      dragging={false}
                      hasMapControl={true}
                      zoom={15}
                      attribution=""
                      markerType="status"
                    />
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Status Info Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col w-full gap-2">
                  <div className="flex justify-between items-start">
                    <User
                      name={`${selectedStatus.firstName} ${selectedStatus.lastName}`}
                      description={formatTimestamp(selectedStatus.createdAt)}
                      avatarProps={{ src: selectedStatus.profileImage }}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Chip size="sm" color={'default'} variant="flat">
                      {selectedStatus.statusType.toUpperCase()}
                    </Chip>
                    <Chip size="sm" color={getConditionColor(selectedStatus.condition)}>
                      {selectedStatus.condition.toUpperCase()}
                    </Chip>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                {selectedStatus.image && (
                  <Image src={selectedStatus.image} alt="Status" className="w-full rounded-lg" />
                )}

                {selectedStatus.note && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Note:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedStatus.note}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">People</p>
                      <p className="text-sm font-semibold">{selectedStatus.people}</p>
                    </div>
                  </div>

                  {selectedStatus.shareContact && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Contact</p>
                        <p className="text-sm font-semibold">{selectedStatus.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedStatus.location && (
                  <div className="flex items-start gap-2 pt-2 border-t">
                    <MapPin size={16} className="text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-sm">{selectedStatus.location}</p>
                      {selectedStatus.shareLocation && selectedStatus.lat && selectedStatus.lng && (
                        <p className="text-xs text-gray-400 mt-1">
                          {selectedStatus.lat.toFixed(6)}, {selectedStatus.lng.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedStatus.category &&
                  Array.isArray(selectedStatus.category) &&
                  selectedStatus.category.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500 mb-2">Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedStatus.category.map((cat, idx) => (
                          <Chip key={idx} size="sm" color={'default'} variant="flat">
                            {cat}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-semibold">{selectedStatus.expirationDuration}h</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Expires:</span>
                    <span className="font-semibold">{formatTimestamp(selectedStatus.expiresAt)}</span>
                  </div>
                  {selectedStatus.updatedAt && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Updated:</span>
                      <span className="font-semibold">{formatTimestamp(selectedStatus.updatedAt)}</span>
                    </div>
                  )}
                  {selectedStatus.deletedAt && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Deleted:</span>
                      <span className="font-semibold text-red-500">{formatTimestamp(selectedStatus.deletedAt)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-400">Version: {selectedStatus.versionId}</p>
                  <p className="text-xs text-gray-400">Parent: {selectedStatus.parentId}</p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentsProfile;
