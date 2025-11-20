import { Map } from '@/components/ui/Map';
import { CustomLegend } from '@/config/constant';
import { useMapStyleStore } from '@/stores/useMapStyleStore';

const Earthquake = () => {
  const styleUrl = useMapStyleStore(state => state.styleUrl);

  // Separated earthquake data
  const earthquakeData = [
    { uid: 'eq1', lat: 14.2965, lng: 120.7925, severity: 'light' as const, magnitude: 4.2 },
    { uid: 'eq2', lat: 14.3, lng: 120.8, severity: 'moderate' as const, magnitude: 5.4 },
    { uid: 'eq3', lat: 14.28, lng: 120.78, severity: 'strong' as const, magnitude: 6.1 },
  ];

  // Separated status data
  const statusData = [
    { uid: 'st1', lat: 14.31, lng: 120.75, condition: 'safe' as const },
    { uid: 'st2', lat: 14.29, lng: 120.81, condition: 'evacuated' as const },
    { uid: 'st3', lat: 14.32, lng: 120.77, condition: 'affected' as const },
  ];

  return (
    <div className="w-full h-screen">
      <div className="w-full h-[75%] grid grid-cols-3 mb-4 gap-4">
        <div className="col-span-2 rounded-xl overflow-hidden">
          <Map
            earthquakeData={earthquakeData}
            statusData={statusData}
            center={[14.2965, 120.7925]}
            zoom={1}
            minZoom={10}
            maxZoom={13}
            height="100%"
            // Custom circle styling
            circleRadius={10}
            circleOpacity={0.9}
            circleStrokeWidth={3}
            circleStrokeColor="#ffffff"
            overlayComponent={CustomLegend(styleUrl)}
            overlayPosition="bottomleft"
          />
        </div>
        <div className="border">data</div>
      </div>
      <div className="w-full h-screen border"></div>
    </div>
  );
};

export default Earthquake;
