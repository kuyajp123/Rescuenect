import { useState } from 'react';
import { Select, SelectItem } from "@heroui/react";
import { StatusCard, StatusList , Map } from '@/components/ui/status';
import status from '@/data/statusData.json';

export const statuses = [
  {key: "safe", label: "Safe"},
  {key: "evacuated", label: "Evacuated"},
  {key: "affected", label: "Affected"},
  {key: "missing", label: "Missing"},
];

const Status = () => {
  const [selectedStatuses, setSelectedStatuses] = useState(new Set(["all"]));
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const statusCount = status.length;
  const safeCount = status.filter(item => item.status === 'safe').length;
  const evacuatedCount = status.filter(item => item.status === 'evacuated').length;
  const affectedCount = status.filter(item => item.status === 'affected').length;
  const missingCount = status.filter(item => item.status === 'missing').length;

  const statusOptions = ["safe", "evacuated", "affected", "missing"];

  // Check if all individual statuses are selected
  const allStatusesSelected = statusOptions.every(status => selectedStatuses.has(status));

  // Dynamic select/unselect option
  const selectAllOption = {
    key: "all",
    label: allStatusesSelected ? "Unselect All" : "Select All"
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
    if (newKeys.has("all") !== selectedStatuses.has("all")) {
      if (newKeys.has("all")) {
        // Select all individual statuses
        setSelectedStatuses(new Set(["all", ...statusOptions]));
      } else {
        // Unselect all
        setSelectedStatuses(new Set());
      }
    } else {
      // Individual status selection/deselection
      const individualStatuses = [...newKeys].filter(key => key !== "all");
      
      if (individualStatuses.length === statusOptions.length) {
        // If all individual statuses are selected, also include "all"
        setSelectedStatuses(new Set(["all", ...statusOptions]));
      } else {
        // Only individual selections, no "all"
        setSelectedStatuses(new Set(individualStatuses));
      }
    }
  };

  // Get display text for selected statuses
  const getSelectedStatusText = () => {
    if (allStatusesSelected || selectedStatuses.has("all")) {
      return "All Selected";
    }
    
    const individualSelected = statusOptions.filter(status => selectedStatuses.has(status));
    if (individualSelected.length === 0) {
      return "None Selected";
    }
    
    return individualSelected.map(status => 
      statuses.find(s => s.key === status)?.label
    ).join(", ");
  };

  // Filter data based on selected statuses
  const getFilteredData = () => {
    // If "all" is selected or all individual statuses are selected, show all data
    if (selectedStatuses.has("all") || allStatusesSelected) {
      return status;
    }
    
    // If no statuses selected, show nothing
    if (selectedStatuses.size === 0) {
      return [];
    }
    
    // Otherwise, filter by selected statuses
    return status.filter(item => selectedStatuses.has(item.status));
  };

  const filteredData = getFilteredData();
  
  // Update counts to reflect filtered data
  const filteredStatusCount = filteredData.length;

  return (
    <div className='grid  grid-cols-[2fr_1fr] gap-4' style={{ height: '100%', width: '100%' }}>
      <div style={{ height: '100%', width: '100%' }}>
        <Map 
        data={filteredData} 
        onMarkerClick={handleMarkerClick}
        popupType="coordinates"
        markerType='status'
        />
      </div>
      <div className='h-full grid grid-rows-[1fr_4fr]'>
        <div className='flex flex-col justify-between'>
          <StatusList
            safe={safeCount}
            evacuated={evacuatedCount}
            affected={affectedCount}
            missing={missingCount}
          />
          <div>
            <Select
              label="Filter status"
              placeholder="Select a status"
              selectedKeys={selectedStatuses}
              selectionMode="multiple"
              onSelectionChange={handleStatusChange}
              className='cursor-pointer'
            >
              {allStatusOptions.map((statusOption) => (
                <SelectItem key={statusOption.key}>{statusOption.label}</SelectItem>
              ))}
            </Select>
          </div>
        </div>
        <div className='pt-4 h-120'>
          <div className="flex justify-between grid-cols-1 items-center mb-2">
              <div className="mt-2 text-sm text-gray-600">
                <strong>Selected:</strong> {getSelectedStatusText()}
              </div>
            <div className="">
              {`Showing: ${filteredStatusCount} of ${statusCount}`}
            </div>
            {selectedItem && (
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear Selection
              </button>
            )}
          </div>
          {selectedItem ? (
            <StatusCard
            id={selectedItem.id}
            picture={selectedItem.picture}
            firstName={selectedItem.firstName}
            lastName={selectedItem.lastName}
            status={selectedItem.status}
            loc={selectedItem.loc}
            date={selectedItem.date}
            time={selectedItem.time}
            description={selectedItem.description}
            image={selectedItem.image}
            person={selectedItem.person}
            contact={selectedItem.contact}
          />
          ): (
            <div className='text-center flex h-full items-center justify-center'>Selected marker display here</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Status;
