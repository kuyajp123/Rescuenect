import markerIcon from '@/assets/leaflet/marker-icon-blue.png';
import type { MapSettingsDraft } from '@/pages/contents/SuperAdmin/utils';
import { Button, Chip } from '@heroui/react';
import L from 'leaflet';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { LocateFixed, Scan } from 'lucide-react';
import type { MutableRefObject } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, Marker, Popup, Rectangle, TileLayer, useMap, useMapEvents } from 'react-leaflet';

const FALLBACK_CENTER: [number, number] = [14.2919325, 120.7752839];
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

type MapSettingsPreviewProps = {
  draft: MapSettingsDraft;
  onDraftChange?: (key: keyof MapSettingsDraft, value: string) => void;
  onDraftPatch?: (patch: Partial<MapSettingsDraft>) => void;
  isReadOnly?: boolean;
  title?: string;
  description?: string;
  height?: string;
  maxWidth?: string;
};

const toNumber = (value: string | number | null | undefined): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toWholeNumber = (value: string | number | null | undefined, fallback: number) => {
  const parsed = toNumber(value);
  return parsed === null ? fallback : Math.round(parsed);
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatCoordinate = (value: number) => value.toFixed(6).replace(/\.?0+$/, '');

const getBounds = (draft: MapSettingsDraft): [[number, number], [number, number]] | null => {
  const north = toNumber(draft.north);
  const south = toNumber(draft.south);
  const east = toNumber(draft.east);
  const west = toNumber(draft.west);

  if (north === null || south === null || east === null || west === null) return null;
  if (north <= south || east <= west) return null;
  if (north < -90 || north > 90 || south < -90 || south > 90) return null;
  if (east < -180 || east > 180 || west < -180 || west > 180) return null;

  return [
    [south, west],
    [north, east],
  ];
};

const MapStateBridge = ({
  center,
  zoom,
  minZoom,
  maxZoom,
  mapRef,
}: {
  center: [number, number];
  zoom: number;
  minZoom: number;
  maxZoom: number;
  mapRef: MutableRefObject<L.Map | null>;
}) => {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    const timer = window.setTimeout(() => map.invalidateSize(), 250);
    return () => {
      window.clearTimeout(timer);
      mapRef.current = null;
    };
  }, [map, mapRef]);

  useEffect(() => {
    map.setMinZoom(minZoom);
    map.setMaxZoom(maxZoom);
    map.setView(center, zoom, { animate: true, duration: 0.25 });
  }, [center, map, maxZoom, minZoom, zoom]);

  return null;
};

const MapClickHandler = ({
  isDisabled,
  onCenterChange,
}: {
  isDisabled: boolean;
  onCenterChange: (latitude: number, longitude: number) => void;
}) => {
  useMapEvents({
    click: event => {
      if (!isDisabled) onCenterChange(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
};

export const MapSettingsPreview = ({
  draft,
  onDraftChange,
  onDraftPatch,
  isReadOnly = false,
  title = 'Map Preview',
  description = 'Click the map or drag the marker to update the center coordinates.',
  height = '560px',
  maxWidth = '980px',
}: MapSettingsPreviewProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const center = useMemo<[number, number]>(() => {
    const latitude = toNumber(draft.centerLatitude);
    const longitude = toNumber(draft.centerLongitude);
    if (latitude !== null && longitude !== null && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
      return [latitude, longitude];
    }
    return FALLBACK_CENTER;
  }, [draft.centerLatitude, draft.centerLongitude]);

  const rawMinZoom = toWholeNumber(draft.minZoom, 12);
  const rawMaxZoom = toWholeNumber(draft.maxZoom, 18);
  const minZoom = clamp(rawMinZoom, 1, 18);
  const maxZoom = clamp(rawMaxZoom, minZoom, 22);
  const zoom = clamp(toWholeNumber(draft.zoom, 15), minZoom, maxZoom);
  const bounds = useMemo(() => getBounds(draft), [draft.east, draft.north, draft.south, draft.west]);
  const isEditable = !isReadOnly && Boolean(onDraftPatch || onDraftChange);

  const updateCenter = (latitude: number, longitude: number) => {
    const patch = {
      centerLatitude: formatCoordinate(latitude),
      centerLongitude: formatCoordinate(longitude),
    };

    if (onDraftPatch) {
      onDraftPatch(patch);
      return;
    }

    onDraftChange?.('centerLatitude', patch.centerLatitude);
    onDraftChange?.('centerLongitude', patch.centerLongitude);
  };

  const useVisibleAreaAsBounds = () => {
    if (!mapRef.current || !onDraftPatch) return;
    const nextBounds = mapRef.current.getBounds();
    onDraftPatch({
      north: formatCoordinate(nextBounds.getNorth()),
      south: formatCoordinate(nextBounds.getSouth()),
      east: formatCoordinate(nextBounds.getEast()),
      west: formatCoordinate(nextBounds.getWest()),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-default-500">{isReadOnly ? 'Review the proposed map center and bounds.' : description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip size="sm" variant="flat" startContent={<LocateFixed size={14} />}>
            {center[0].toFixed(5)}, {center[1].toFixed(5)}
          </Chip>
          <Chip size="sm" variant="flat">
            Zoom {zoom}
          </Chip>
        </div>
      </div>

      <div className="relative mx-auto w-full overflow-hidden rounded-lg border border-default-200 bg-default-100" style={{ maxWidth }}>
        <MapContainer
          center={center}
          zoom={zoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          style={{ height, width: '100%', zIndex: 0 }}
          className="rounded-lg"
          zoomControl
          scrollWheelZoom
        >
          <MapStateBridge center={center} zoom={zoom} minZoom={minZoom} maxZoom={maxZoom} mapRef={mapRef} />
          <MapClickHandler isDisabled={!isEditable} onCenterChange={updateCenter} />
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
          {bounds && (
            <Rectangle
              bounds={bounds}
              pathOptions={{
                color: '#0ea5e9',
                fillColor: '#0ea5e9',
                fillOpacity: 0.08,
                opacity: 0.9,
                weight: 2,
              }}
            />
          )}
          <Marker
            position={center}
            icon={centerIcon}
            draggable={isEditable}
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
                <strong>Center Coordinates</strong>
                <br />
                Lat: {center[0].toFixed(6)}
                <br />
                Lng: {center[1].toFixed(6)}
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {!isReadOnly && onDraftPatch && (
          <div className="absolute bottom-3 left-3 z-[401]">
            <Button size="sm" variant="solid" startContent={<Scan size={15} />} onPress={useVisibleAreaAsBounds}>
              Use visible area as bounds
            </Button>
          </div>
        )}
      </div>

      <p className="text-xs text-default-500">
        {bounds
          ? 'The blue rectangle shows the configured movement boundary.'
          : 'Enter valid north, south, east, and west bounds to preview the movement boundary.'}
      </p>
    </div>
  );
};
