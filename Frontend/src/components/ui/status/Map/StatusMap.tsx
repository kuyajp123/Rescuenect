import { Map } from './index';
import condition from '@/data/statusData.json';

// Example: condition Map - shows how to use the reusable Map component
export const conditionMap = () => {
  const handleMarkerClick = (item: any) => {
    console.log('Marker clicked:', item);
    // You can add your custom logic here (e.g., open modal, navigate, etc.)
  };

  return (
    <Map
      data={condition}
      center={[14.2965, 120.7925]}
      zoom={13}
      minZoom={10}
      maxZoom={18}
      height="500px"
      width="100%"
      onMarkerClick={handleMarkerClick}
      showCoordinates={true}
    />
  );
};

// Example: Custom popup renderer
export const conditionMapWithCustomPopup = () => {
  const customPopupRenderer = (item: any) => (
    <div className="p-2 min-w-[200px]">
      <div className="flex items-center space-x-2 mb-2">
        <img
          src={item.picture}
          alt={`${item.firstName} ${item.lastName}`}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold">
            {item.firstName} {item.lastName}
          </h3>
          <span className={`text-sm px-2 py-1 rounded ${getconditionBadgeColor(item.condition)}`}>{item.condition}</span>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <p>
          <strong>Date:</strong> {item.date}
        </p>
        <p>
          <strong>Time:</strong> {item.time}
        </p>
        {item.loc && (
          <p>
            <strong>Location:</strong> {item.loc}
          </p>
        )}
        {item.contact && (
          <p>
            <strong>Contact:</strong> {item.contact}
          </p>
        )}
      </div>

      {item.description && <div className="mt-2 p-2 bg-gray-50 rounded text-sm">{item.description}</div>}
    </div>
  );

  const getconditionBadgeColor = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'safe':
        return 'bg-green-100 text-green-800';
      case 'evacuated':
        return 'bg-blue-100 text-blue-800';
      case 'missing':
        return 'bg-red-100 text-red-800';
      case 'affected':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return <Map data={condition} renderPopup={customPopupRenderer} showCoordinates={false} height="600px" />;
};

// Example: Filtered map (only missing persons)
export const MissingPersonsMap = () => {
  const missingPersons = condition.filter(person => person.condition === 'missing');

  return (
    <Map data={missingPersons} center={[14.2965, 120.7925]} zoom={14} height="400px" className="border rounded-lg" />
  );
};
