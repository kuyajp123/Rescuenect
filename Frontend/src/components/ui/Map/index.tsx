import { useMapStyleStore } from '@/stores/useMapStyleStore';
import { MapMarkerData, MapProps, StatusData } from '@/types/types';
import L from 'leaflet';
import evacuatedIcon from 'leaflet/dist/images/marker-icon-blue.png';
import safeIcon from 'leaflet/dist/images/marker-icon-green.png';
import affectedIcon from 'leaflet/dist/images/marker-icon-orange.png';
import missingIcon from 'leaflet/dist/images/marker-icon-red.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Circle, MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import { getEarthquakeSeverityColor } from '../../../config/constant.tsx';
import { MapStyleSelector } from './MapStyleSelector';

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

// Map Controller component that handles centering on markers
interface MapControllerProps {
  data: (MapMarkerData | StatusData)[];
  center: [number, number];
  zoom: number;
}

const MapController = ({ data, center, zoom }: MapControllerProps) => {
  const map = useMap();

  useEffect(() => {
    if (data.length > 0) {
      // Find first marker with valid coordinates
      const firstMarker = data.find(
        item => item.lat !== null && item.lng !== null && typeof item.lat === 'number' && typeof item.lng === 'number'
      );

      if (firstMarker && firstMarker.lat !== null && firstMarker.lng !== null) {
        map.setView([firstMarker.lat, firstMarker.lng], zoom, {
          animate: true,
          duration: 0.5,
        });
      } else {
        // Fallback to provided center if no valid coordinates
        map.setView(center, zoom, {
          animate: true,
          duration: 0.5,
        });
      }
    } else {
      // If no marker data, use the provided center
      map.setView(center, zoom, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [map, data, center, zoom]);

  return null;
};

export const Map = ({
  data,
  earthquakeData,
  statusData,
  center = [14.2965, 120.7925],
  zoom = 13,
  minZoom = 13,
  maxZoom = 18,
  height = '100%',
  width = '100%',
  markerType = 'default',
  renderPopup,
  popupType = 'default',
  showCoordinates = true,
  onMarkerClick,
  className,
  hasMapStyleSelector = true,
  zoomControl = true,
  dragging = true,
  hasMapControl = false,
  overlayComponent,
  attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', // this is default we dont need to change this
  overlayPosition = 'topright',
  overlayClassName = '',
  // Circle marker props
  circleRadius = 12,
  circleOpacity = 0.8,
  circleStrokeWidth = 2,
  circleStrokeColor = '#ffffff',
  CustomSettingControl,
}: MapProps) => {
  const [mapTileUrl, setMapTileUrl] = useState('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'); // Default to light
  const styleUrl = useMapStyleStore(state => state.styleUrl);
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

  const renderMarkerIcon = (item: MapMarkerData | StatusData) => {
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

  // Create circle marker for earthquakes
  const createCircleMarker = (item: MapMarkerData) => {
    const color = item.severity ? getEarthquakeSeverityColor(item.severity) : '#808080';
    const radius = circleRadius || 12;

    return L.divIcon({
      className: 'custom-circle-marker',
      html: `<div style="
        width: ${radius * 2}px;
        height: ${radius * 2}px;
        background-color: ${color};
        border: ${circleStrokeWidth || 2}px solid ${circleStrokeColor || '#ffffff'};
        border-radius: 50%;
        opacity: ${circleOpacity || 0.8};
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      "></div>`,
      iconSize: [radius * 2, radius * 2],
      iconAnchor: [radius, radius],
      popupAnchor: [0, -radius],
    });
  };

  const getMarkerIcon = (item: MapMarkerData) => {
    if (markerType === 'mixed') {
      // Auto-detect marker type based on data properties
      if (item.severity || item.magnitude) {
        // Has earthquake data - use circle marker
        return createCircleMarker(item);
      } else if (item.condition) {
        // Has status data - use status marker
        return renderMarkerIcon(item);
      } else {
        // Fallback to default
        return defaultIcon;
      }
    } else if (markerType === 'status') {
      return renderMarkerIcon(item);
    } else if (markerType === 'earthquake' || markerType === 'circle') {
      return createCircleMarker(item);
    } else {
      return defaultIcon;
    }
  };

  // Enhanced popup renderer for StatusData
  const statusPopupRenderer = (item: StatusData) => (
    <div className="space-y-2">
      <div>
        <strong>
          {item.firstName} {item.lastName}
        </strong>
      </div>
      <div>
        <strong>Status:</strong> <span className="capitalize">{item.condition}</span>
      </div>
      {item.phoneNumber && (
        <div>
          <strong>Phone:</strong> {item.phoneNumber}
        </div>
      )}
      {item.note && (
        <div>
          <strong>Note:</strong> {item.note}
        </div>
      )}
      {showCoordinates && item.lat && item.lng && (
        <div>
          <strong>Location:</strong>
          <br />
          <strong>Lat:</strong> {item.lat}
          <br />
          <strong>Lng:</strong> {item.lng}
        </div>
      )}
    </div>
  );

  // Function to determine which popup renderer to use
  const getPopupRenderer = (item: MapMarkerData | StatusData) => {
    if (popupType === 'custom' && renderPopup) {
      return renderPopup(item as MapMarkerData);
    } else if (popupType === 'coordinates') {
      return latLngPopupRenderer(item as MapMarkerData);
    } else if ('firstName' in item) {
      // This is StatusData
      return statusPopupRenderer(item as StatusData);
    } else {
      return defaultPopupRenderer(item as MapMarkerData);
    }
  };

  // Handle map style changes
  const handleMapStyleChange = useCallback((styleUrl: string) => {
    setMapTileUrl(styleUrl);
  }, []);

  let displayMapStyleSelector = null;
  if (hasMapStyleSelector) {
    displayMapStyleSelector = 'block';
  } else {
    displayMapStyleSelector = 'hidden';
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={minZoom}
      maxZoom={maxZoom}
      style={{ height, width, zIndex: 0 }}
      className={className}
      zoomControl={zoomControl}
      dragging={dragging}
      doubleClickZoom={dragging}
      touchZoom={dragging}
      scrollWheelZoom={dragging}
      keyboard={dragging}
      boxZoom={dragging}
      // maxBounds={[
      //   [14.2214, 120.6989],
      //   [14.3628, 120.8739],
      // ]}
      // maxBoundsViscosity={1.0} // prevents moving outside bounds
    >
      {/* Use DynamicTileLayer for style switching */}
      <DynamicTileLayer url={mapTileUrl} attribution={attribution} />

      {/* Map Controller for dynamic centering */}
      {hasMapControl && (
        <MapController
          data={[...(earthquakeData || []), ...(statusData || []), ...(data || [])]}
          center={center}
          zoom={zoom}
        />
      )}

      <CustomControl position="topright" className={`map-style-selector-control ${displayMapStyleSelector}`}>
        <MapStyleSelector onStyleChange={handleMapStyleChange} />
      </CustomControl>

      {CustomSettingControl && (
        <CustomControl position="topright" className="map-custom-setting-control">
          <div style={{ position: 'relative', zIndex: 9999 }}>{CustomSettingControl}</div>
        </CustomControl>
      )}

      {/* Render custom overlay component if provided */}
      {overlayComponent && (
        <CustomControl position={overlayPosition} className={overlayClassName}>
          {overlayComponent}
        </CustomControl>
      )}

      {/* Render earthquake circles with estimated impact radii */}
      {earthquakeData
        ?.map(item => {
          const impactRadii = (item as any).impact_radii;
          const baseColor = getEarthquakeSeverityColor(item.severity || '');
          const circles = [];

          // Check if current map style is light (OpenStreetMap default)
          const isLightMap = styleUrl === 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png';

          // Adjust visibility based on map style
          const visibilityMultiplier = isLightMap ? 2.5 : 1; // Double opacity for light maps
          const strokeMultiplier = isLightMap ? 1.5 : 1; // Thicker strokes for light maps

          if (!impactRadii) {
            // Fallback circle for earthquakes without radius data
            circles.push(
              <Circle
                key={`circle-${item.uid}`}
                center={[item.lat, item.lng]}
                radius={10000}
                pathOptions={{
                  color: baseColor,
                  opacity: Math.min(0.3 * visibilityMultiplier, 0.8),
                  fillOpacity: Math.min(0.1 * visibilityMultiplier, 0.3),
                  weight: Math.round(2 * strokeMultiplier),
                }}
              />
            );
          } else {
            // Felt radius circle (outermost) - dashed line
            if (impactRadii.felt_radius_km) {
              circles.push(
                <Circle
                  key={`felt-${item.uid}`}
                  center={[item.lat, item.lng]}
                  radius={impactRadii.felt_radius_km * 1000}
                  pathOptions={{
                    color: baseColor,
                    opacity: Math.min(0.2 * visibilityMultiplier, 0.6),
                    fillOpacity: Math.min(0.05 * visibilityMultiplier, 0.15),
                    weight: Math.round(1 * strokeMultiplier),
                    dashArray: isLightMap ? '8, 4' : '5, 5', // More visible dashes on light maps
                  }}
                />
              );
            }

            // Moderate shaking radius circle (middle)
            if (impactRadii.moderate_shaking_radius_km) {
              circles.push(
                <Circle
                  key={`moderate-${item.uid}`}
                  center={[item.lat, item.lng]}
                  radius={impactRadii.moderate_shaking_radius_km * 1000}
                  pathOptions={{
                    color: baseColor,
                    opacity: Math.min(0.4 * visibilityMultiplier, 0.8),
                    fillOpacity: Math.min(0.1 * visibilityMultiplier, 0.25),
                    weight: Math.round(2 * strokeMultiplier),
                  }}
                />
              );
            }

            // Strong shaking radius circle (innermost) - most visible
            if (impactRadii.strong_shaking_radius_km) {
              circles.push(
                <Circle
                  key={`strong-${item.uid}`}
                  center={[item.lat, item.lng]}
                  radius={impactRadii.strong_shaking_radius_km * 1000}
                  pathOptions={{
                    color: baseColor,
                    opacity: Math.min(0.6 * visibilityMultiplier, 0.9),
                    fillOpacity: Math.min(0.15 * visibilityMultiplier, 0.35),
                    weight: Math.round(3 * strokeMultiplier),
                  }}
                />
              );
            }
          }

          return circles;
        })
        .flat()}

      {/* Legacy support for mixed data with circles */}
      {!earthquakeData &&
        data
          ?.filter(item => {
            if (markerType === 'mixed') {
              return item.severity || item.magnitude;
            }
            return markerType === 'earthquake' || markerType === 'circle';
          })
          .map(item => {
            const radiusInMeters = (item as any).impact_radii?.felt_radius_km
              ? (item as any).impact_radii.felt_radius_km * 1000
              : 10000;

            // Check if current map style is light (OpenStreetMap default)
            const isLightMap = styleUrl === 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png';
            const visibilityMultiplier = isLightMap ? 2 : 1;
            const strokeMultiplier = isLightMap ? 1.5 : 1;

            return (
              <Circle
                key={`circle-${item.uid}`}
                center={[item.lat, item.lng]}
                radius={radiusInMeters}
                pathOptions={{
                  color: getEarthquakeSeverityColor(item.severity || ''),
                  opacity: Math.min(0.3 * visibilityMultiplier, 0.8),
                  fillOpacity: Math.min(0.1 * visibilityMultiplier, 0.3),
                  weight: Math.round(2 * strokeMultiplier),
                }}
              />
            );
          })}

      {/* Render earthquake markers */}
      {earthquakeData?.map(item => (
        <Marker
          position={[item.lat, item.lng]}
          icon={createCircleMarker(item)}
          key={`eq-${item.uid}`}
          eventHandlers={{
            click: () => onMarkerClick?.(item),
          }}
        >
          <Popup className="custom-popup">{getPopupRenderer(item)}</Popup>
        </Marker>
      ))}

      {/* Render status markers */}
      {statusData
        ?.filter(item => item.lat !== null && item.lng !== null)
        ?.map(item => (
          <Marker
            position={[item.lat!, item.lng!]}
            icon={renderMarkerIcon(item)}
            key={`status-${item.uid}`}
            eventHandlers={{
              click: () => {
                // Convert StatusData to MapMarkerData format for callback
                const mapData: MapMarkerData = {
                  uid: item.uid,
                  lat: item.lat!,
                  lng: item.lng!,
                  condition: item.condition,
                };
                onMarkerClick?.(mapData);
              },
            }}
          >
            <Popup className="custom-popup">{getPopupRenderer(item)}</Popup>
          </Marker>
        ))}

      {/* Legacy support for single data array */}
      {data?.map(item => (
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
