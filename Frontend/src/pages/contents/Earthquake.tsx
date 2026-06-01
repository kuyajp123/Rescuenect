import { Map } from '@/components/ui/Map';
import { EarthquakeCard } from '@/components/ui/card/EarthquakeCard';
import { StatusCard } from '@/components/ui/card/StatusCard';
import { CustomLegend, getEarthquakeSeverityColor, severityLevels } from '@/config/constant';
import {
  getClientEarthquakeMapZoomSettings,
  getClientConfiguredMapBounds,
  getClientMapCenter,
} from '@/helper/clientMapScope';
import { getSelectedStatusText } from '@/helper/commonHelpers';
import { useAuth } from '@/stores/useAuth';
import { useEarthquakeStore } from '@/stores/useEarthquakeStore';
import { useMapStyleStore } from '@/stores/useMapStyleStore';
import { useStatusStore } from '@/stores/useStatusStore';
import type { ProcessedEarthquake } from '@/types/types';
import { convertProcessedEarthquakeToMapMarker } from '@/utils/earthquakeAdapter';
import { Button, Checkbox, Chip, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { Activity, CalendarDays, Earth, History, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const HISTORY_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const categories = [
  { key: 'earthquake', label: 'Show Earthquake', icon: <MapPin size={20} /> },
  { key: 'status', label: 'Show EQ related Status', icon: <Earth size={20} /> },
];

const severityIcons = (level: string) => (
  <span
    className="w-4 h-4 rounded-full inline-block border border-gray-300"
    style={{ backgroundColor: getEarthquakeSeverityColor(level) }}
  />
);

const getPhilippineDayKey = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

const formatEventDate = (timestamp: number) =>
  new Date(timestamp).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const formatCompactDate = (timestamp: number) =>
  new Date(timestamp).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const getClientDistance = (earthquake: ProcessedEarthquake, clientId?: string) => {
  const impact = clientId
    ? earthquake.clientImpacts?.find(item => item.clientId === clientId)
    : earthquake.clientImpacts?.[0];
  return impact?.distanceKm ?? earthquake.distance_km ?? null;
};

const Earthquake = () => {
  const severityOptions = severityLevels.map(s => s.level);
  const [selectedCategory, setSelectedCategory] = useState(new Set(['earthquake']));
  const [severity, setSeverity] = useState(new Set(['all', ...severityOptions]));
  const [selectedEarthquakeIds, setSelectedEarthquakeIds] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedItemType, setSelectedItemType] = useState<'earthquake' | 'status' | null>(null);

  const earthquakes = useEarthquakeStore(state => state.earthquakes);
  const styleUrl = useMapStyleStore(state => state.styleUrl);
  const allstatusData = useStatusStore(state => state.statusData);
  const userData = useAuth(state => state.userData);
  const mapCenter = getClientMapCenter(userData);
  const mapZoom = getClientEarthquakeMapZoomSettings(userData);
  const clientId = userData?.clientId ?? undefined;

  const statusData = allstatusData.filter(item => item.category.includes('earthquake'));

  const historyEarthquakes = useMemo(() => {
    const retentionStart = Date.now() - HISTORY_DAYS * DAY_MS;
    return [...(earthquakes || [])]
      .filter(earthquake => typeof earthquake.time === 'number' && earthquake.time >= retentionStart)
      .sort((left, right) => right.time - left.time);
  }, [earthquakes]);

  const todayKey = getPhilippineDayKey(Date.now());
  const todaysEarthquakes = useMemo(
    () => historyEarthquakes.filter(earthquake => getPhilippineDayKey(earthquake.time) === todayKey),
    [historyEarthquakes, todayKey]
  );

  const historyIdsKey = historyEarthquakes.map(earthquake => earthquake.id).join('|');
  const todayIdsKey = todaysEarthquakes.map(earthquake => earthquake.id).join('|');

  useEffect(() => {
    const validIds = new Set(historyEarthquakes.map(earthquake => earthquake.id));
    const todayIds = todaysEarthquakes.map(earthquake => earthquake.id);

    setSelectedEarthquakeIds(prev => {
      const next = new Set([...prev].filter(id => validIds.has(id)));
      todayIds.forEach(id => next.add(id));
      return next;
    });
  }, [historyIdsKey, todayIdsKey]);

  const selectedEarthquakes = historyEarthquakes.filter(earthquake => selectedEarthquakeIds.has(earthquake.id));
  const allSeveritySelected = severityOptions.every(s => severity.has(s));

  const selectedVisibleEarthquakes = selectedEarthquakes.filter(earthquake => {
    if (!selectedCategory.has('earthquake')) return false;
    if (severity.has('all') || allSeveritySelected) return true;
    if (severity.size === 0) return false;
    return severity.has(earthquake.severity);
  });

  const earthquakeData = selectedVisibleEarthquakes.map(convertProcessedEarthquakeToMapMarker);
  const filteredStatusData = selectedCategory.has('status') ? statusData : [];

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
      setSelectedCategory(new Set());
      return;
    }

    setSelectedCategory(new Set(['earthquake']));
  };

  const allSeverityOptions = [
    {
      key: 'all',
      label: allSeveritySelected ? 'Unselect All' : 'Select All',
      icon: undefined,
    },
    ...severityLevels.map(s => ({
      key: s.level,
      label: s.label,
      icon: severityIcons(s.level),
    })),
  ];

  const handleSelectSeverity = (keys: any) => {
    const newKeys = new Set(Array.from(keys).map(String));

    if (newKeys.has('all') !== severity.has('all')) {
      setSeverity(newKeys.has('all') ? new Set(['all', ...severityOptions]) : new Set());
      return;
    }

    const individualSeverity = [...newKeys].filter(key => key !== 'all');
    setSeverity(
      individualSeverity.length === severityOptions.length
        ? new Set(['all', ...severityOptions])
        : new Set(individualSeverity)
    );
  };

  const toggleEarthquake = (earthquake: ProcessedEarthquake, isSelected: boolean) => {
    setSelectedEarthquakeIds(prev => {
      const next = new Set(prev);
      if (isSelected) {
        next.add(earthquake.id);
      } else {
        next.delete(earthquake.id);
      }
      return next;
    });
    setSelectedItem(earthquake);
    setSelectedItemType('earthquake');
  };

  const showToday = () => {
    setSelectedEarthquakeIds(new Set(todaysEarthquakes.map(earthquake => earthquake.id)));
    setSelectedItem(todaysEarthquakes[0] ?? null);
    setSelectedItemType(todaysEarthquakes[0] ? 'earthquake' : null);
  };

  const showAllHistory = () => {
    setSelectedEarthquakeIds(new Set(historyEarthquakes.map(earthquake => earthquake.id)));
  };

  const clearEarthquakes = () => {
    setSelectedEarthquakeIds(new Set());
    if (selectedItemType === 'earthquake') {
      setSelectedItem(null);
      setSelectedItemType(null);
    }
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)] gap-4 w-full h-full">
      <div className="rounded-lg overflow-hidden w-full h-[45vh] lg:h-full">
        <Map
          earthquakeData={earthquakeData}
          statusData={filteredStatusData}
          center={mapCenter}
          maxBounds={getClientConfiguredMapBounds(userData)}
          zoom={mapZoom.zoom}
          minZoom={mapZoom.minZoom}
          maxZoom={mapZoom.maxZoom}
          height="100%"
          circleRadius={10}
          circleOpacity={0.9}
          circleStrokeWidth={3}
          circleStrokeColor="#ffffff"
          overlayComponent={CustomLegend(styleUrl, statusData)}
          overlayPosition="bottomleft"
          onMarkerClick={item => {
            const isEarthquake = 'magnitude' in item || 'severity' in item;
            if (isEarthquake) {
              const fullEarthquakeData = historyEarthquakes.find(eq => eq.id === item.uid);
              setSelectedItem(fullEarthquakeData);
              setSelectedItemType('earthquake');
            } else {
              const fullStatusData = filteredStatusData.find(status => status.uid === item.uid);
              setSelectedItem(fullStatusData);
              setSelectedItemType('status');
            }
          }}
        />
      </div>

      <div className="h-fit lg:h-full overflow-y-auto">
        <div className="flex flex-col gap-4">
          <Table aria-label="Earthquake summary">
            <TableHeader>
              <TableColumn>Types</TableColumn>
              <TableColumn>Total</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow key="today">
                <TableCell className="flex flex-row gap-2">
                  <Activity size={20} />
                  Today's earthquakes
                </TableCell>
                <TableCell>{todaysEarthquakes.length}</TableCell>
              </TableRow>
              <TableRow key="history">
                <TableCell className="flex flex-row gap-2">
                  <History size={20} />
                  {HISTORY_DAYS}-day history
                </TableCell>
                <TableCell>{historyEarthquakes.length}</TableCell>
              </TableRow>
              <TableRow key="status">
                <TableCell className="flex flex-row gap-2">
                  <MapPin size={20} /> Status related earthquakes
                </TableCell>
                <TableCell>{statusData.length}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="rounded-lg border border-default-200 bg-content1 p-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold">Today</h3>
              <p className="text-sm text-default-500">
                {todaysEarthquakes.length > 0
                  ? `${todaysEarthquakes.length} earthquake record(s) detected today.`
                  : 'No earthquakes detected today in this client scope.'}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="flat" startContent={<CalendarDays size={16} />} onPress={showToday}>
                Show today
              </Button>
              <Button size="sm" variant="flat" startContent={<History size={16} />} onPress={showAllHistory}>
                Show all history
              </Button>
              <Button size="sm" variant="light" onPress={clearEarthquakes}>
                Clear map
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row w-full gap-4">
            <div className="w-full flex flex-col">
              <Select
                className="w-full sm:max-w-60"
                label="Category Show"
                placeholder="Select Category"
                selectedKeys={selectedCategory}
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
            <div className="w-full flex flex-col">
              <Select
                className="w-full sm:max-w-60"
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
              <div className="mt-2 flex flex-col gap-1">
                <p className="text-sm opacity-70">
                  Selected:{' '}
                  {getSelectedStatusText({
                    allStatusesSelected: allSeveritySelected,
                    selectedStatuses: severity,
                    statusOptions: severityOptions,
                    statuses: severityLevels.map(s => ({ key: s.level, label: s.label })),
                  })}
                </p>
                <p className="text-sm opacity-70">
                  Showing {earthquakeData.length} selected earthquake marker(s)
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-default-200 bg-content1">
            <div className="flex items-center justify-between gap-3 border-b border-default-200 px-4 py-3">
              <div>
                <h3 className="text-base font-semibold">Earthquake History</h3>
                <p className="text-xs text-default-500">
                  Select one or more records to show them on the map.
                </p>
              </div>
              <Chip size="sm" variant="flat" color="primary">
                {selectedEarthquakeIds.size} selected
              </Chip>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {historyEarthquakes.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-default-500">
                  No earthquake records found in the last {HISTORY_DAYS} days.
                </div>
              ) : (
                historyEarthquakes.map(earthquake => {
                  const isToday = getPhilippineDayKey(earthquake.time) === todayKey;
                  const distance = getClientDistance(earthquake, clientId);

                  return (
                    <div
                      key={earthquake.id}
                      className="flex gap-3 rounded-lg px-3 py-3 hover:bg-default-100 cursor-pointer"
                      onClick={() => {
                        setSelectedItem(earthquake);
                        setSelectedItemType('earthquake');
                      }}
                    >
                      <Checkbox
                        isSelected={selectedEarthquakeIds.has(earthquake.id)}
                        onValueChange={value => toggleEarthquake(earthquake, value)}
                        onClick={event => event.stopPropagation()}
                        aria-label={`Show earthquake ${earthquake.id} on map`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Chip size="sm" variant="flat" color={isToday ? 'danger' : 'default'}>
                            {isToday ? 'Today' : 'Historical'}
                          </Chip>
                          <Chip
                            size="sm"
                            variant="flat"
                            style={{ color: getEarthquakeSeverityColor(earthquake.severity) }}
                          >
                            M{earthquake.magnitude}
                          </Chip>
                          <span className="text-xs text-default-500">{formatCompactDate(earthquake.time)}</span>
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold">{earthquake.place}</p>
                        <p className="text-xs text-default-500">
                          Occurred {formatEventDate(earthquake.time)}
                          {typeof distance === 'number' ? ` - ${distance.toFixed(1)} km away` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="min-h-80">
            <div className="w-full flex flex-row justify-end">
              <h3 className="text-lg font-semibold text-left grow px-3 py-1">
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
                <EarthquakeCard earthquake={selectedItem} clientId={clientId} />
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
                  image={selectedItem.image}
                  phoneNumber={selectedItem.phoneNumber}
                  expiresAt={selectedItem.expiresAt}
                  vid={selectedItem.versionId || selectedItem.vid || 'N/A'}
                  category={selectedItem.category}
                  people={selectedItem.people}
                />
              )
            ) : (
              <div className="h-80 flex items-center justify-center rounded-lg">
                <p className="text-gray-500 text-center">
                  Select an earthquake history record
                  <br />
                  or a map marker to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earthquake;
