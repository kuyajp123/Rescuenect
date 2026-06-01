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
  clientId?: string;
}

export const EarthquakeCard = ({ earthquake, clientId }: EarthquakeCardProps) => {
  if (!earthquake) {
    return null;
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const clientImpact = clientId
    ? earthquake.clientImpacts?.find(impact => impact.clientId === clientId)
    : earthquake.clientImpacts?.[0];
  const distance = clientImpact?.distanceKm ?? earthquake.distance_km;

  const dynamicRows = [
    {
      key: 'severity',
      label: 'Severity',
      value: earthquake.severity.charAt(0).toUpperCase() + earthquake.severity.slice(1),
    },
    { key: 'depth', label: 'Depth', value: `${earthquake.coordinates.depth} km` }, // Would need depth data from API
    { key: 'location', label: 'Location', value: earthquake.place },
    { key: 'time', label: 'Time occurred', value: formatDate(earthquake.time) },
    ...(typeof distance === 'number'
      ? [
          {
            key: 'distance',
            label: clientImpact?.clientName ? `Distance from ${clientImpact.clientName}` : 'Distance from client center',
            value: `~${Math.round(distance)} km`,
          },
        ]
      : []),
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
