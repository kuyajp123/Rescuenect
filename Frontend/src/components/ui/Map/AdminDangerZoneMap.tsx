import redIcon from '@/assets/leaflet/marker-icon-red.png';
import {
  DangerZoneCoordinates,
  DangerZoneCreateOfficialPayload,
  DangerZoneGeoJson,
  DangerZoneGeometryType,
  DangerZoneRecord,
} from '@/types/dangerZone';
import { normalizeDangerZoneGeoJson } from '@/utils/dangerZoneGeometry';
import L from 'leaflet';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet/dist/leaflet.css';
import { Fragment, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { Circle, CircleMarker, FeatureGroup, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';

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
  pickedGeometryType?: DangerZoneGeometryType;
  pickedGeojson?: DangerZoneGeoJson | null;
  affectedWidthMeters?: number | null;
  enableDrawing?: boolean;
  hideZones?: boolean;
  showOnlySelectedZone?: boolean;
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  maxBounds?: [[number, number], [number, number]];
  height?: string;
  resizeTrigger?: number;
  onPickCenter?: (center: DangerZoneCoordinates) => void;
  onZoneSelect?: (zone: DangerZoneRecord) => void;
  onDrawGeometry?: (geometry: Pick<DangerZoneCreateOfficialPayload, 'geometryType' | 'center' | 'radiusMeters' | 'geojson' | 'affectedWidthMeters'>) => void;
}

const MapClickHandler = ({ onPickCenter }: { onPickCenter?: (center: DangerZoneCoordinates) => void }) => {
  useMapEvents({
    click: event => {
      onPickCenter?.({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
};

const MapResizeHandler = ({ resizeTrigger }: { resizeTrigger?: number }) => {
  const map = useMap();
  
  // Initial mount resize
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 250);
    return () => window.clearTimeout(timer);
  }, [map]);

  // Resize on trigger changes (panel collapse/expand)
  useEffect(() => {
    if (resizeTrigger === undefined) return;
    
    const timer = window.setTimeout(() => map.invalidateSize(), 350);
    return () => window.clearTimeout(timer);
  }, [map, resizeTrigger]);
  
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

const linePositions = (geojson?: DangerZoneGeoJson | null): [number, number][] => {
  const normalized = normalizeDangerZoneGeoJson(geojson);
  return normalized?.type === 'LineString' ? normalized.coordinates.map(([lng, lat]) => [lat, lng]) : [];
};

const polygonPositions = (geojson?: DangerZoneGeoJson | null): [number, number][] => {
  const normalized = normalizeDangerZoneGeoJson(geojson);
  return normalized?.type === 'Polygon' ? (normalized.coordinates[0] ?? []).map(([lng, lat]) => [lat, lng]) : [];
};

const severityStyle = (severity: DangerZoneRecord['severity'], isSelected = false) => {
  const styles = {
    low: { color: '#16a34a', fillColor: '#22c55e' },
    medium: { color: '#d97706', fillColor: '#f59e0b' },
    high: { color: '#dc2626', fillColor: '#ef4444' },
    critical: { color: '#7f1d1d', fillColor: '#991b1b' },
  }[severity];

  return {
    ...styles,
    fillOpacity: isSelected ? 0.34 : 0.22,
    opacity: 0.9,
    weight: isSelected ? 5 : 3,
  };
};

const closeRing = (coordinates: [number, number][]): [number, number][] => {
  if (coordinates.length === 0) return coordinates;
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  return first[0] === last[0] && first[1] === last[1] ? coordinates : [...coordinates, first];
};

const getLayerGeometry = (
  layer: L.Layer,
  affectedWidthMeters?: number | null
): Pick<DangerZoneCreateOfficialPayload, 'geometryType' | 'center' | 'radiusMeters' | 'geojson' | 'affectedWidthMeters'> | null => {
  if (layer instanceof L.Circle) {
    const center = layer.getLatLng();
    return {
      geometryType: 'circle',
      center: { lat: center.lat, lng: center.lng },
      radiusMeters: Math.round(layer.getRadius()),
      geojson: null,
      affectedWidthMeters: null,
    };
  }

  if (layer instanceof L.Marker) {
    const center = layer.getLatLng();
    return {
      geometryType: 'point',
      center: { lat: center.lat, lng: center.lng },
      radiusMeters: null,
      geojson: null,
      affectedWidthMeters: null,
    };
  }

  if (layer instanceof L.Polygon) {
    const latLngs = layer.getLatLngs() as L.LatLng[][] | L.LatLng[][][];
    const outerRing = Array.isArray(latLngs[0]) && !Array.isArray((latLngs[0] as L.LatLng[])[0])
      ? (latLngs[0] as L.LatLng[])
      : ((latLngs[0] as L.LatLng[][])[0] ?? []);
    const coordinates = closeRing(outerRing.map(latLng => [latLng.lng, latLng.lat] as [number, number]));
    return {
      geometryType: 'polygon',
      center: null,
      radiusMeters: null,
      geojson: { type: 'Polygon', coordinates: [coordinates] },
      affectedWidthMeters: null,
    };
  }

  if (layer instanceof L.Polyline) {
    const latLngs = layer.getLatLngs() as L.LatLng[];
    return {
      geometryType: 'line',
      center: null,
      radiusMeters: null,
      geojson: { type: 'LineString', coordinates: latLngs.map(latLng => [latLng.lng, latLng.lat] as [number, number]) },
      affectedWidthMeters: affectedWidthMeters ?? 30,
    };
  }

  return null;
};

const DrawControls = ({
  geometryType,
  affectedWidthMeters,
  featureGroupRef,
  onDrawGeometry,
}: {
  geometryType: DangerZoneGeometryType;
  affectedWidthMeters?: number | null;
  featureGroupRef: RefObject<L.FeatureGroup | null>;
  onDrawGeometry?: AdminDangerZoneMapProps['onDrawGeometry'];
}) => {
  const map = useMap();

  useEffect(() => {
    const featureGroup = featureGroupRef.current;
    if (!featureGroup) return;

    const drawControl = new (L.Control as any).Draw({
      position: 'topright',
      draw: {
        marker: geometryType === 'point' ? {} : false,
        circle: geometryType === 'circle' ? {} : false,
        polyline: geometryType === 'line' ? {} : false,
        polygon: geometryType === 'polygon' ? { allowIntersection: false } : false,
        rectangle: false,
        circlemarker: false,
      },
      edit: {
        featureGroup,
        edit: {},
        remove: false,
      },
    });

    const handleCreated: L.LeafletEventHandlerFn = event => {
      const layer = (event as L.LeafletEvent & { layer?: L.Layer }).layer;
      if (!layer) return;

      featureGroup.clearLayers();
      featureGroup.addLayer(layer);
      const geometry = getLayerGeometry(layer, affectedWidthMeters);
      if (geometry) onDrawGeometry?.(geometry);
    };

    const handleEdited: L.LeafletEventHandlerFn = event => {
      const layers = (event as L.LeafletEvent & { layers?: L.LayerGroup }).layers;
      if (!layers) return;

      layers.eachLayer(layer => {
        const geometry = getLayerGeometry(layer, affectedWidthMeters);
        if (geometry) onDrawGeometry?.(geometry);
      });
    };

    map.addControl(drawControl);
    map.on((L as any).Draw.Event.CREATED, handleCreated);
    map.on((L as any).Draw.Event.EDITED, handleEdited);

    return () => {
      map.off((L as any).Draw.Event.CREATED, handleCreated);
      map.off((L as any).Draw.Event.EDITED, handleEdited);
      map.removeControl(drawControl);
    };
  }, [affectedWidthMeters, featureGroupRef, geometryType, map, onDrawGeometry]);

  return null;
};

const DangerZoneLayers = ({
  zone,
  isSelected,
  onZoneSelect,
}: {
  zone: DangerZoneRecord;
  isSelected?: boolean;
  onZoneSelect?: (zone: DangerZoneRecord) => void;
}) => {
  const pathOptions = severityStyle(zone.severity, isSelected);
  const eventHandlers = onZoneSelect ? { click: () => onZoneSelect(zone) } : undefined;

  return (
    <>
      {zone.geometryType === 'circle' && zone.center && (
        <Circle
          center={[zone.center.lat, zone.center.lng]}
          radius={zone.radiusMeters ?? 100}
          pathOptions={pathOptions}
          eventHandlers={eventHandlers}
        />
      )}
      {zone.geometryType === 'line' && zone.geojson?.type === 'LineString' && (
        <Polyline
          positions={linePositions(zone.geojson)}
          pathOptions={{ ...pathOptions, fillOpacity: undefined, weight: isSelected ? 7 : 5 }}
          eventHandlers={eventHandlers}
        />
      )}
      {zone.geometryType === 'polygon' && zone.geojson?.type === 'Polygon' && (
        <Polygon
          positions={polygonPositions(zone.geojson)}
          pathOptions={pathOptions}
          eventHandlers={eventHandlers}
        />
      )}
      {(zone.geometryType === 'point' || zone.geometryType === 'circle') && zone.center && (
        <CircleMarker
          center={[zone.center.lat, zone.center.lng]}
          radius={isSelected ? 9 : 7}
          pathOptions={{ ...pathOptions, fillOpacity: 0.9, weight: isSelected ? 4 : 2 }}
          eventHandlers={eventHandlers}
        >
          <Popup>
            <div className="space-y-1">
              <strong>{formatLabel(zone.type)}</strong>
              <div>Status: {zone.status}</div>
              <div>Severity: {zone.severity}</div>
            </div>
          </Popup>
        </CircleMarker>
      )}
    </>
  );
};

export const AdminDangerZoneMap = ({
  zones = [],
  selectedZone,
  pickedCenter,
  pickedRadiusMeters = 100,
  pickedGeometryType = 'point',
  pickedGeojson,
  affectedWidthMeters,
  enableDrawing = false,
  hideZones = false,
  showOnlySelectedZone = true,
  center = [14.31808, 120.750674],
  zoom = 15,
  minZoom = 12,
  maxZoom = 18,
  maxBounds,
  height = '360px',
  resizeTrigger,
  onPickCenter,
  onZoneSelect,
  onDrawGeometry,
}: AdminDangerZoneMapProps) => {
  const drawFeatureGroupRef = useRef<L.FeatureGroup | null>(null);
  const visibleZones = hideZones ? [] : selectedZone && showOnlySelectedZone ? [selectedZone] : zones;
  const focusCenter: [number, number] | undefined = pickedCenter
    ? [pickedCenter.lat, pickedCenter.lng]
    : selectedZone?.center
      ? [selectedZone.center.lat, selectedZone.center.lng]
      : selectedZone?.centroid
        ? [selectedZone.centroid.lat, selectedZone.centroid.lng]
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
        <MapResizeHandler resizeTrigger={resizeTrigger} />
        <MapFocusHandler center={focusCenter} zoom={zoom} />
        {onPickCenter && !enableDrawing && <MapClickHandler onPickCenter={onPickCenter} />}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {visibleZones.map(zone => (
          <Fragment key={zone.id}>
            <DangerZoneLayers zone={zone} isSelected={zone.id === selectedZone?.id} onZoneSelect={onZoneSelect} />
          </Fragment>
        ))}

        {enableDrawing ? (
          <FeatureGroup
            ref={drawFeatureGroupRef}
            key={`${pickedGeometryType}-${JSON.stringify(pickedGeojson)}-${pickedCenter?.lat ?? 'x'}-${pickedCenter?.lng ?? 'x'}-${pickedRadiusMeters}`}
          >
            <DrawControls
              geometryType={pickedGeometryType}
              affectedWidthMeters={affectedWidthMeters}
              featureGroupRef={drawFeatureGroupRef}
              onDrawGeometry={onDrawGeometry}
            />
            {pickedGeometryType === 'point' && pickedCenter && (
              <Marker position={[pickedCenter.lat, pickedCenter.lng]} icon={dangerIcon} />
            )}
            {pickedGeometryType === 'circle' && pickedCenter && (
              <Circle
                center={[pickedCenter.lat, pickedCenter.lng]}
                radius={pickedRadiusMeters}
                pathOptions={{ color: '#f97316', fillColor: '#fb923c', fillOpacity: 0.18, weight: 2 }}
              />
            )}
            {pickedGeometryType === 'line' && pickedGeojson?.type === 'LineString' && (
              <Polyline positions={linePositions(pickedGeojson)} pathOptions={{ color: '#f97316', weight: 5, opacity: 0.85 }} />
            )}
            {pickedGeometryType === 'polygon' && pickedGeojson?.type === 'Polygon' && (
              <Polygon
                positions={polygonPositions(pickedGeojson)}
                pathOptions={{ color: '#f97316', fillColor: '#fb923c', fillOpacity: 0.18, weight: 2 }}
              />
            )}
          </FeatureGroup>
        ) : (
          pickedCenter && (
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
          )
        )}
      </MapContainer>
    </div>
  );
};
