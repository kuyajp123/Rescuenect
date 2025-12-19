import { SecondaryButton } from '@/components/ui/button';
import { StatusCard } from '@/components/ui/card/StatusCard';
import { Map } from '@/components/ui/Map';
import { StatusList } from '@/components/ui/status';
import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { useStatusStore } from '@/stores/useStatusStore';
import { MapMarkerData } from '@/types/types';
import {
    Button,
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    Form,
    Select,
    SelectItem,
    Textarea,
    useDisclosure,
} from '@heroui/react';
import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const statuses = [
  { key: 'safe', label: 'Safe' },
  { key: 'evacuated', label: 'Evacuated' },
  { key: 'affected', label: 'Affected' },
  { key: 'missing', label: 'Missing' },
];

const Status = () => {
  const [selectedStatuses, setSelectedStatuses] = useState(new Set(['all']));
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const statusData = useStatusStore(state => state.statusData);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [resolvedLoading, setResolvedLoading] = useState(false);
  const navigate = useNavigate();
  const admin = auth.currentUser;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResolvedLoading(true);
    const formData = new FormData(e.currentTarget);
    const note = formData.get('note') as string;
    const idToken = await admin?.getIdToken();

    if (!selectedItem) return;

    try {
      await axios.put(
        API_ENDPOINTS.STATUS.RESOLVED_STATUS,
        {
          uid: selectedItem.uid,
          versionId: selectedItem.versionId || selectedItem.vid,
          resolvedNote: note,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      onClose(); // Close the drawer
    } catch (error) {
      console.error('Error resolving status:', error);
    } finally {
      setResolvedLoading(false);
    }
  };

  const statusCount = statusData.length;
  const safeCount = statusData.filter(item => item.condition === 'safe').length;
  const evacuatedCount = statusData.filter(item => item.condition === 'evacuated').length;
  const affectedCount = statusData.filter(item => item.condition === 'affected').length;
  const missingCount = statusData.filter(item => item.condition === 'missing').length;

  const statusOptions = statuses.map(s => s.key);

  // Check if all individual statuses are selected
  const allStatusesSelected = statusOptions.every(status => selectedStatuses.has(status));

  // Dynamic select/unselect option
  const selectAllOption = {
    key: 'all',
    label: allStatusesSelected ? 'Unselect All' : 'Select All',
  };

  // Combined statuses with dynamic select all option
  const allStatusOptions = [selectAllOption, ...statuses];

  const handleMarkerClick = (marker: MapMarkerData) => {
    // Find the full status data that corresponds to this marker
    const fullStatusData = statusData.find(item => item.uid === marker.uid);
    if (fullStatusData) {
      setSelectedItem(fullStatusData);
    }
  };

  // Handle status selection with "Select All" logic
  const handleStatusChange = (keys: any) => {
    const newKeys = new Set(Array.from(keys).map(String));

    // If "all" was just selected/deselected
    if (newKeys.has('all') !== selectedStatuses.has('all')) {
      if (newKeys.has('all')) {
        // Select all individual statuses
        setSelectedStatuses(new Set(['all', ...statusOptions]));
      } else {
        // Unselect all
        setSelectedStatuses(new Set());
      }
    } else {
      // Individual status selection/deselection
      const individualStatuses = [...newKeys].filter(key => key !== 'all');

      if (individualStatuses.length === statusOptions.length) {
        // If all individual statuses are selected, also include "all"
        setSelectedStatuses(new Set(['all', ...statusOptions]));
      } else {
        // Only individual selections, no "all"
        setSelectedStatuses(new Set(individualStatuses));
      }
    }
  };

  // Get display text for selected statuses
  const getSelectedStatusText = () => {
    if (allStatusesSelected || selectedStatuses.has('all')) {
      return 'All Selected';
    }

    const individualSelected = statusOptions.filter(status => selectedStatuses.has(status));
    if (individualSelected.length === 0) {
      return 'None Selected';
    }

    return individualSelected.map(status => statuses.find(s => s.key === status)?.label).join(', ');
  };

  // Filter data based on selected statuses
  const getFilteredData = () => {
    let data = statusData;

    // If "all" is selected or all individual statuses are selected, show all data
    if (!selectedStatuses.has('all') && !allStatusesSelected) {
      // If no statuses selected, show nothing
      if (selectedStatuses.size === 0) {
        data = [];
      } else {
        // Otherwise, filter by selected statuses
        data = statusData.filter(item => selectedStatuses.has(item.condition));
      }
    }

    // Convert StatusData to MapMarkerData and filter out entries without coordinates
    return data
      .filter(item => item.lat !== null && item.lng !== null)
      .map(item => ({
        uid: item.uid,
        lat: item.lat as number,
        lng: item.lng as number,
        condition: item.condition,
      }));
  };

  const filteredData: MapMarkerData[] = getFilteredData();

  // Update counts to reflect filtered data
  const filteredStatusCount = filteredData.length;

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[2fr_1fr] gap-4 w-full h-full">
      <div className="rounded-lg overflow-hidden w-full h-[45vh] lg:h-full">
        <Map
          data={filteredData}
          onMarkerClick={handleMarkerClick}
          popupType="coordinates"
          markerType="status"
          overlayPosition="topright"
          overlayClassName="custom-map-overlay"
        />
      </div>
      <div className="h-fit lg:h-full overflow-y-auto">
        <div className="flex flex-col justify-between">
          <StatusList safe={safeCount} evacuated={evacuatedCount} affected={affectedCount} missing={missingCount} />
          <div className="mb-4 mt-6 flex flex-col sm:flex-row gap-3 sm:gap-5 items-center">
            <Select
              label="Filter status"
              placeholder="Select a status"
              selectedKeys={selectedStatuses}
              selectionMode="multiple"
              onSelectionChange={handleStatusChange}
              className="cursor-pointer w-full sm:max-w-xs"
            >
              {allStatusOptions.map(statusOption => (
                <SelectItem key={statusOption.key}>{statusOption.label}</SelectItem>
              ))}
            </Select>
            <SecondaryButton onPress={() => navigate('/status/history')} className="w-full sm:w-auto">
              <p>History</p>
            </SecondaryButton>
          </div>
          <div className="flex justify-between grid-cols-1 items-center mb-2">
            <div className="mt-2 text-sm opacity-70">Selected: {getSelectedStatusText()}</div>
            <div className="">{`Showing: ${filteredStatusCount} of ${statusCount}`}</div>
          </div>
        </div>
        <div className="pt-4 h-120">
          <div className="w-full flex flex-row justify-end">
            {selectedItem && (
              <button onClick={() => setSelectedItem(null)} className="text-sm mb-3 opacity-70 cursor-pointer">
                Close
              </button>
            )}
          </div>
          {selectedItem ? (
            <StatusCard
              uid={selectedItem.uid}
              profileImage={selectedItem.profileImage}
              firstName={selectedItem.firstName}
              lastName={selectedItem.lastName}
              condition={selectedItem.condition}
              location={selectedItem.location}
              createdAt={selectedItem.createdAt}
              note={selectedItem.note}
              image={selectedItem.image} // || 'https://heroui.com/images/hero-card-complete.jpeg'
              phoneNumber={selectedItem.phoneNumber}
              expiresAt={selectedItem.expiresAt}
              vid={selectedItem.versionId}
              category={selectedItem.category}
              people={selectedItem.people}
              onResolved={() => {
                onOpen();
              }}
              onViewDetails={() => {}}
              onViewProfile={() => {}}
            />
          ) : (
            <div className="text-center flex h-full items-center justify-center">
              <p className="text-gray-500 text-center">Selected marker displays here</p>
            </div>
          )}
        </div>
        <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
          <DrawerContent>
            {onClose => (
              <>
                <Form onSubmit={handleSubmit}>
                  <DrawerHeader className="flex flex-col gap-1">Complete Resident Status</DrawerHeader>
                  <DrawerBody>
                    <p className="mb-4">Are you sure you want to complete this resident status?</p>
                    <Textarea label="Leave some notes" placeholder="Enter note" labelPlacement="outside" name="note" />
                  </DrawerBody>
                  <DrawerFooter>
                    <Button color="danger" variant="light" onPress={onClose} disabled={resolvedLoading}>
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      type="submit"
                      isLoading={resolvedLoading}
                      disabled={resolvedLoading}
                      className="ml-2"
                    >
                      {resolvedLoading ? 'Submitting...' : 'Submit'}
                    </Button>
                  </DrawerFooter>
                </Form>
              </>
            )}
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};

export default Status;
