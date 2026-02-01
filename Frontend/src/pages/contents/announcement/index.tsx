import { UnifiedStatusCard } from '@/components/ui/card/StatusCard/UnifiedStatusCard';
import { AnnouncementDataCard } from '@/types/types';
import { Button, Card, CardBody } from '@heroui/react';
import { Megaphone, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Announcement = () => {
  const navigate = useNavigate();

  const announcements: AnnouncementDataCard[] = [];

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

      {announcements.length === 0 ? (
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {announcements.map(item => (
            <UnifiedStatusCard key={item.id} data={item} mode="announcement" />
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcement;
