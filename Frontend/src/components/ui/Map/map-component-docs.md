# Map Component Documentation

A flexible and feature-rich React map component built with React Leaflet, designed for displaying location-based data with customizable markers, popups, and map styles.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Component API](#component-api)
- [Features](#features)
- [Examples](#examples)
- [Type Definitions](#type-definitions)

## Installation

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

Ensure you have the required marker icon assets in your project at `leaflet/dist/images/`.

## Basic Usage

```tsx
import { Map } from '@/components/Map';

function App() {
  const markers = [
    {
      uid: '1',
      lat: 14.2965,
      lng: 120.7925,
      condition: 'safe',
    },
  ];

  return <Map data={markers} center={[14.2965, 120.7925]} zoom={13} height="500px" />;
}
```

## Component API

### Props

| Prop                  | Type                                                       | Default                   | Description                                            |
| --------------------- | ---------------------------------------------------------- | ------------------------- | ------------------------------------------------------ |
| `data`                | `MapMarkerData[]`                                          | `undefined`               | Legacy single array of marker data (optional)          |
| `earthquakeData`      | `MapMarkerData[]`                                          | `undefined`               | Array of earthquake-specific marker data (optional)    |
| `statusData`          | `MapMarkerData[]`                                          | `undefined`               | Array of status-specific marker data (optional)        |
| `center`              | `[number, number]`                                         | `[14.2965, 120.7925]`     | Map center coordinates [latitude, longitude]           |
| `zoom`                | `number`                                                   | `13`                      | Initial zoom level                                     |
| `minZoom`             | `number`                                                   | `13`                      | Minimum zoom level allowed                             |
| `maxZoom`             | `number`                                                   | `18`                      | Maximum zoom level allowed                             |
| `height`              | `string`                                                   | `'100%'`                  | Map container height                                   |
| `width`               | `string`                                                   | `'100%'`                  | Map container width                                    |
| `markerType`          | `'default' \| 'status' \| 'earthquake' \| 'circle'`        | `'default'`               | Marker display type                                    |
| `renderPopup`         | `(item: MapMarkerData) => React.ReactNode`                 | `undefined`               | Custom popup renderer function                         |
| `popupType`           | `'default' \| 'coordinates' \| 'custom'`                   | `'default'`               | Popup display type                                     |
| `showCoordinates`     | `boolean`                                                  | `true`                    | Show coordinates in default popup                      |
| `onMarkerClick`       | `(item: MapMarkerData) => void`                            | `undefined`               | Callback when marker is clicked                        |
| `className`           | `string`                                                   | `undefined`               | CSS class for map container                            |
| `hasMapStyleSelector` | `boolean`                                                  | `true`                    | Show map style selector control                        |
| `zoomControl`         | `boolean`                                                  | `true`                    | Show zoom controls                                     |
| `dragging`            | `boolean`                                                  | `true`                    | Enable map dragging and interactions                   |
| `hasMapControl`       | `boolean`                                                  | `false`                   | Enable automatic centering on markers                  |
| `overlayComponent`    | `React.ReactNode`                                          | `undefined`               | Custom overlay component                               |
| `attribution`         | `string`                                                   | OpenStreetMap attribution | Map tile attribution text                              |
| `overlayPosition`     | `'topright' \| 'topleft' \| 'bottomright' \| 'bottomleft'` | `'topright'`              | Position of overlay component                          |
| `overlayClassName`    | `string`                                                   | `''`                      | CSS class for overlay control                          |
| `circleRadius`        | `number`                                                   | `12`                      | Radius of circle markers (for earthquake/circle types) |
| `circleOpacity`       | `number`                                                   | `0.8`                     | Opacity of circle markers (0-1)                        |
| `circleStrokeWidth`   | `number`                                                   | `2`                       | Border width of circle markers                         |
| `circleStrokeColor`   | `string`                                                   | `'#ffffff'`               | Border color of circle markers                         |

## Data Approaches

The Map component supports two data approaches:

### 1. Separated Data Arrays (Recommended)

Use separate arrays for different data types for cleaner code organization:

```tsx
<Map
  earthquakeData={earthquakeArray} // Earthquake-specific data
  statusData={statusArray} // Status-specific data
  // Automatically renders appropriate marker types
/>
```

**Benefits:**

- Cleaner data management
- Better type safety
- Explicit rendering (no marker type guessing)
- Easier maintenance
- Better performance (no filtering needed)

### 2. Single Data Array (Legacy)

Use a single array with `markerType` prop:

```tsx
<Map
  data={mixedDataArray}
  markerType="mixed" // Auto-detects marker type based on data properties
/>
```

## Features

### 1. Status-Based Markers

The component supports four marker conditions with different colored icons:

- **Safe** (Green) - `condition: 'safe'`
- **Evacuated** (Blue) - `condition: 'evacuated'`
- **Affected** (Orange) - `condition: 'affected'`
- **Missing** (Red) - `condition: 'missing'`

### 2. Earthquake Circle Markers

The component supports earthquake severity-based circle markers with color coding:

- **Micro** (Yellow-Green) - `severity: 'micro'` - Magnitude < 2.0
- **Minor** (Gold/Yellow) - `severity: 'minor'` - Magnitude 2.0-3.9
- **Light** (Orange) - `severity: 'light'` - Magnitude 4.0-4.9
- **Moderate** (Orange-Red) - `severity: 'moderate'` - Magnitude 5.0-5.9
- **Strong** (Red) - `severity: 'strong'` - Magnitude 6.0-6.9
- **Major** (Dark Red) - `severity: 'major'` - Magnitude 7.0-7.9
- **Great** (Very Dark Red) - `severity: 'great'` - Magnitude 8.0+

### 3. Map Style Selector

Built-in control to switch between different map tile styles (when `hasMapStyleSelector={true}`).

### 4. Custom Popups

Three popup types available:

- **default**: Shows coordinates and custom data
- **coordinates**: Shows only lat/lng coordinates
- **custom**: Use your own popup renderer

### 5. Dynamic Tile Layers

Seamlessly switch between different map tile providers without remounting the map.

### 6. Custom Overlays

Add custom React components as map overlays positioned at any corner.

### 7. Auto-Centering

Automatically center the map on marker data when `hasMapControl={true}`.

## Examples

### Example 1: Basic Map with Default Markers

```tsx
import { Map } from '@/components/Map';

function BasicMap() {
  const locations = [
    { uid: '1', lat: 14.2965, lng: 120.7925 },
    { uid: '2', lat: 14.3, lng: 120.8 },
  ];

  return <Map data={locations} center={[14.2965, 120.7925]} zoom={14} height="600px" />;
}
```

### Example 1b: Separated Data Arrays (Recommended)

```tsx
import { Map } from '@/components/Map';

function SeparatedDataMap() {
  const earthquakeData = [
    { uid: 'eq1', lat: 14.2965, lng: 120.7925, severity: 'moderate', magnitude: 5.2 },
    { uid: 'eq2', lat: 14.3, lng: 120.8, severity: 'light', magnitude: 4.1 },
  ];

  const statusData = [
    { uid: 'st1', lat: 14.31, lng: 120.75, condition: 'safe' },
    { uid: 'st2', lat: 14.29, lng: 120.81, condition: 'evacuated' },
  ];

  return (
    <Map
      earthquakeData={earthquakeData}
      statusData={statusData}
      center={[14.2965, 120.7925]}
      zoom={13}
      height="600px"
    />
  );
}
```

### Example 2: Status-Based Markers

```tsx
function StatusMap() {
  const emergencyData = [
    { uid: '1', lat: 14.2965, lng: 120.7925, condition: 'safe' },
    { uid: '2', lat: 14.3, lng: 120.8, condition: 'evacuated' },
    { uid: '3', lat: 14.28, lng: 120.78, condition: 'affected' },
    { uid: '4', lat: 14.31, lng: 120.81, condition: 'missing' },
  ];

  return <Map data={emergencyData} markerType="status" center={[14.2965, 120.7925]} zoom={13} height="600px" />;
}
```

### Example 3: Earthquake Circle Markers

```tsx
function EarthquakeMap() {
  const earthquakeData = [
    { uid: 'eq1', lat: 14.2965, lng: 120.7925, severity: 'minor', magnitude: 3.2 },
    { uid: 'eq2', lat: 14.3, lng: 120.8, severity: 'light', magnitude: 4.5 },
    { uid: 'eq3', lat: 14.28, lng: 120.78, severity: 'moderate', magnitude: 5.8 },
    { uid: 'eq4', lat: 14.31, lng: 120.81, severity: 'strong', magnitude: 6.2 },
  ];

  return (
    <Map
      earthquakeData={earthquakeData}
      center={[14.2965, 120.7925]}
      zoom={12}
      height="600px"
      circleRadius={15}
      circleOpacity={0.9}
      circleStrokeWidth={3}
      circleStrokeColor="#ffffff"
    />
  );
}
```

### Example 3b: Legacy Single Array Approach

```tsx
function LegacyEarthquakeMap() {
  const earthquakeData = [
    { uid: '1', lat: 14.2965, lng: 120.7925, severity: 'minor', magnitude: 3.2 },
    { uid: '2', lat: 14.3, lng: 120.8, severity: 'light', magnitude: 4.5 },
  ];

  return <Map data={earthquakeData} markerType="earthquake" center={[14.2965, 120.7925]} zoom={12} height="600px" />;
}
```

### Example 4: Custom Popup Content

```tsx
function CustomPopupMap() {
  const residentsData = [
    {
      uid: '1',
      lat: 14.2965,
      lng: 120.7925,
      name: 'John Doe',
      status: 'Safe',
      phone: '09123456789',
    },
  ];

  const customPopupRenderer = (item: MapMarkerData) => (
    <div className="p-2">
      <h3 className="font-bold text-lg">{item.name}</h3>
      <p className="text-sm">Status: {item.status}</p>
      <p className="text-sm">Phone: {item.phone}</p>
      <p className="text-xs text-gray-500 mt-2">
        {item.lat}, {item.lng}
      </p>
    </div>
  );

  return (
    <Map
      data={residentsData}
      popupType="custom"
      renderPopup={customPopupRenderer}
      center={[14.2965, 120.7925]}
      zoom={14}
    />
  );
}
```

### Example 5: Interactive Map with Click Handler

```tsx
function InteractiveMap() {
  const [selectedMarker, setSelectedMarker] = useState(null);

  const markers = [
    { uid: '1', lat: 14.2965, lng: 120.7925, name: 'Location A' },
    { uid: '2', lat: 14.3, lng: 120.8, name: 'Location B' },
  ];

  const handleMarkerClick = (marker: MapMarkerData) => {
    setSelectedMarker(marker);
    console.log('Clicked marker:', marker);
  };

  return (
    <div>
      <Map data={markers} onMarkerClick={handleMarkerClick} center={[14.2965, 120.7925]} zoom={13} height="500px" />
      {selectedMarker && <div className="mt-4 p-4 bg-blue-100 rounded">Selected: {selectedMarker.name}</div>}
    </div>
  );
}
```

### Example 6: Map with Custom Overlay

```tsx
function MapWithOverlay() {
  const CustomLegend = () => (
    <div className="bg-white p-4 rounded shadow-lg">
      <h4 className="font-bold mb-2">Legend</h4>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Safe</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Evacuated</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span>Affected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Missing</span>
        </div>
      </div>
    </div>
  );

  return (
    <Map
      data={statusMarkers}
      markerType="status"
      overlayComponent={<CustomLegend />}
      overlayPosition="bottomright"
      center={[14.2965, 120.7925]}
      zoom={13}
      height="600px"
    />
  );
}
```

### Example 7: Static Map (No Interactions)

```tsx
function StaticMap() {
  const locations = [{ uid: '1', lat: 14.2965, lng: 120.7925, condition: 'safe' }];

  return (
    <Map
      data={locations}
      markerType="status"
      dragging={false}
      zoomControl={false}
      hasMapStyleSelector={false}
      center={[14.2965, 120.7925]}
      zoom={15}
      height="400px"
      className="border-2 border-gray-300 rounded"
    />
  );
}
```

### Example 8: Auto-Centering Map

```tsx
function AutoCenterMap() {
  const [markers, setMarkers] = useState([{ uid: '1', lat: 14.2965, lng: 120.7925, condition: 'safe' }]);

  const addRandomMarker = () => {
    const newMarker = {
      uid: Date.now().toString(),
      lat: 14.2965 + (Math.random() - 0.5) * 0.1,
      lng: 120.7925 + (Math.random() - 0.5) * 0.1,
      condition: 'safe',
    };
    setMarkers([newMarker, ...markers]);
  };

  return (
    <div>
      <button onClick={addRandomMarker} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">
        Add Marker
      </button>
      <Map
        data={markers}
        hasMapControl={true}
        markerType="status"
        center={[14.2965, 120.7925]}
        zoom={14}
        height="500px"
      />
    </div>
  );
}
```

## Type Definitions

### MapMarkerData

```typescript
interface MapMarkerData {
  uid: string;
  lat: number;
  lng: number;
  condition?: 'safe' | 'evacuated' | 'affected' | 'missing';
  // Earthquake-specific fields
  severity?: 'micro' | 'minor' | 'light' | 'moderate' | 'strong' | 'major' | 'great';
  magnitude?: number;
  [key: string]: any; // Additional custom properties
}
```

### MapProps

```typescript
interface MapProps {
  // Data props - can use either single data array or separate arrays
  data?: MapMarkerData[];
  earthquakeData?: MapMarkerData[];
  statusData?: MapMarkerData[];

  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  height?: string;
  width?: string;
  markerType?: 'default' | 'status' | 'earthquake' | 'circle' | 'mixed';
  renderPopup?: (item: MapMarkerData) => React.ReactNode;
  popupType?: 'default' | 'coordinates' | 'custom';
  showCoordinates?: boolean;
  onMarkerClick?: (item: MapMarkerData) => void;
  className?: string;
  hasMapStyleSelector?: boolean;
  zoomControl?: boolean;
  dragging?: boolean;
  hasMapControl?: boolean;
  overlayComponent?: React.ReactNode;
  attribution?: string;
  overlayPosition?: 'topright' | 'topleft' | 'bottomright' | 'bottomleft';
  overlayClassName?: string;
  // Circle marker customization (for earthquake and circle types)
  circleRadius?: number;
  circleOpacity?: number;
  circleStrokeWidth?: number;
  circleStrokeColor?: string;
}
```

## Styling

The component uses Leaflet's default CSS. Import it in your app:

```tsx
import 'leaflet/dist/leaflet.css';
```

You can customize popup styles by targeting the `.custom-popup` class or by adding custom classes via the `className` prop.

### Example 9: Custom Circle Markers

```tsx
function CustomCircleMap() {
  const customData = [
    { uid: '1', lat: 14.2965, lng: 120.7925, severity: 'light' },
    { uid: '2', lat: 14.3, lng: 120.8, severity: 'moderate' },
    { uid: '3', lat: 14.28, lng: 120.78, severity: 'strong' },
  ];

  return (
    <Map
      data={customData}
      markerType="circle"
      center={[14.2965, 120.7925]}
      zoom={13}
      height="500px"
      // Custom circle styling
      circleRadius={20}
      circleOpacity={0.9}
      circleStrokeWidth={4}
      circleStrokeColor="#000000"
    />
  );
}
```

## Earthquake Severity Color Reference

| Severity     | Color                   | Magnitude Range | Description                                            |
| ------------ | ----------------------- | --------------- | ------------------------------------------------------ |
| **Micro**    | Yellow-Green (#ADFF2F)  | < 2.0           | Generally not felt                                     |
| **Minor**    | Gold/Yellow (#FFD700)   | 2.0 - 3.9       | Often felt, rarely causes damage                       |
| **Light**    | Orange (#FFA500)        | 4.0 - 4.9       | Noticeable shaking, minor damage                       |
| **Moderate** | Orange-Red (#FF4500)    | 5.0 - 5.9       | Can cause major damage to poorly constructed buildings |
| **Strong**   | Red (#FF0000)           | 6.0 - 6.9       | Can be destructive in areas up to 160km                |
| **Major**    | Dark Red (#8B0000)      | 7.0 - 7.9       | Can cause serious damage over large areas              |
| **Great**    | Very Dark Red (#4B0000) | 8.0+            | Can cause serious damage in areas hundreds of km wide  |

## Notes

- The component requires marker icon assets at specific paths. Ensure these are available in your build.
- The default center coordinates are set for a location in the Philippines (14.2965, 120.7925).
- Map interactions (dragging, zooming, etc.) can be disabled by setting `dragging={false}`.
- The `hasMapControl` prop enables automatic centering on the first marker in the combined data arrays.
- **Recommended Approach**: Use `earthquakeData` and `statusData` props for cleaner separation of concerns.
- **Legacy Support**: The `data` prop with `markerType` is still supported for backward compatibility.
- When using separated data arrays, the component automatically:
  - Renders earthquake data as circle markers with circles
  - Renders status data as icon markers without circles
  - Combines all data for map centering when `hasMapControl={true}`

## Browser Compatibility

This component works in all modern browsers that support:

- ES6+ JavaScript
- React 16.8+ (Hooks)
- Leaflet 1.7+

## Performance Tips

- **Use Separated Data Arrays**: The `earthquakeData` and `statusData` approach is more performant than the legacy `data` array with filtering.
- For large datasets (1000+ markers), consider implementing marker clustering.
- Use `React.memo()` for custom popup components to prevent unnecessary re-renders.
- Memoize the `onMarkerClick` callback using `useCallback()` to optimize performance.

## Migration Guide

### From Legacy Single Array to Separated Arrays

**Before (Legacy):**

```tsx
const allData = [
  { uid: 'eq1', lat: 14.2965, lng: 120.7925, severity: 'moderate', magnitude: 5.2 },
  { uid: 'st1', lat: 14.31, lng: 120.75, condition: 'safe' },
];

<Map data={allData} markerType="mixed" />;
```

**After (Recommended):**

```tsx
const earthquakeData = [{ uid: 'eq1', lat: 14.2965, lng: 120.7925, severity: 'moderate', magnitude: 5.2 }];

const statusData = [{ uid: 'st1', lat: 14.31, lng: 120.75, condition: 'safe' }];

<Map earthquakeData={earthquakeData} statusData={statusData} />;
```
