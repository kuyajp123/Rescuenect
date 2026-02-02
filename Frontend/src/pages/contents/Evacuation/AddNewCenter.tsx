import EvacuationCenterForm from '@/components/ui/form/EvacuationCenterForm';
import { Map } from '@/components/ui/Map';
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
          overlayPosition="topright"
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
