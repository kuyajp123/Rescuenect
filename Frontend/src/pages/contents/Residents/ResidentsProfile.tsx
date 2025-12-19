import { UnifiedStatusCard } from '@/components/ui/card/StatusCard/UnifiedStatusCard';
import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { usePanelStore } from '@/stores/panelStore';
import { StatusDataCard } from '@/types/types';
import { Avatar, Card, CardBody, Skeleton } from '@heroui/react';
import axios from 'axios';
import { Calendar, MapPin, Phone, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ResidentsProfile = () => {
  const location = useLocation();
  const { resident } = location.state || {};
  const [statuses, setStatuses] = useState<StatusDataCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { openResidentProfilePanel, closePanel, setSelectedUser, isOpen } = usePanelStore();

  const gridClasses = isOpen
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  useEffect(() => {
    return () => {
      closePanel();
      setSelectedUser(null);
    };
  }, [closePanel, setSelectedUser]);

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

  if (isLoading) {
    return (
      <div className="w-full">
        <Card className="mb-6">
          <CardBody className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
              <div className="flex-1 w-full text-center md:text-left">
                <Skeleton className="h-6 w-1/2 mb-4 mx-auto md:mx-0" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm justify-items-center md:justify-items-start">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
        <div className={`grid gap-4 pb-6 ${gridClasses}`}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="w-full">
      <Card className="mb-6">
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <Avatar src={resident?.photo} size="lg" className="w-24 h-24 md:w-20 md:h-20 flex-shrink-0" />
            <div className="flex-1 w-full text-center md:text-left">
              <h1 className="text-2xl font-bold mb-2">
                {resident?.firstName} {resident?.lastName}
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm justify-items-center md:justify-items-start">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone size={16} className="text-primary flex-shrink-0" />
                  <span className="break-all">{resident?.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin size={16} className="text-primary flex-shrink-0" />
                  <span className="break-words">{resident?.barangay ? `Brgy ${resident?.barangay}` : 'No barangay'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar size={16} className="text-primary flex-shrink-0" />
                  <span>Registered: {resident?.createdAt ? formatDate(resident.createdAt) : 'Date here'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <UserRound size={16} className="text-primary flex-shrink-0" />
                  <span className="break-all">{resident?.email}</span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {statuses.length === 0 && <div className="text-center col-span-full">Resident has no Status yet.</div>}
      <div className={`grid gap-4 pb-6 ${gridClasses}`}>
        {statuses.map(status => (
          <UnifiedStatusCard
            key={status.versionId}
            mode="residentProfile"
            data={status}
            onViewDetails={() => {
              openResidentProfilePanel(status);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ResidentsProfile;
