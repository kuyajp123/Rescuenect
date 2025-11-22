import { Map } from '@/components/ui/Map';
import { CustomLegend, getEarthquakeSeverityColor, severityLevels } from '@/config/constant';
import earthquakes from '@/data/earthquakeData.json';
import statusDataJson from '@/data/statusData.json'; // temporary
import { useEarthquakeStore } from '@/stores/useEarthquakeStore';
import { useMapStyleStore } from '@/stores/useMapStyleStore';
import { useStatusStore } from '@/stores/useStatusStore';
import { type StatusData } from '@/types/types';
import { Select, SelectItem } from '@heroui/react';
import { Earth, MapPin } from 'lucide-react';
import { useState } from 'react';
useStatusStore;
useEarthquakeStore;

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
  const [severity, setSeverity] = useState(new Set(['all']));
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
      icon: severityIcons(s.level), // 🔥 attach icon for this specific item
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

  return (
    <div className="w-full h-screen">
      <div className="w-full h-[75%] grid grid-cols-3 mb-4 gap-4">
        <div className="col-span-2 rounded-xl overflow-hidden">
          <Map
            earthquakeData={earthquakeData}
            statusData={statusData}
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
          />
        </div>
        <div className="border">
          <div className="flex flex-row gap-4 max-w-auto">
            <Select
              className="max-w-60"
              label="Category Show"
              placeholder="Select Category"
              defaultSelectedKeys={['earthquake']}
              selectionMode="multiple"
            >
              {categories.map(category => (
                <SelectItem  key={category.key} startContent={category.icon}>
                  {category.label}
                </SelectItem>
              ))}
            </Select>
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
          </div>
          <div></div>
        </div>
      </div>
      <div className="w-full h-screen border"></div>
    </div>
  );
};

export default Earthquake;
