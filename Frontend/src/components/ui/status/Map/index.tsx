import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import status from '@/data/statusData.json'

// Fix broken marker icons in React/Vite
const defaultIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const Map = () => {
  return (
    <MapContainer
        center={[14.2965, 120.7925]}
        zoom={13}
        minZoom={13}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
          
        />
        {status.map(stats => (
          <Marker 
            position={[stats.lat, stats.lng]} 
            icon={defaultIcon}
            key={stats.id}
          >
            <Popup className='custom-popup'>
              <strong>lat:</strong> {stats.lat} <br />
              <strong>lng:</strong> {stats.lng} <br />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
  )
}
