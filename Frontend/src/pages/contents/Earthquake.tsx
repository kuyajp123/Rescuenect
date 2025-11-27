import { Map } from '@/components/ui/Map';
import { EarthquakeCard } from '@/components/ui/card/EarthquakeCard';
import { StatusCard } from '@/components/ui/card/StatusCard';
import { CustomLegend, getEarthquakeSeverityColor, severityLevels } from '@/config/constant';
import earthquakesJson from '@/data/earthquakeData.json'; // temporary
import statusDataJson from '@/data/statusData.json'; // temporary
import { getSelectedStatusText } from '@/helper/commonHelpers';
import { useEarthquakeStore } from '@/stores/useEarthquakeStore';
import { useMapStyleStore } from '@/stores/useMapStyleStore';
import { useStatusStore } from '@/stores/useStatusStore';
import type { EarthquakeGeoJSONCollection } from '@/types/types';
import { convertGeoJSONCollectionToProcessed } from '@/utils/earthquakeAdapter';
import { Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { Earth, MapPin } from 'lucide-react';
import { useState } from 'react';
useStatusStore;
useEarthquakeStore;
statusDataJson;
earthquakesJson;

// status data from JSON static data
// const statusData = statusDataJson.filter(item => item.category.includes('earthquake')); // temporary

const categories = [
  { key: 'earthquake', label: 'Show Earthquake', icon: <MapPin size={20} /> },
  { key: 'status', label: 'Show EQ related Status', icon: <Earth size={20} /> },
];

const severityIcons = (level: any) => (
  <span
    className="w-4 h-4 rounded-full inline-block border border-gray-300"
    style={{ backgroundColor: getEarthquakeSeverityColor(level) }}
  />
);

const Earthquake = () => {
  const [selectedCategory, setSelectedCategory] = useState(new Set(['earthquake']));
  const [severity, setSeverity] = useState(new Set(['all']));
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedItemType, setSelectedItemType] = useState<'earthquake' | 'status' | null>(null);
  const earthquakes = useEarthquakeStore(state => state.earthquakes);
  const styleUrl = useMapStyleStore(state => state.styleUrl);
  const allstatusData = useStatusStore(state => state.statusData);

  const statusData = allstatusData.filter(item => item.category.includes('earthquake'));

  // useEffect(() => {
  //   console.log('status: ', JSON.stringify(allstatusData, null, 2));
  // }, [allstatusData]);

  // Flag to switch between data sources for testing
  const useJsonData = false; // Set to true to use JSON data, false for database data

  // Get earthquake data from appropriate source
  const processedEarthquakes = useJsonData
    ? convertGeoJSONCollectionToProcessed(earthquakesJson as unknown as EarthquakeGeoJSONCollection)
    : earthquakes || [];

  // Convert to map marker format
  const earthquakeData = processedEarthquakes.map(earthquake => ({
    uid: earthquake.id,
    lat: earthquake.coordinates.latitude,
    lng: earthquake.coordinates.longitude,
    severity: earthquake.severity,
    magnitude: earthquake.magnitude,
    place: earthquake.place,
    time: earthquake.time,
    tsunami_warning: earthquake.tsunami_warning,
    usgs_url: earthquake.usgs_url,
    priority: earthquake.priority,
    impact_radii: earthquake.impact_radii,
  }));

  const severityOptions = severityLevels.map(s => s.level);

  const allSeveritySelected = severityOptions.every(s => severity.has(s));

  const handleSelectCategory = (keys: any) => {
    const newKeys = new Set(Array.from(keys).map(String));

    if (newKeys.has('earthquake') && newKeys.has('status')) {
      setSelectedCategory(new Set(categories.map(s => s.key)));
      return;
    }

    if (newKeys.has('earthquake') && !newKeys.has('status')) {
      setSelectedCategory(new Set(['earthquake']));
      return;
    }

    if (newKeys.has('status') && !newKeys.has('earthquake')) {
      setSelectedCategory(new Set(['status']));
      return;
    }

    if (newKeys.size === 0) {
      return setSelectedCategory(new Set());
    }

    return setSelectedCategory(new Set(['earthquake']));
  };

  // Dynamic select/unselect option
  const selectAllOption = {
    key: 'all',
    label: allSeveritySelected ? 'Unselect All' : 'Select All',
    icon: undefined,
  };

  const allSeverityOptions = [
    selectAllOption,
    ...severityLevels.map(s => ({
      key: s.level,
      label: s.label,
      icon: severityIcons(s.level),
    })),
  ];

  const handleSelectSeverity = (keys: any) => {
    const newKeys = new Set(Array.from(keys).map(String));

    // If "all" was just selected/deselected
    if (newKeys.has('all') !== severity.has('all')) {
      if (newKeys.has('all')) {
        setSeverity(new Set(['all', ...severityOptions]));
      } else {
        // Unselect all
        setSeverity(new Set());
      }
    } else {
      // Individual status selection/deselection
      const individualSeverity = [...newKeys].filter(key => key !== 'all');

      if (individualSeverity.length === severityOptions.length) {
        // If all individual statuses are selected, also include "all"
        setSeverity(new Set(['all', ...severityOptions]));
      } else {
        // Only individual selections, no "all"
        setSeverity(new Set(individualSeverity));
      }
    }
  };

  // Filter earthquake data based on selected severity
  const getFilteredEarthquakeData = () => {
    if (!selectedCategory.has('earthquake')) return [];

    // If "all" is selected or all severities are selected, return all earthquake data
    if (severity.has('all') || allSeveritySelected) {
      return earthquakeData;
    }

    // If no severity is selected, return empty array
    if (severity.size === 0) {
      return [];
    }

    // Filter by selected severities
    return earthquakeData.filter(earthquake => severity.has(earthquake.severity));
  };

  // Filter status data based on category selection
  const getFilteredStatusData = () => {
    if (!selectedCategory.has('status')) return [];
    return statusData;
  };

  // Get filtered data for display
  const filteredEarthquakeData = getFilteredEarthquakeData();
  const filteredStatusData = getFilteredStatusData();

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-4" style={{ height: '100%', width: '100%' }}>
      <div className="rounded-lg overflow-hidden" style={{ height: '100%', width: '100%' }}>
        <Map
          earthquakeData={filteredEarthquakeData}
          statusData={filteredStatusData}
          center={[14.2965, 120.7925]}
          zoom={9}
          minZoom={8}
          maxZoom={15}
          height="100%"
          // Custom circle styling
          circleRadius={10}
          circleOpacity={0.9}
          circleStrokeWidth={3}
          circleStrokeColor="#ffffff"
          overlayComponent={CustomLegend(styleUrl, statusData)}
          overlayPosition="bottomleft"
          onMarkerClick={item => {
            // Determine if clicked item is earthquake or status
            const isEarthquake = 'magnitude' in item || 'severity' in item;
            if (isEarthquake) {
              // Find the full earthquake data from processed earthquakes
              const fullEarthquakeData = processedEarthquakes.find(eq => eq.id === item.uid);
              setSelectedItem(fullEarthquakeData);
              setSelectedItemType('earthquake');
              console.log('eq data: ', JSON.stringify(fullEarthquakeData, null, 2));
            } else {
              // Find the full status data
              const fullStatusData = filteredStatusData.find(status => status.uid === item.uid);
              setSelectedItem(fullStatusData);
              setSelectedItemType('status');
            }
          }}
        />
      </div>
      <div className="h-fit">
        <div className="flex flex-col">
          <Table aria-label="Example static collection table">
            <TableHeader>
              <TableColumn>Types</TableColumn>
              <TableColumn>Total</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow key="1">
                <TableCell className="flex flex-row gap-2">
                  <Earth size={20} />
                  Earthquakes
                </TableCell>
                <TableCell>{`${earthquakeData.length}`}</TableCell>
              </TableRow>
              <TableRow key="2">
                <TableCell className="flex flex-row gap-2">
                  <MapPin size={20} /> Status related Earthquakes
                </TableCell>
                <TableCell>{`${statusData.length}`}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="flex flex-row w-full">
            <div className=" w-full flex flex-col">
              <Select
                className="max-w-60"
                label="Category Show"
                placeholder="Select Category"
                defaultSelectedKeys={selectedCategory}
                selectionMode="multiple"
                onSelectionChange={handleSelectCategory}
              >
                {categories.map(category => (
                  <SelectItem key={category.key} startContent={category.icon}>
                    {category.label}
                  </SelectItem>
                ))}
              </Select>
              <p className="mt-2 text-sm opacity-70">
                Selected:{' '}
                {getSelectedStatusText({
                  allStatusesSelected: selectedCategory.size === categories.length,
                  selectedStatuses: selectedCategory,
                  statusOptions: categories.map(c => c.key),
                  statuses: categories,
                })}
              </p>
            </div>
            <div className=" w-full flex flex-col">
              <Select
                className="max-w-60"
                label="Earthquake Severity"
                placeholder="Select Severity"
                selectedKeys={severity}
                selectionMode="multiple"
                onSelectionChange={handleSelectSeverity}
                maxListboxHeight={280}
              >
                {allSeverityOptions.map(option => (
                  <SelectItem key={option.key} startContent={option.icon}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
              <div className="mt-2 flex flex-col gap-2">
                <p className="text-sm opacity-70">
                  Selected:{' '}
                  {getSelectedStatusText({
                    allStatusesSelected: allSeveritySelected,
                    selectedStatuses: severity,
                    statusOptions: severityOptions,
                    statuses: severityLevels.map(s => ({ key: s.level, label: s.label })),
                  })}
                </p>
                <div>{`Showing: ${filteredEarthquakeData.length} of ${earthquakeData.length} earthquakes`}</div>
              </div>
            </div>
          </div>
        </div>
        <div className=" h-120">
          <div className="w-full flex flex-row justify-end">
            <h3 className="text-lg font-semibold text-left flex-grow px-3 py-1">
              {selectedItem ? (selectedItemType === 'earthquake' ? 'Earthquake Details' : 'Status Details') : ''}
            </h3>
            {selectedItem && (
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setSelectedItemType(null);
                }}
                className="text-sm opacity-70 hover:opacity-100 cursor-pointer px-3 py-1"
              >
                Close
              </button>
            )}
          </div>
          {selectedItem ? (
            selectedItemType === 'earthquake' ? (
              <EarthquakeCard earthquake={selectedItem} />
            ) : (
              <StatusCard
                uid={selectedItem.uid}
                profileImage={selectedItem.profileImage}
                firstName={selectedItem.firstName}
                lastName={selectedItem.lastName}
                note={selectedItem.note}
                condition={selectedItem.condition}
                location={selectedItem.location || 'Unknown'}
                createdAt={selectedItem.createdAt}
                image={selectedItem.image} // || 'https://heroui.com/images/hero-card-complete.jpeg'
                phoneNumber={selectedItem.phoneNumber}
                expiresAt={selectedItem.expiresAt}
                vid={selectedItem.versionId || selectedItem.vid || 'N/A'}
                category={selectedItem.category}
                people={selectedItem.people}
              />
            )
          ) : (
            <div className="h-full flex items-center justify-center rounded-lg">
              <p className="text-gray-500 text-center">
                Select an earthquake or status marker
                <br />
                on the map to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Earthquake;
