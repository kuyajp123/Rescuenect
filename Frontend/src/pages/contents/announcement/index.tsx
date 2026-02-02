import { UnifiedStatusCard } from '@/components/ui/card/StatusCard/UnifiedStatusCard';
import { API_ENDPOINTS } from '@/config/endPoints';
import { AnnouncementDataCard } from '@/types/types';
import { Button, Card, CardBody, Skeleton } from '@heroui/react';
import axios from 'axios';
import { Megaphone, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Announcement = () => {
  const [announcement, setAnnouncement] = useState<AnnouncementDataCard[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const response = await axios.get(API_ENDPOINTS.ANNOUNCEMENT.GET_ALL_ANNOUNCEMENTS);
        const data = response.data as unknown;
        if (Array.isArray(data)) {
          setAnnouncement(data as AnnouncementDataCard[]);
        } else {
          setAnnouncement((data as { announcements?: AnnouncementDataCard[] }).announcements ?? []);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const navigate = useNavigate();

  let announcements: AnnouncementDataCard[] = announcement ?? [];

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-3xl font-bold">Announcements</p>
          <p className="text-sm text-default-500">Create and manage community updates in one place.</p>
        </div>
        <Button
          color="primary"
          endContent={<Plus size={18} />}
          onPress={() => {
            navigate('/announcement/create-announcement');
          }}
        >
          Add Announcement
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((_item, index) => (
            <Card key={index} className="w-full h-full space-y-5 p-4" radius="lg">
              <Skeleton className="rounded-lg">
                <div className="h-24 rounded-lg bg-default-300" />
              </Skeleton>
              <div className="space-y-3">
                <Skeleton className="w-3/5 rounded-lg">
                  <div className="h-3 w-3/5 rounded-lg bg-default-200" />
                </Skeleton>
                <Skeleton className="w-4/5 rounded-lg">
                  <div className="h-3 w-4/5 rounded-lg bg-default-200" />
                </Skeleton>
                <Skeleton className="w-2/5 rounded-lg">
                  <div className="h-3 w-2/5 rounded-lg bg-default-300" />
                </Skeleton>
              </div>
            </Card>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <Card className="border-2 border-dashed border-default-200">
          <CardBody className="py-14 flex flex-col items-center text-center gap-4">
            <div className="rounded-full bg-default-100 p-4">
              <Megaphone size={28} className="text-default-500" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">No announcements yet</p>
              <p className="text-sm text-default-500">Publish your first announcement to keep residents informed.</p>
            </div>
            <Button
              color="primary"
              endContent={<Plus size={18} />}
              onPress={() => {
                navigate('/announcement/create-announcement');
              }}
            >
              Add Announcement
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr pb-4">
          {announcements.map(item => (
            <UnifiedStatusCard
              key={item.id}
              data={item}
              mode="announcement"
              onViewDetails={() =>
                navigate(`/announcement/details/${item.id}`, { state: { title: item.title } })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcement;
