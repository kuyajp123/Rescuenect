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

const Status = () => {
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={[14.2965, 120.7925]}
        zoom={14}
        minZoom={13}
        style={{ height: '100%', width: '100%' }}
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
              {stats.firstName} {stats.lastName} <br /> 
              {stats.description} <br />
              <img src={stats.image} />
              <strong>Location:</strong> {stats.loc} <br />
              <strong>Date:</strong> {stats.date} <br />
              <strong>Time:</strong> {stats.time} <br />
              <strong>Contact:</strong> {stats.contact} <br />
              {/* <strong>Category:</strong> {stats.category} <br />
              <strong>Item:</strong> {stats.itemName} <br />
              <strong>Quantity:</strong> {stats.quantity} <br /> */}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Status;
