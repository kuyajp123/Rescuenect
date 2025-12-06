import { StatusCardVersionTwo, StatusData } from '@/components/ui/card/StatusCard/StatusCard';
import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { Avatar, Card, CardBody } from '@heroui/react';
import axios from 'axios';
import { Calendar, MapPin, Phone, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

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

  return (
    <div className="w-full">
      <Card className="mb-6">
        <CardBody className="p-6">
          <div className="flex items-start gap-4">
            <Avatar src="https://heroui.com/images/hero-card-complete.jpeg" size="lg" className="w-20 h-20" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">Name here</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone size={16} />
                  <span>Phone number here</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin size={16} />
                  <span>Brangay here</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar size={16} />
                  <span>Registered: Date here</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <UserRound size={16} />
                  <span>Email here</span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-4 gap-4 pb-6">
        {statuses.map((status) => (
          <StatusCardVersionTwo key={status.id} mode="residentProfile" data={status} />
        ))}
      </div>
    </div>
  );
};

export default ResidentsProfile;
