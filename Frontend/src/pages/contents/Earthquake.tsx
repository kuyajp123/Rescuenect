import { Map } from '@/components/ui/Map';
import { EarthquakeCard } from '@/components/ui/card/EarthquakeCard';
import { StatusCard } from '@/components/ui/card/StatusCard';
import { CustomLegend, getEarthquakeSeverityColor, severityLevels } from '@/config/constant';
import earthquakes from '@/data/earthquakeData.json';
import statusDataJson from '@/data/statusData.json'; // temporary
import { getSelectedStatusText } from '@/helper/commonHelpers';
import { useEarthquakeStore } from '@/stores/useEarthquakeStore';
import { useMapStyleStore } from '@/stores/useMapStyleStore';
import { useStatusStore } from '@/stores/useStatusStore';
import { type StatusData } from '@/types/types';
import { Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { Timestamp } from 'firebase/firestore';
import { Earth, MapPin } from 'lucide-react';
import { useState } from 'react';
useStatusStore;
useEarthquakeStore;
Timestamp;
StatusCard;
const statusData = statusDataJson as unknown as StatusData[]; // temporary

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
  // const earthquakes = useEarthquakeStore(state => state.earthquakes);
  const styleUrl = useMapStyleStore(state => state.styleUrl);
  // const statusData = useStatusStore(state => state.statusData);

  // Transform earthquake data from JSON to Map component format
  const earthquakeData =
    earthquakes?.features?.map((earthquake: any) => {
      // Extract coordinates from GeoJSON format [longitude, latitude, depth]
      const [lng, lat] = earthquake.geometry.coordinates;

      // Determine severity based on magnitude
      const getSeverityFromMagnitude = (
        mag: number
      ): 'micro' | 'minor' | 'light' | 'moderate' | 'strong' | 'major' | 'great' => {
        if (mag < 2.0) return 'micro';
        if (mag < 4.0) return 'minor';
        if (mag < 5.0) return 'light';
        if (mag < 6.0) return 'moderate';
        if (mag < 7.0) return 'strong';
        if (mag < 8.0) return 'major';
        return 'great';
      };

      return {
        uid: earthquake.id,
        lat: lat,
        lng: lng,
        severity: getSeverityFromMagnitude(earthquake.properties.mag),
        magnitude: earthquake.properties.mag,
        place: earthquake.properties.place,
        time: earthquake.properties.time,
        tsunami_warning: earthquake.properties.tsunami === 1,
        usgs_url: earthquake.properties.url,
        priority: 'normal', // Default priority since not in JSON
        // Generate mock impact radii based on magnitude for testing
        impact_radii: {
          felt_radius_km: earthquake.properties.mag * 15,
          moderate_shaking_radius_km: earthquake.properties.mag * 8,
          strong_shaking_radius_km: earthquake.properties.mag * 4,
        },
      };
    }) || [];

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
    <div className="w-full min-h-screen">
      <div className="w-full h-[80%] gap-4 grid grid-cols-3">
        <div className="col-span-2 rounded-xl overflow-hidden">
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
                // Find the full earthquake data
                const fullEarthquakeData = filteredEarthquakeData.find(eq => eq.uid === item.uid);
                setSelectedItem(fullEarthquakeData);
                setSelectedItemType('earthquake');
              } else {
                // Find the full status data
                const fullStatusData = filteredStatusData.find(status => status.uid === item.uid);
                setSelectedItem(fullStatusData);
                setSelectedItemType('status');
              }
            }}
          />
        </div>
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="flex-shrink-0">
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
          </div>
          <div className="flex flex-row gap-4 w-full flex-shrink-0">
            <div className="flex flex-col w-full">
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
            <div className="flex flex-col w-full">
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
          <div className="flex flex-col  h-full">
            <div className="w-full flex flex-row justify-between items-center mb-3 flex-shrink-0">
              <h3 className="text-lg font-semibold">
                {selectedItem ? (selectedItemType === 'earthquake' ? 'Earthquake Details' : 'Status Details') : ''}
              </h3>
              {selectedItem && (
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setSelectedItemType(null);
                  }}
                  className="text-sm opacity-70 hover:opacity-100 cursor-pointer px-3 py-1 rounded border"
                >
                  Close
                </button>
              )}
            </div>
            <div className="flex-1 min-h-0">
              {selectedItem ? (
                selectedItemType === 'earthquake' ? (
                  <EarthquakeCard earthquake={selectedItem} />
                ) : (
                  <div className="h-full overflow-y-auto">
                    <StatusCard
                      uid={selectedItem.uid}
                      profileImage={
                        selectedItem.profileImage || 'https://avatars.githubusercontent.com/u/86160567?s=200&v=4'
                      }
                      firstName={selectedItem.firstName}
                      lastName={selectedItem.lastName}
                      note={selectedItem.note}
                      condition={selectedItem.condition}
                      location={selectedItem.location || 'Unknown'}
                      createdAt={selectedItem.createdAt}
                      image={selectedItem.image || 'https://heroui.com/images/hero-card-complete.jpeg'}
                      phoneNumber={selectedItem.phoneNumber}
                      expiresAt={selectedItem.expiresAt}
                      vid={selectedItem.versionId || selectedItem.vid || 'N/A'}
                    />
                  </div>
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
      </div>
      <div className="w-full min-h-screen border p-6">
        {/* Bottom section - Full screen height for additional content */}
        <div className="w-full h-full">
          <h2 className="text-2xl font-bold mb-4">Additional Earthquake Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full">
            {/* Placeholder content areas - you can replace these with your actual content */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-2">Historical Data</h3>
              <p className="text-gray-600">Add historical earthquake analysis charts here...</p>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-2">Risk Assessment</h3>
              <p className="text-gray-600">Add risk assessment tools and metrics here...</p>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-2">Alert Settings</h3>
              <p className="text-gray-600">Add notification and alert configuration here...</p>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-2">Reports</h3>
              <p className="text-gray-600">Add detailed reports and exports here...</p>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-2">Emergency Contacts</h3>
              <p className="text-gray-600">Add emergency contact management here...</p>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibent mb-2">Additional Tools</h3>
              <p className="text-gray-600">Add more earthquake monitoring tools here...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earthquake;
