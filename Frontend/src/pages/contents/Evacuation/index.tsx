import { Map } from '@/components/ui/Map';
import EvacuationTable from '@/components/ui/table/EvacuationTable';
import { usePanelStore } from '@/stores/panelStore';
import { useEvacuationStore } from '@/stores/useEvacuationStore';
import { EvacuationCenter } from '@/types/types';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from '@heroui/react';
import { List, Map as MapIcon, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const index = () => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>(() => {
    const saved = localStorage.getItem('evacuationViewMode');
    return saved === 'map' || saved === 'list' ? saved : 'list';
  });
  // Local delete state
  const [centerToDelete, setCenterToDelete] = useState<EvacuationCenter | null>(null);

  const navigate = useNavigate();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();
  const { openEvacuationPanel, closePanel } = usePanelStore();

  // Use Zustand store for evacuation centers
  const { evacuationCenters, isLoading, fetchEvacuationCenters, deleteEvacuationCenter } = useEvacuationStore();

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
      openEvacuationPanel(fullCenterData);
    }
  };

  const handleDeleteCenter = async (centerId: string) => {
    try {
      await deleteEvacuationCenter(centerId);
      // Close the modal
      onDeleteOpenChange();
      setCenterToDelete(null);
    } catch (error) {
      console.error('Error deleting evacuation center:', error);
      alert('Failed to delete center.');
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
          onEditRequest={center => {
            openEvacuationPanel(center);
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
