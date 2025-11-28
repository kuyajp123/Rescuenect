import EvacuationCenterForm from '@/components/ui/form/EvacuationCenterForm';
import { Map } from '@/components/ui/Map';
import { useState } from 'react';

const Add = () => {
  const [mapClickPosition, setMapClickPosition] = useState<{ lat: number; lng: number } | null>(null);

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    setMapClickPosition(latlng);
  };

  return (
    <div className="w-full h-full grid grid-cols-2 gap-4">
      <div className="h-full">
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
      <div className="h-full">
        <EvacuationCenterForm coordinates={mapClickPosition} />
      </div>
    </div>
  );
};

export default Add;
