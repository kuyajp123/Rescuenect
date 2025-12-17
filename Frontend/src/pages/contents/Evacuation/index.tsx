import { Map } from '@/components/ui/Map';
import EvacuationTable from '@/components/ui/table/EvacuationTable';
import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { usePanelStore } from '@/stores/panelStore';
import { EvacuationCenter } from '@/types/types';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from '@heroui/react';
import axios from 'axios';
import { List, Map as MapIcon, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const index = () => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>(() => {
    const saved = localStorage.getItem('evacuationViewMode');
    return saved === 'map' || saved === 'list' ? saved : 'list';
  });
  const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[]>([]);
  // Local delete state
  const [centerToDelete, setCenterToDelete] = useState<EvacuationCenter | null>(null);
  
  const user = auth.currentUser;
  const navigate = useNavigate();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();
  const { openEvacuationPanel, closePanel } = usePanelStore();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch function to be reused
  async function fetchEvacuationCenters() {
      const token = await user?.getIdToken();
      if (!token) {
        console.error('User is not authenticated');
        return;
      }
      try {
        const response = await axios.get<EvacuationCenter[]>(API_ENDPOINTS.EVACUATION.GET_CENTERS);
        setEvacuationCenters(response.data);
      } catch (error) {
        console.error('Error fetching evacuation centers:', error);
      }
  }

  useEffect(() => {
    fetchEvacuationCenters();
    // Close panel on unmount
    return () => {
      closePanel();
    };
  }, []);

  // Save viewMode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('evacuationViewMode', viewMode);
  }, [viewMode]);

  const handleMarkerClick = (marker: any) => {
    const fullCenterData = evacuationCenters.find(item => item.id === marker.uid);
    if (fullCenterData) {
      openEvacuationPanel(fullCenterData, fetchEvacuationCenters);
    }
  };

  const handleDeleteCenter = async (centerId: string) => {
    setIsLoading(true);
    const token = await user?.getIdToken();

    if (!token) {
      console.error('User is not authenticated');
      return;
    }

    try {
      const response = await axios.delete(API_ENDPOINTS.EVACUATION.DELETE_CENTER, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { id: centerId, uid: user?.uid },
      } as any);

      console.log('Delete response:', response.data);

      // Refresh the evacuation centers list after deletion
      setEvacuationCenters(prevCenters => prevCenters.filter(center => center.id !== centerId));

      // Close the modal
      onDeleteOpenChange();
      setCenterToDelete(null);
    } catch (error) {
      console.error('Error deleting evacuation center:', error);
      alert('Failed to delete center.');
    } finally {
        setIsLoading(false);
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
        <EvacuationTable
          data={evacuationCenters}
          onDeleteRequest={center => {
            setCenterToDelete(center);
            onDeleteOpen();
          }}
          onEditRequest={(center) => {
             openEvacuationPanel(center, fetchEvacuationCenters);
          }}
        />
      ) : (
        <div className="h-[90%] w-full">
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
        </div>
      )}
      
      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">Delete Evacuation Center</ModalHeader>
              <ModalBody>Are you sure you want to delete this evacuation center?</ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    if (centerToDelete) {
                        handleDeleteCenter(centerToDelete.id);
                    }
                  }}
                  disabled={isLoading}
                  isLoading={isLoading}
                >
                  {isLoading ? 'Deleting' : 'Delete'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default index;
