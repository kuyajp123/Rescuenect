import EvacuationCenterForm from '@/components/ui/form/EvacuationCenterForm';
import { Map } from '@/components/ui/Map';
import { Button } from '@heroui/react';
import { useState } from 'react';

const Add = () => {
  const [mapClickPosition, setMapClickPosition] = useState<{ lat: number; lng: number } | null>(null);

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    setMapClickPosition(latlng);
  };

  return (
    <div className="w-full h-full flex flex-col md:grid md:grid-cols-2 gap-4 overflow-y-auto md:overflow-hidden">
      <div className="h-[45vh] md:h-full min-h-75">
        <Map
          data={
            mapClickPosition ? [{ uid: 'clicked-point', lat: mapClickPosition.lat, lng: mapClickPosition.lng }] : []
          }
          onMapClick={handleMapClick}
          popupType="coordinates"
          markerType="default"
          overlayComponent={
            <div className="rounded-md bg-white/90 dark:bg-black/70 backdrop-blur px-3 py-2 shadow text-xs text-gray-800 dark:text-gray-100">
              {mapClickPosition ? (
                <div className="text-sm">
                  <p className="font-semibold">Selected Coordinates</p>
                  <p className="opacity-80">
                    Lat: {mapClickPosition.lat.toFixed(6)}, Lng: {mapClickPosition.lng.toFixed(6)}
                  </p>
                  <Button onPress={() => setMapClickPosition(null)}>Clear</Button>
                </div>
              ) : (
                <div className="space-y-0.5 text-sm">
                  <p className="font-semibold">Set evacuation center location</p>
                  <p className="opacity-80">Click the map to drop a marker.</p>
                </div>
              )}
            </div>
          }
          overlayPosition="bottomright"
          overlayClassName="custom-map-overlay"
        />
      </div>
      <div className="h-auto md:h-full">
        <EvacuationCenterForm coordinates={mapClickPosition} />
      </div>
    </div>
  );
};

export default Add;
