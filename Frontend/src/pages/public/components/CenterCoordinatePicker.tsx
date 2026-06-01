import markerIcon from '@/assets/leaflet/marker-icon-blue.png';
import { Button, Chip, addToast } from '@heroui/react';
import L from 'leaflet';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Crosshair, LocateFixed, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';

const PHILIPPINES_CENTER: [number, number] = [12.8797, 121.774];
const TILE_URL = 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const centerIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type CenterCoordinatePickerProps = {
  latitude: string;
  longitude: string;
  municipalityName?: string;
  isDisabled?: boolean;
  onChange: (latitude: string, longitude: string) => void;
};

const toNumber = (value: string): number | null => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatCoordinate = (value: number) => value.toFixed(6).replace(/\.?0+$/, '');

const isUsableCoordinate = (latitude: number | null, longitude: number | null) =>
  latitude !== null &&
  longitude !== null &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

const MapSizeBridge = ({
  center,
  zoom,
  isDisabled,
}: {
  center: [number, number];
  zoom: number;
  isDisabled: boolean;
}) => {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 250);
    return () => window.clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 0.25 });
  }, [center, map, zoom]);

  useEffect(() => {
    const method = isDisabled ? 'disable' : 'enable';

    map.dragging[method]();
    map.scrollWheelZoom[method]();
    map.doubleClickZoom[method]();
    map.touchZoom[method]();
    map.boxZoom[method]();
    map.keyboard[method]();
  }, [isDisabled, map]);

  return null;
};

const MapClickHandler = ({
  isDisabled,
  onPick,
}: {
  isDisabled?: boolean;
  onPick: (latitude: number, longitude: number) => void;
}) => {
  useMapEvents({
    click: event => {
      if (!isDisabled) onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
};

export const CenterCoordinatePicker = ({
  latitude,
  longitude,
  municipalityName,
  isDisabled = false,
  onChange,
}: CenterCoordinatePickerProps) => {
  const [isLocating, setIsLocating] = useState(false);
  const latitudeNumber = toNumber(latitude);
  const longitudeNumber = toNumber(longitude);
  const hasMarker = isUsableCoordinate(latitudeNumber, longitudeNumber);
  const center = useMemo<[number, number]>(
    () => (hasMarker ? [latitudeNumber!, longitudeNumber!] : PHILIPPINES_CENTER),
    [hasMarker, latitudeNumber, longitudeNumber]
  );
  const zoom = hasMarker ? 15 : 6;

  const updateCenter = (nextLatitude: number, nextLongitude: number) => {
    onChange(formatCoordinate(nextLatitude), formatCoordinate(nextLongitude));
  };

  const useBrowserLocation = () => {
    if (isDisabled || isLocating) return;

    if (!navigator.geolocation) {
      addToast({
        title: 'Location unavailable',
        description: 'Your browser does not support location detection. Click the map to choose the center.',
        color: 'warning',
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        updateCenter(position.coords.latitude, position.coords.longitude);
        setIsLocating(false);
      },
      () => {
        addToast({
          title: 'Location blocked',
          description: 'Allow location access or click the map to place the center marker.',
          color: 'warning',
        });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="md:col-span-2 space-y-3 rounded-xl border border-default-200 bg-default-50/40 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Proposed Center Coordinates</h2>
          <p className="text-sm text-default-500">
            {municipalityName
              ? `Place the marker near the command center, municipal hall, or preferred weather reference point for ${municipalityName}.`
              : 'Select a municipality or city, then place the marker near the preferred LGU center.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasMarker ? (
            <Chip size="sm" variant="flat" startContent={<LocateFixed size={14} />}>
              {latitudeNumber!.toFixed(5)}, {longitudeNumber!.toFixed(5)}
            </Chip>
          ) : (
            <Chip size="sm" variant="flat" startContent={<MapPin size={14} />}>
              No center selected
            </Chip>
          )}
          <Button
            size="sm"
            variant="flat"
            startContent={<Crosshair size={15} />}
            onPress={useBrowserLocation}
            isDisabled={isDisabled || isLocating}
            isLoading={isLocating}
          >
            {isLocating ? 'Locating...' : 'Use my location'}
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-default-200 bg-default-100">
        <MapContainer
          center={center}
          zoom={zoom}
          minZoom={5}
          maxZoom={18}
          style={{ height: 360, width: '100%', zIndex: 0 }}
          className="rounded-lg"
          dragging={!isDisabled}
          zoomControl
          scrollWheelZoom={!isDisabled}
        >
          <MapSizeBridge center={center} zoom={zoom} isDisabled={isDisabled} />
          <MapClickHandler isDisabled={isDisabled} onPick={updateCenter} />
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
          {hasMarker && (
            <Marker
              position={center}
              icon={centerIcon}
              draggable={!isDisabled}
              eventHandlers={{
                dragend: event => {
                  const marker = event.target as L.Marker;
                  const position = marker.getLatLng();
                  updateCenter(position.lat, position.lng);
                },
              }}
            >
              <Popup>
                <div>
                  <strong>Proposed Center</strong>
                  <br />
                  Lat: {latitudeNumber!.toFixed(6)}
                  <br />
                  Lng: {longitudeNumber!.toFixed(6)}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <p className="text-xs text-default-500">Click the map or drag the marker to set the submitted center coordinates.</p>
    </div>
  );
};
