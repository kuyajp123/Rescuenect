import EvacuationTable from '@/components/ui/table/EvacuationTable';
import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { EvacuationCenterFormData } from '@/types/types';
import { Button } from '@heroui/react';
import axios from 'axios';
import { List, Map, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const index = () => {
  const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenterFormData[]>([]);
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchEvacuationCenters() {
      const token = await user?.getIdToken();

      if (!token) {
        console.error('User is not authenticated');
        return;
      }

      try {
        const response = await axios.get<EvacuationCenterFormData[]>(API_ENDPOINTS.EVACUATION.GET_CENTERS, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Evacuation Centers:', JSON.stringify(response.data, null, 2));
        setEvacuationCenters(response.data);
      } catch (error) {
        console.error('Error fetching evacuation centers:', error);
      }
    }
    fetchEvacuationCenters();
  }, []);

  return (
    <div className="w-full h-full">
      <div className="flex flex-row justify-between mb-5">
        <p className="text-3xl font-bold">Evacuation centers</p>
        <div className="flex flex-row gap-4">
          <div className="flex gap-2">
            <Button isIconOnly variant="flat" color="primary">
              <List size={20} />
            </Button>
            <Button isIconOnly variant="flat" color="default">
              <Map size={20} />
            </Button>
          </div>
          <Button
            color="primary"
            onPress={() => {
              navigate('add_new_center', { replace: true });
            }}
            endContent={<Plus />}
          >
            Add New
          </Button>
        </div>
      </div>
      <EvacuationTable data={evacuationCenters} />
    </div>
  );
};

export default index;
