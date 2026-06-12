import redIcon from '@/assets/leaflet/marker-icon-red.png';
import { DangerZoneCoordinates, DangerZoneRecord } from '@/types/dangerZone';
import L from 'leaflet';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { Fragment, useEffect } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';

const dangerIcon = new L.Icon({
  iconUrl: redIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface AdminDangerZoneMapProps {
  zones?: DangerZoneRecord[];
  selectedZone?: DangerZoneRecord | null;
  pickedCenter?: DangerZoneCoordinates | null;
  pickedRadiusMeters?: number;
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  maxBounds?: [[number, number], [number, number]];
  height?: string;
  onPickCenter?: (center: DangerZoneCoordinates) => void;
}

const MapClickHandler = ({ onPickCenter }: { onPickCenter?: (center: DangerZoneCoordinates) => void }) => {
  useMapEvents({
    click: event => {
      onPickCenter?.({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
};

const MapResizeHandler = () => {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 250);
    return () => window.clearTimeout(timer);
  }, [map]);
  return null;
};

const MapFocusHandler = ({ center, zoom }: { center?: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true, duration: 0.35 });
    }
  }, [center, map, zoom]);
  return null;
};

const formatLabel = (value: string) =>
  value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const AdminDangerZoneMap = ({
  zones = [],
  selectedZone,
  pickedCenter,
  pickedRadiusMeters = 100,
  center = [14.31808, 120.750674],
  zoom = 15,
  minZoom = 12,
  maxZoom = 18,
  maxBounds,
  height = '360px',
  onPickCenter,
}: AdminDangerZoneMapProps) => {
  const visibleZones = selectedZone ? [selectedZone] : zones;
  const focusCenter: [number, number] | undefined = pickedCenter
    ? [pickedCenter.lat, pickedCenter.lng]
    : selectedZone?.center
      ? [selectedZone.center.lat, selectedZone.center.lng]
      : undefined;

  return (
    <div className="overflow-hidden rounded-lg border border-default-200">
      <MapContainer
        center={focusCenter ?? center}
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        maxBounds={maxBounds}
        maxBoundsViscosity={maxBounds ? 1 : undefined}
        scrollWheelZoom
        style={{ height, width: '100%', zIndex: 0 }}
      >
        <MapResizeHandler />
        <MapFocusHandler center={focusCenter} zoom={zoom} />
        {onPickCenter && <MapClickHandler onPickCenter={onPickCenter} />}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {visibleZones
          .filter(zone => zone.center && Number.isFinite(zone.center.lat) && Number.isFinite(zone.center.lng))
          .map(zone => (
            <Fragment key={zone.id}>
              {zone.geometryType === 'circle' && (
                <Circle
                  center={[zone.center.lat, zone.center.lng]}
                  radius={zone.radiusMeters ?? 100}
                  pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.2, weight: 2 }}
                />
              )}
              <Marker position={[zone.center.lat, zone.center.lng]} icon={dangerIcon}>
                <Popup>
                  <div className="space-y-1">
                    <strong>{formatLabel(zone.type)}</strong>
                    <div>Status: {zone.status}</div>
                    <div>Severity: {zone.severity}</div>
                  </div>
                </Popup>
              </Marker>
            </Fragment>
          ))}

        {pickedCenter && (
          <>
            <Marker position={[pickedCenter.lat, pickedCenter.lng]} icon={dangerIcon}>
              <Popup>Selected danger-zone center</Popup>
            </Marker>
            {pickedRadiusMeters > 0 && (
              <Circle
                center={[pickedCenter.lat, pickedCenter.lng]}
                radius={pickedRadiusMeters}
                pathOptions={{ color: '#f97316', fillColor: '#fb923c', fillOpacity: 0.18, weight: 2 }}
              />
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
};
