# Map Component Documentation

## Overview

The Map component is a comprehensive, feature-rich mapping solution built on top of React-Leaflet and OpenStreetMap. It provides a flexible foundation for displaying interactive maps with markers, overlays, and various customization options.

## Table of Contents

- [Component Architecture](#component-architecture)
- [Core Components](#core-components)
- [Props Reference](#props-reference)
- [Usage Examples](#usage-examples)
- [Extending the Map](#extending-the-map)
- [Adding New Features](#adding-new-features)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)

## Component Architecture

```
Map Component Structure:
├── Map (Main Component)
│   ├── DynamicTileLayer (Tile Management)
│   ├── CustomControl (Overlay System)
│   ├── Markers (Data Visualization)
│   └── Popups (Information Display)
│
├── MapStyleSelector (Style Switching)
└── Supporting Types (TypeScript Interfaces)
```

## Core Components

### 1. Main Map Component

**Location**: `src/components/ui/status/Map/index.tsx`

The primary map component that orchestrates all mapping functionality.

#### Key Features:

- Dynamic tile layer switching
- Custom marker rendering
- Overlay component system
- Popup customization
- Event handling
- Responsive design

### 2. DynamicTileLayer

**Purpose**: Handles runtime switching between different map styles (Light/Dark themes)

```tsx
interface DynamicTileLayerProps {
  url: string;
  attribution: string;
}
```

**Features**:

- Runtime tile layer switching
- Proper cleanup of previous layers
- Attribution management
- Seamless style transitions

### 3. CustomControl

**Purpose**: Renders React components as Leaflet map controls

```tsx
interface CustomControlProps {
  position?: 'topright' | 'topleft' | 'bottomright' | 'bottomleft';
  children: React.ReactNode;
  className?: string;
}
```

**Features**:

- React component integration with Leaflet
- Event isolation (prevents map interaction conflicts)
- Flexible positioning
- Custom styling support

### 4. MapStyleSelector

**Location**: `src/components/ui/status/Map/MapStyleSelector.tsx`

**Purpose**: Icon-based dropdown for switching map themes

**Features**:

- Icon-only interface
- Dropdown style selection
- localStorage persistence
- Light/Dark theme support

## Props Reference

### MapProps Interface

```tsx
interface MapProps {
  // Required props
  data: MapMarkerData[]; // Array of markers to display

  // Map Configuration
  center?: [number, number]; // Initial map center [lat, lng]
  zoom?: number; // Initial zoom level
  minZoom?: number; // Minimum zoom level
  maxZoom?: number; // Maximum zoom level
  height?: string; // Map container height
  width?: string; // Map container width

  // Visual Customization
  markerType?: 'status' | 'default'; // Marker icon type
  tileLayerUrl?: string; // Custom tile layer URL
  attribution?: string; // Map attribution text
  className?: string; // Additional CSS classes

  // Popup Configuration
  renderPopup?: (item: MapMarkerData) => React.ReactNode; // Custom popup renderer
  popupType?: 'default' | 'coordinates' | 'custom'; // Popup type
  showCoordinates?: boolean; // Show coordinates in popup

  // Event Handlers
  onMarkerClick?: (item: MapMarkerData) => void; // Marker click handler
  onTileLayerChange?: (url: string) => void; // Tile layer change handler

  // Overlay System
  overlayComponent?: React.ReactNode; // Custom overlay component
  overlayPosition?: 'topright' | 'topleft' | 'bottomright' | 'bottomleft';
  overlayClassName?: string; // Overlay CSS classes
}
```

### MapMarkerData Interface

```tsx
interface MapMarkerData {
  uid: string; // Unique identifier
  lat: number; // Latitude
  lng: number; // Longitude
  condition: 'safe' | 'evacuated' | 'affected' | 'missing'; // Status type
}
```

## Usage Examples

### Basic Usage

```tsx
import { Map } from '@/components/ui/status/Map';

const mapData = [
  { uid: '1', lat: 14.2965, lng: 120.7925, condition: 'safe' },
  { uid: '2', lat: 14.3, lng: 120.8, condition: 'affected' },
];

function MyComponent() {
  return <Map data={mapData} center={[14.2965, 120.7925]} zoom={13} markerType="status" />;
}
```

### Advanced Usage with Overlays

```tsx
import { Map } from '@/components/ui/status/Map';
import { MapStyleSelector } from '@/components/ui/status/Map/MapStyleSelector';

function AdvancedMapComponent() {
  const [tileUrl, setTileUrl] = useState('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png');

  const handleMarkerClick = marker => {
    console.log('Marker clicked:', marker);
  };

  const handleStyleChange = styleUrl => {
    setTileUrl(styleUrl);
  };

  return (
    <Map
      data={mapData}
      center={[14.2965, 120.7925]}
      zoom={13}
      markerType="status"
      tileLayerUrl={tileUrl}
      onMarkerClick={handleMarkerClick}
      overlayComponent={<MapStyleSelector onStyleChange={handleStyleChange} />}
      overlayPosition="topright"
      popupType="coordinates"
    />
  );
}
```

### Custom Popup Renderer

```tsx
const customPopupRenderer = (item: MapMarkerData) => (
  <div className="p-4">
    <h3 className="font-bold">{item.condition}</h3>
    <p>User ID: {item.uid}</p>
    <p>
      Location: {item.lat}, {item.lng}
    </p>
  </div>
);

<Map data={mapData} renderPopup={customPopupRenderer} popupType="custom" />;
```

## Extending the Map

### Adding New Control Components

To add new clickable components (compass, camera controls, etc.), follow the CustomControl pattern:

#### 1. Create a New Control Component

```tsx
// src/components/ui/status/Map/CompassControl.tsx
import { useMap } from 'react-leaflet';
import { Compass } from 'lucide-react';

interface CompassControlProps {
  onCompassClick?: () => void;
}

export const CompassControl = ({ onCompassClick }: CompassControlProps) => {
  const map = useMap();

  const handleCompassClick = () => {
    // Reset map rotation to north (if using rotation plugin)
    // map.setBearing(0);
    onCompassClick?.();
  };

  return (
    <button onClick={handleCompassClick} className="bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg border">
      <Compass size={20} />
    </button>
  );
};
```

#### 2. Integrate with CustomControl

```tsx
<CustomControl position="topleft">
  <CompassControl onCompassClick={() => console.log('Compass clicked')} />
</CustomControl>
```

### Adding Camera Controls

#### Camera Pan Component

```tsx
// src/components/ui/status/Map/CameraControls.tsx
import { useMap } from 'react-leaflet';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export const CameraControls = () => {
  const map = useMap();

  const panMap = (direction: 'up' | 'down' | 'left' | 'right') => {
    const panAmount = 0.01; // Adjust pan sensitivity
    const center = map.getCenter();

    switch (direction) {
      case 'up':
        map.panTo([center.lat + panAmount, center.lng]);
        break;
      case 'down':
        map.panTo([center.lat - panAmount, center.lng]);
        break;
      case 'left':
        map.panTo([center.lat, center.lng - panAmount]);
        break;
      case 'right':
        map.panTo([center.lat, center.lng + panAmount]);
        break;
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg border">
      <div className="grid grid-cols-3 gap-1">
        <div></div>
        <button onClick={() => panMap('up')} className="p-1 hover:bg-gray-100 rounded">
          <ChevronUp size={16} />
        </button>
        <div></div>

        <button onClick={() => panMap('left')} className="p-1 hover:bg-gray-100 rounded">
          <ChevronLeft size={16} />
        </button>
        <div></div>
        <button onClick={() => panMap('right')} className="p-1 hover:bg-gray-100 rounded">
          <ChevronRight size={16} />
        </button>

        <div></div>
        <button onClick={() => panMap('down')} className="p-1 hover:bg-gray-100 rounded">
          <ChevronDown size={16} />
        </button>
        <div></div>
      </div>
    </div>
  );
};
```

### Adding Location Controls

#### Go To Location Component

```tsx
// src/components/ui/status/Map/LocationControls.tsx
import { useMap } from 'react-leaflet';
import { MapPin, Home } from 'lucide-react';

interface LocationControlsProps {
  homeLocation?: [number, number];
  onLocationRequest?: () => void;
}

export const LocationControls = ({ homeLocation = [14.2965, 120.7925], onLocationRequest }: LocationControlsProps) => {
  const map = useMap();

  const goToHome = () => {
    map.flyTo(homeLocation, 13);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          map.flyTo([latitude, longitude], 15);
          onLocationRequest?.();
        },
        error => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg border space-y-2">
      <button
        onClick={goToHome}
        className="w-full p-2 hover:bg-gray-100 rounded flex items-center gap-2"
        title="Go to home location"
      >
        <Home size={16} />
        <span className="text-sm">Home</span>
      </button>

      <button
        onClick={getCurrentLocation}
        className="w-full p-2 hover:bg-gray-100 rounded flex items-center gap-2"
        title="Go to current location"
      >
        <MapPin size={16} />
        <span className="text-sm">My Location</span>
      </button>
    </div>
  );
};
```

## Adding New Features

### 1. Map Search Functionality

```tsx
// src/components/ui/status/Map/MapSearch.tsx
import { useState } from 'react';
import { useMap } from 'react-leaflet';
import { Search } from 'lucide-react';

export const MapSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const map = useMap();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      // Using Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const results = await response.json();

      if (results.length > 0) {
        const { lat, lon } = results[0];
        map.flyTo([parseFloat(lat), parseFloat(lon)], 15);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border">
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search location..."
          className="flex-1 px-2 py-1 border rounded text-sm"
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} className="p-1 hover:bg-gray-100 rounded">
          <Search size={16} />
        </button>
      </div>
    </div>
  );
};
```

### 2. Distance Measurement Tool

```tsx
// src/components/ui/status/Map/DistanceTool.tsx
import { useState, useRef } from 'react';
import { useMapEvents } from 'react-leaflet';
import { Ruler } from 'lucide-react';

export const DistanceTool = () => {
  const [isActive, setIsActive] = useState(false);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [totalDistance, setTotalDistance] = useState(0);

  const calculateDistance = (point1: [number, number], point2: [number, number]) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((point2[0] - point1[0]) * Math.PI) / 180;
    const dLon = ((point2[1] - point1[1]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1[0] * Math.PI) / 180) *
        Math.cos((point2[0] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useMapEvents({
    click: e => {
      if (!isActive) return;

      const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
      const newPoints = [...points, newPoint];
      setPoints(newPoints);

      if (newPoints.length > 1) {
        let total = 0;
        for (let i = 1; i < newPoints.length; i++) {
          total += calculateDistance(newPoints[i - 1], newPoints[i]);
        }
        setTotalDistance(total);
      }
    },
  });

  const toggleTool = () => {
    setIsActive(!isActive);
    if (isActive) {
      setPoints([]);
      setTotalDistance(0);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border">
      <button
        onClick={toggleTool}
        className={`w-full p-2 rounded flex items-center gap-2 ${
          isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
        }`}
      >
        <Ruler size={16} />
        <span className="text-sm">{isActive ? 'Stop Measuring' : 'Measure Distance'}</span>
      </button>

      {isActive && totalDistance > 0 && (
        <div className="mt-2 text-sm text-gray-600">Distance: {totalDistance.toFixed(2)} km</div>
      )}
    </div>
  );
};
```

## API Reference

### Map Instance Methods

When using `useMap()` hook inside map components, you have access to the full Leaflet map API:

```tsx
const map = useMap();

// Navigation
map.flyTo([lat, lng], zoom); // Smooth pan and zoom
map.panTo([lat, lng]); // Pan to location
map.setZoom(zoomLevel); // Set zoom level
map.fitBounds(bounds); // Fit to bounds

// Information
map.getCenter(); // Get current center
map.getZoom(); // Get current zoom
map.getBounds(); // Get current bounds

// Events
map.on('click', handler); // Add event listener
map.off('click', handler); // Remove event listener

// Layers
map.addLayer(layer); // Add layer
map.removeLayer(layer); // Remove layer
```

### Available Map Events

```tsx
// Mouse Events
'click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout', 'mousemove';

// Touch Events
'touchstart', 'touchend', 'touchmove';

// View Events
'movestart', 'move', 'moveend', 'zoomstart', 'zoom', 'zoomend';

// Layer Events
'layeradd', 'layerremove';
```

## Best Practices

### 1. Performance Optimization

```tsx
// Memoize marker data to prevent unnecessary re-renders
const memoizedMarkers = useMemo(() => data.map(item => ({ ...item })), [data]);

// Use React.memo for expensive overlay components
const ExpensiveOverlay = React.memo(({ data }) => {
  // Complex rendering logic
});
```

### 2. Event Handler Optimization

```tsx
// Use useCallback for event handlers
const handleMarkerClick = useCallback((marker: MapMarkerData) => {
  // Handle marker click
}, []);
```

### 3. Custom Hook Pattern

```tsx
// Create custom hooks for complex map logic
function useMapControls() {
  const map = useMap();

  const goToLocation = useCallback(
    (lat: number, lng: number) => {
      map.flyTo([lat, lng], 15);
    },
    [map]
  );

  const getCurrentLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      goToLocation(latitude, longitude);
    });
  }, [goToLocation]);

  return { goToLocation, getCurrentLocation };
}
```

### 4. Error Handling

```tsx
// Wrap map operations in try-catch blocks
const safeMapOperation = () => {
  try {
    map.flyTo([lat, lng], zoom);
  } catch (error) {
    console.error('Map operation failed:', error);
    // Fallback behavior
  }
};
```

### 5. Accessibility

```tsx
// Add proper ARIA labels and keyboard support
<button
  onClick={handleAction}
  aria-label="Go to current location"
  onKeyDown={e => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleAction();
    }
  }}
>
  <MapPin />
</button>
```

## Common OpenStreetMap Methods for Additional Features

### Compass/Bearing Control

```tsx
// Note: Basic Leaflet doesn't have rotation, but plugins are available
// For bearing-aware maps, consider using mapbox-gl-js or leaflet plugins

// Simulate compass behavior
const resetNorth = () => {
  map.flyTo(map.getCenter(), map.getZoom(), {
    animate: true,
    duration: 0.5,
  });
};
```

### Geolocation Integration

```tsx
// Built-in browser geolocation
navigator.geolocation.watchPosition(
  position => {
    const { latitude, longitude } = position.coords;
    map.setView([latitude, longitude], 15);
  },
  error => console.error('Geolocation error:', error),
  { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
);
```

### Custom Map Controls

```tsx
// Create custom Leaflet controls
const CustomMapControl = L.Control.extend({
  options: { position: 'topleft' },

  onAdd: function (map) {
    const container = L.DomUtil.create('div', 'custom-control');
    // Add your control content
    return container;
  },
});

// Add to map
map.addControl(new CustomMapControl());
```

---

## Contributing

When adding new features to the Map component:

1. **Follow the existing patterns** for component structure
2. **Use TypeScript interfaces** for all props and data structures
3. **Add proper documentation** to this file
4. **Include usage examples** for new features
5. **Consider performance implications** of new functionality
6. **Test on different screen sizes** and devices
7. **Ensure accessibility compliance**

---

_Last updated: October 19, 2025_
