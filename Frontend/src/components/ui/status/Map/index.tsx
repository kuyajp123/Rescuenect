import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import safeIcon from 'leaflet/dist/images/marker-icon-green.png';
import evacuatedIcon from 'leaflet/dist/images/marker-icon-blue.png';
import affectedIcon from 'leaflet/dist/images/marker-icon-orange.png';
import missingIcon from 'leaflet/dist/images/marker-icon-red.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapMarkerData, MapProps } from '@/components/shared/types';

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

export const Map = ({ 
  data,
  center = [14.2965, 120.7925],
  zoom = 13,
  minZoom = 13,
  maxZoom = 18,
  height = '100%',
  width = '100%',
  markerType = 'default',
  tileLayerUrl = "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  renderPopup,
  popupType = 'default',
  showCoordinates = true,
  onMarkerClick,
  className
}: MapProps) => {
  
  // lat lng popup render
  const latLngPopupRenderer = (item: MapMarkerData) => (
    <div>
      <strong>Coordinates:</strong><br />
      <strong>Latitude:</strong> {item.lat}<br />
      <strong>Longitude:</strong> {item.lng}
    </div>
  );

  // Default popup renderer
  const defaultPopupRenderer = (item: MapMarkerData) => (
    <div className="space-y-2">
      {showCoordinates && (
        <div>
          <strong>Coordinates:</strong><br />
          <strong>Lat:</strong> {item.lat}<br />
          <strong>Lng:</strong> {item.lng}
        </div>
      )}
      
      {/* Show additional data if available */}
      {item.firstName && item.lastName && (
        <div>
          <strong>Name:</strong> {item.firstName} {item.lastName}
        </div>
      )}
      
      {item.status && (
        <div>
          <strong>Status:</strong> <span className={`capitalize ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
        </div>
      )}
      
      {item.date && (
        <div>
          <strong>Date:</strong> {item.date}
        </div>
      )}
      
      {item.time && (
        <div>
          <strong>Time:</strong> {item.time}
        </div>
      )}
      
      {item.loc && (
        <div>
          <strong>Location:</strong> {item.loc}
        </div>
      )}
      
      {item.contact && (
        <div>
          <strong>Contact:</strong> {item.contact}
        </div>
      )}
      
      {item.description && (
        <div>
          <strong>Description:</strong> {item.description}
        </div>
      )}
    </div>
  );

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'safe':
        return 'text-green-600';
      case 'evacuated':
        return 'text-blue-600';
      case 'missing':
        return 'text-red-600';
      case 'affected':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const renderMarkerIcon = (item: MapMarkerData) => {
    let icon = defaultIcon;

    switch (item.status) {
      case 'safe':
        return icon = new L.Icon({
          iconUrl: safeIcon,
          shadowUrl: shadowUrl,
          iconSize: iconSize,
          iconAnchor: iconAnchor,
          popupAnchor: popupAnchor,
          shadowSize: shadowSize,
        });
      case 'evacuated':
        return icon = new L.Icon({
          iconUrl: evacuatedIcon,
          shadowUrl: shadowUrl,
          iconSize: iconSize,
          iconAnchor: iconAnchor,
          popupAnchor: popupAnchor,
          shadowSize: shadowSize,
        });
      case 'affected':
        return icon = new L.Icon({
          iconUrl: affectedIcon,
          shadowUrl: shadowUrl,
          iconSize: iconSize,
          iconAnchor: iconAnchor,
          popupAnchor: popupAnchor,
          shadowSize: shadowSize,
        });
      case 'missing':
        return icon = new L.Icon({
          iconUrl: missingIcon,
          shadowUrl: shadowUrl,
          iconSize: iconSize,
          iconAnchor: iconAnchor,
          popupAnchor: popupAnchor,
          shadowSize: shadowSize,
        });
      default:
        icon = defaultIcon;
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
    >
      <TileLayer
        attribution={attribution}
        url={tileLayerUrl}
      />
      
      {data.map(item => (
        <Marker 
          position={[item.lat, item.lng]} 
          icon={getMarkerIcon(item)}
          key={item.id}
          eventHandlers={{
            click: () => onMarkerClick?.(item)
          }}
        >
          <Popup className='custom-popup'>
            {getPopupRenderer(item)}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
