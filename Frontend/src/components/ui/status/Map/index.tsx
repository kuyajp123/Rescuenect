import { MapContainer, Marker, Popup } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import safeIcon from 'leaflet/dist/images/marker-icon-green.png';
import evacuatedIcon from 'leaflet/dist/images/marker-icon-blue.png';
import affectedIcon from 'leaflet/dist/images/marker-icon-orange.png';
import missingIcon from 'leaflet/dist/images/marker-icon-red.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapMarkerData, MapProps } from '@/types/types';

const shadowUrl = markerShadow;
const iconSize: [number, number] = [25, 41];
const iconAnchor: [number, number] = [12, 41];
const popupAnchor: [number, number] = [1, -34];
const shadowSize: [number, number] = [41, 41];

const defaultIcon = new L.Icon({
  iconUrl: evacuatedIcon,
  shadowUrl: shadowUrl,
  iconSize: iconSize,
  iconAnchor: iconAnchor,
  popupAnchor: popupAnchor,
  shadowSize: shadowSize,
});

// Custom Control Component for rendering React components in map
interface CustomControlProps {
  position?: 'topright' | 'topleft' | 'bottomright' | 'bottomleft';
  children: React.ReactNode;
  className?: string;
}

const CustomControl = ({ position = 'topright', children, className = '' }: CustomControlProps) => {
  const map = useMap();

  useEffect(() => {
    const customControl = L.Control.extend({
      options: {
        position: position,
      },

      onAdd: function () {
        const container = L.DomUtil.create('div', `leaflet-control-custom ${className}`);
        container.style.background = 'transparent';
        container.style.border = 'none';

        // Prevent map events on this control
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        // Render React component into the container
        const root = createRoot(container);
        root.render(children);

        return container;
      },
    });

    const control = new customControl();
    map.addControl(control);

    return () => {
      map.removeControl(control);
    };
  }, [map, position, children, className]);

  return null;
};

// Dynamic TileLayer component that updates when URL changes
interface DynamicTileLayerProps {
  url: string;
  attribution: string;
}

const DynamicTileLayer = ({ url, attribution }: DynamicTileLayerProps) => {
  const map = useMap();
  const currentLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    // Remove existing tile layer
    if (currentLayerRef.current) {
      map.removeLayer(currentLayerRef.current);
    }

    // Add new tile layer
    const newLayer = L.tileLayer(url, { attribution });
    newLayer.addTo(map);
    currentLayerRef.current = newLayer;

    return () => {
      if (currentLayerRef.current) {
        map.removeLayer(currentLayerRef.current);
      }
    };
  }, [map, url, attribution]);

  return null;
};

export const Map = ({
  data,
  center = [14.2965, 120.7925],
  zoom = 13,
  minZoom = 13,
  maxZoom = 18,
  height = '100%',
  width = '100%',
  markerType = 'default',
  tileLayerUrl = 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', // Light (default)
  // Alternative: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png' // Dark
  attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  renderPopup,
  popupType = 'default',
  showCoordinates = true,
  onMarkerClick,
  className,
  overlayComponent,
  overlayPosition = 'topright',
  overlayClassName = '',
}: MapProps) => {
  // lat lng popup render
  const latLngPopupRenderer = (item: MapMarkerData) => (
    <div>
      <strong>Coordinates:</strong>
      <br />
      <strong>Latitude:</strong> {item.lat}
      <br />
      <strong>Longitude:</strong> {item.lng}
    </div>
  );

  // Default popup renderer
  const defaultPopupRenderer = (item: MapMarkerData) => (
    <div className="space-y-2">
      {showCoordinates && (
        <div>
          <strong>Coordinates:</strong>
          <br />
          <strong>Lat:</strong> {item.lat}
          <br />
          <strong>Lng:</strong> {item.lng}
        </div>
      )}
    </div>
  );

  const renderMarkerIcon = (item: MapMarkerData) => {
    switch (item.condition) {
      case 'safe':
        return new L.Icon({
          iconUrl: safeIcon,
          shadowUrl: shadowUrl,
          iconSize: iconSize,
          iconAnchor: iconAnchor,
          popupAnchor: popupAnchor,
          shadowSize: shadowSize,
        });
      case 'evacuated':
        return new L.Icon({
          iconUrl: evacuatedIcon,
          shadowUrl: shadowUrl,
          iconSize: iconSize,
          iconAnchor: iconAnchor,
          popupAnchor: popupAnchor,
          shadowSize: shadowSize,
        });
      case 'affected':
        return new L.Icon({
          iconUrl: affectedIcon,
          shadowUrl: shadowUrl,
          iconSize: iconSize,
          iconAnchor: iconAnchor,
          popupAnchor: popupAnchor,
          shadowSize: shadowSize,
        });
      case 'missing':
        return new L.Icon({
          iconUrl: missingIcon,
          shadowUrl: shadowUrl,
          iconSize: iconSize,
          iconAnchor: iconAnchor,
          popupAnchor: popupAnchor,
          shadowSize: shadowSize,
        });
      default:
        return defaultIcon;
    }
  };

  const getMarkerIcon = (item: MapMarkerData) => {
    if (markerType === 'status') {
      return renderMarkerIcon(item);
    } else if (markerType === 'default') {
      return defaultIcon;
    }
  };

  // Function to determine which popup renderer to use
  const getPopupRenderer = (item: MapMarkerData) => {
    if (popupType === 'custom' && renderPopup) {
      return renderPopup(item);
    } else if (popupType === 'coordinates') {
      return latLngPopupRenderer(item);
    } else {
      return defaultPopupRenderer(item);
    }
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={minZoom}
      maxZoom={maxZoom}
      style={{ height, width, zIndex: 0 }}
      className={className}
      // maxBounds={[
      //   [14.2214, 120.6989],
      //   [14.3628, 120.8739],
      // ]}
      // maxBoundsViscosity={1.0} // prevents moving outside bounds
    >
      {/* Use DynamicTileLayer for style switching */}
      <DynamicTileLayer url={tileLayerUrl} attribution={attribution} />

      {/* Render custom overlay component if provided */}
      {overlayComponent && (
        <CustomControl position={overlayPosition} className={overlayClassName}>
          {overlayComponent}
        </CustomControl>
      )}

      {data.map(item => (
        <Marker
          position={[item.lat, item.lng]}
          icon={getMarkerIcon(item)}
          key={item.uid}
          eventHandlers={{
            click: () => onMarkerClick?.(item),
          }}
        >
          <Popup className="custom-popup">{getPopupRenderer(item)}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
