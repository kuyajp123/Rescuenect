import { UnifiedEarthquake } from '@/types/types';
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { Earth } from 'lucide-react';

interface EarthquakeCardProps {
  earthquake?: UnifiedEarthquake;
}

export const EarthquakeCard = ({ earthquake }: EarthquakeCardProps) => {
  if (!earthquake) {
    return null;
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Naic, Cavite coordinates
  const naicCoords = { lat: 14.2965, lng: 120.7925 };
  const distance = calculateDistance(
    naicCoords.lat,
    naicCoords.lng,
    earthquake.coordinates.latitude,
    earthquake.coordinates.longitude
  );

  const dynamicRows = [
    {
      key: 'severity',
      label: 'Severity',
      value: earthquake.severity.charAt(0).toUpperCase() + earthquake.severity.slice(1),
    },
    { key: 'depth', label: 'Depth', value: 'N/A' }, // Would need depth data from API
    { key: 'location', label: 'Location', value: earthquake.place },
    { key: 'time', label: 'Time occurred', value: formatDate(earthquake.time) },
    { key: 'distance', label: 'Distance from Naic, Cavite', value: `~${distance} km` },
    { key: 'tsunami', label: 'Tsunami Warning', value: earthquake.tsunami_warning ? 'Yes' : 'No' },
  ];

  return (
    <Card className="max-w-full h-full flex flex-col">
      <CardHeader className="flex flex-row justify-between gap-3 flex-shrink-0">
        <div className="flex flex-row gap-2">
          <Earth color="#0EA5E9" />
          <div className="flex flex-col">
            <p className="text-lg font-bold">Earthquake Details</p>
          </div>
        </div>
        <p className="text-gray-500">Event id: {earthquake.id}</p>
      </CardHeader>
      <CardBody className="flex-1 overflow-y-auto">
        <p className="text-3xl font-bold ml-3 mb-2">M {earthquake.magnitude}</p>
        <Table hideHeader removeWrapper aria-label="Earthquake details table">
          <TableHeader>
            <TableColumn>LABEL</TableColumn>
            <TableColumn>VALUE</TableColumn>
          </TableHeader>
          <TableBody>
            {dynamicRows.map(item => (
              <TableRow key={item.key}>
                <TableCell>{item.label}</TableCell>
                <TableCell>{item.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
};
