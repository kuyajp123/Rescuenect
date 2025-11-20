import { Map } from '@/components/ui/Map';
import { CustomLegend } from '@/config/constant';
import { useEarthquakeStore } from '@/stores/useEarthquakeStore';
import { useMapStyleStore } from '@/stores/useMapStyleStore';
import { useStatusStore } from '@/stores/useStatusStore';

const Earthquake = () => {
  const earthquakes = useEarthquakeStore(state => state.earthquakes);
  const styleUrl = useMapStyleStore(state => state.styleUrl);
  const statusData = useStatusStore(state => state.statusData);

  // Transform earthquake data from store to Map component format
  const earthquakeData =
    earthquakes?.map(earthquake => ({
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
      impact_radii: earthquake.impact_radii, // Include the radius estimations
    })) || [];

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
            overlayComponent={CustomLegend(styleUrl, statusData)}
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
