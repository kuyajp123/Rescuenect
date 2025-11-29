import { Map } from '@/components/ui/Map';
import EvacuationTable from '@/components/ui/table/EvacuationTable';
import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { EvacuationCenter } from '@/types/types';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import axios from 'axios';
import { List, Map as MapIcon, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePanelStore } from '@/stores/panelStore'
import { PanelSelection } from '@/stores/panelStore';

const index = () => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>(() => {
    const saved = localStorage.getItem('evacuationViewMode');
    return saved === 'map' || saved === 'list' ? saved : 'list';
  });
  const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[]>([]);
  const openEvacuationPanel = usePanelStore(state => state.openEvacuationPanel);
  const setSelectedUser = usePanelStore(state => state.setSelectedUser);
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
        const response = await axios.get<EvacuationCenter[]>(API_ENDPOINTS.EVACUATION.GET_CENTERS, {
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

  // Save viewMode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('evacuationViewMode', viewMode);
  }, [viewMode]);

  const handleMarkerClick = (marker: any) => {
    // Find the full evacuation center data that corresponds to this marker
    const fullCenterData = evacuationCenters.find(item => item.id === marker.uid);
    if (fullCenterData) {
      setSelectedUser(fullCenterData as unknown as PanelSelection);
      openEvacuationPanel(fullCenterData);
    }
  };

  return (
    <div className="w-full h-full">
      <div className="flex flex-row justify-between mb-5">
        <p className="text-3xl font-bold">Evacuation centers</p>
        <div className="flex flex-row gap-4">
          <div className="flex gap-2">
            <Button
              isIconOnly
              variant="flat"
              color={viewMode === 'list' ? 'primary' : 'default'}
              onPress={() => setViewMode('list')}
            >
              <List size={20} />
            </Button>
            <Button
              isIconOnly
              variant="flat"
              color={viewMode === 'map' ? 'primary' : 'default'}
              onPress={() => setViewMode('map')}
            >
              <MapIcon size={20} />
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
      {viewMode === 'list' ? (
        <EvacuationTable data={evacuationCenters} />
      ) : (
        <div className="h-[90%] grid grid-cols-2 gap-4">
          <Map
            onMarkerClick={handleMarkerClick}
            data={evacuationCenters
              .filter(
                center =>
                  center.coordinates &&
                  typeof center.coordinates.lat === 'number' &&
                  typeof center.coordinates.lng === 'number'
              )
              .map(center => ({
                uid: center.id, // or center.uid if available
                lat: center.coordinates!.lat,
                lng: center.coordinates!.lng,
                ...center,
              }))}
          />
          <div>
            <Card className="h-full">
              <CardHeader>
                <h3 className="text-lg font-semibold">Evacuation Center Details</h3>
              </CardHeader>
              <CardBody>hello</CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default index;
