import { Map } from '@/components/ui/Map';
import EvacuationTable from '@/components/ui/table/EvacuationTable';
import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { EvacuationCenter } from '@/types/types';
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/dropdown';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@heroui/react';
import axios from 'axios';
import { Ellipsis, House, List, Map as MapIcon, MapPin, Phone, Plus, UsersRound } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const chipColors: { [key: string]: 'success' | 'danger' | 'warning' | 'default' | 'primary' | 'secondary' } = {
  available: 'success',
  closed: 'danger',
  full: 'warning',
};

const fields = [
  { key: 'location', label: 'Location', icon: <MapPin size={20} /> },
  { key: 'capacity', label: 'Capacity', icon: <UsersRound size={20} /> },
  { key: 'type', label: 'Type', icon: <House size={20} /> },
  { key: 'contact', label: 'Contact', icon: <Phone size={20} /> },
];

const renderProperty = (icon: React.ReactNode, label: string, value: string | number | undefined) => (
  <div className="flex items-center gap-2 my-2">
    {icon}
    <p className="text-gray-600 dark:text-gray-300">{label}:</p>
    <p>{value ?? 'N/A'}</p>
  </div>
);

const index = () => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>(() => {
    const saved = localStorage.getItem('evacuationViewMode');
    return saved === 'map' || saved === 'list' ? saved : 'list';
  });
  const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<any | null>(null);
  const user = auth.currentUser;
  const navigate = useNavigate();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

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
      setSelectedCenter(fullCenterData);
    }
  };

  const handleDeleteCenter = async (centerId: string) => {
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
      onOpenChange();
      setSelectedCenter(null);
    } catch (error) {
      console.error('Error deleting evacuation center:', error);
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
            setSelectedCenter(center);
            onOpen();
          }}
        />
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
                <h3 className="text-lg">Evacuation Center Details</h3>
              </CardHeader>
              <CardBody>
                {evacuationCenters.length > 0 ? (
                  <div className="h-full w-full flex justify-center items-center">
                    <p className="text-gray-500">No evacuation centers available.</p>
                  </div>
                ) : selectedCenter ? (
                  <>
                    <div className="flex flex-row gap-4 mb-2">
                      <p className="text-2xl font-bold">{selectedCenter?.name}</p>
                      <Chip variant="flat" color={chipColors[selectedCenter?.status.toLowerCase()]}>
                        {selectedCenter?.status}
                      </Chip>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly variant="flat">
                            <Ellipsis />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Static Actions">
                          <DropdownItem key="delete" className="text-danger" color="danger" onPress={onOpen}>
                            Delete
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                    {fields.map(field => {
                      let value: string | number | undefined = '';
                      if (selectedCenter) {
                        switch (field.key) {
                          case 'location':
                            value = selectedCenter.location;
                            break;
                          case 'capacity':
                            value = selectedCenter.capacity;
                            break;
                          case 'type':
                            value = selectedCenter.type;
                            break;
                          case 'contact':
                            value = selectedCenter.contact;
                            break;
                          default:
                            value = '';
                        }
                      }
                      return renderProperty(field.icon, field.label, value);
                    })}
                    <div className="flex items-center gap-2 my-2 text-wrap">
                      <p>{selectedCenter?.description}</p>
                    </div>
                    {selectedCenter?.images && selectedCenter.images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {selectedCenter.images.map((image: string, index: number) => (
                          <img
                            key={index}
                            src={image}
                            alt={`${selectedCenter?.name} - Image ${index + 1}`}
                            className="w-100 h-100 object-cover rounded-md"
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full w-full flex justify-center items-center">
                    <p className="text-gray-500">Select an evacuation center to see details.</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
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
                    handleDeleteCenter(selectedCenter?.id);
                  }}
                >
                  Delete
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
