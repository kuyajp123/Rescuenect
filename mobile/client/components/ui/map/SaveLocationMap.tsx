import { MapView } from '@/components/ui/map/MapView';
import MapboxGL from '@rnmapbox/maps';
import React, { useState } from 'react';

interface SaveLocationMapProps {
  onLocationSelect?: (coordinates: [number, number]) => void;
  initialCoordinate?: [number, number];
}

export const SaveLocationMap: React.FC<SaveLocationMapProps> = ({
  onLocationSelect,
  initialCoordinate = [120.7752839, 14.2919325],
}) => {
  const [mapStyle, setMapStyle] = useState<MapboxGL.StyleURL>(MapboxGL.StyleURL.Street);

  const handleLocationSelect = (coordinates: [number, number]) => {
    console.log('Location selected:', coordinates);
    onLocationSelect?.(coordinates);
  };

  return (
    <MapView
      mapStyle={mapStyle}
      onMapStyleChange={setMapStyle}
      onPress={handleLocationSelect}
      showButtons={false} // No back/style buttons for save location
      showStyleSelector={false}
      interactive={true} // Allow tapping to select location
      centerCoordinate={initialCoordinate}
      zoomLevel={14} // Closer zoom for location selection
      show3DBuildings={false} // Simpler view for location selection
    />
  );
};
