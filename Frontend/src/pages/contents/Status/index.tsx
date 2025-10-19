import { useState } from 'react';
import { Select, SelectItem } from '@heroui/react';
import { StatusCard, StatusList, Map } from '@/components/ui/status';
import { SecondaryButton } from '@/components/ui/button';
import { useStatusStore } from '@/stores/useStatusStore';
import { MapMarkerData } from '@/types/types';
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
  const navigate = useNavigate();

  const statusCount = statusData.length;
  const safeCount = statusData.filter(item => item.condition === 'safe').length;
  const evacuatedCount = statusData.filter(item => item.condition === 'evacuated').length;
  const affectedCount = statusData.filter(item => item.condition === 'affected').length;
  const missingCount = statusData.filter(item => item.condition === 'missing').length;

  const statusOptions = ['safe', 'evacuated', 'affected', 'missing'];

  // Check if all individual statuses are selected
  const allStatusesSelected = statusOptions.every(status => selectedStatuses.has(status));

  // Dynamic select/unselect option
  const selectAllOption = {
    key: 'all',
    label: allStatusesSelected ? 'Unselect All' : 'Select All',
  };

  // Combined statuses with dynamic select all option
  const allStatusOptions = [selectAllOption, ...statuses];

  const handleMarkerClick = (item: any) => {
    setSelectedItem(item);
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
    // If "all" is selected or all individual statuses are selected, show all data
    if (selectedStatuses.has('all') || allStatusesSelected) {
      return statusData;
    }

    // If no statuses selected, show nothing
    if (selectedStatuses.size === 0) {
      return [];
    }

    // Otherwise, filter by selected statuses
    return statusData.filter(item => selectedStatuses.has(item.condition));
  };

  const filteredData: MapMarkerData[] = getFilteredData() as MapMarkerData[];

  // Update counts to reflect filtered data
  const filteredStatusCount = filteredData.length;

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-4" style={{ height: '100%', width: '100%' }}>
      <div style={{ height: '100%', width: '100%' }}>
        <Map data={filteredData} onMarkerClick={handleMarkerClick} popupType="coordinates" markerType="status" />
      </div>
      <div className="h-fit">
        <div className="flex flex-col justify-between">
          <StatusList safe={safeCount} evacuated={evacuatedCount} affected={affectedCount} missing={missingCount} />
          <div className="mb-4 mt-6 flex flex-row gap-5 items-center ">
            <Select
              label="Filter status"
              placeholder="Select a status"
              selectedKeys={selectedStatuses}
              selectionMode="multiple"
              onSelectionChange={handleStatusChange}
              className="cursor-pointer"
            >
              {allStatusOptions.map(statusOption => (
                <SelectItem key={statusOption.key}>{statusOption.label}</SelectItem>
              ))}
            </Select>
            <SecondaryButton onClick={() => navigate('/status/history')}>
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
              image={selectedItem.image}
              phoneNumber={selectedItem.phoneNumber}
              expiresAt={selectedItem.expiresAt}
            />
          ) : (
            <div className="text-center flex h-full items-center justify-center">Selected marker displays here</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Status;
