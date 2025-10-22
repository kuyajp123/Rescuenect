# Reusable Map Component

A flexible and customizable React Leaflet map component for displaying markers with popups.

## Features

- 🗺️ **Fully customizable** - Configure center, zoom, dimensions, and styling
- 📍 **Flexible markers** - Support for custom marker icons and click handlers
- 🎨 **Custom popups** - Default smart popup or custom popup renderer
- 📱 **Responsive** - Configurable dimensions and responsive design
- 🎯 **TypeScript support** - Full type safety and IntelliSense
- 🔧 **Extensible** - Easy to extend with additional features

## Basic Usage

```tsx
import { Map } from '@/components/ui/status/Map';
import status from '@/data/statusData.json';

function MyComponent() {
  return (
    <Map 
      data={status}
      height="500px"
      width="100%"
    />
  );
}
```

## Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | `MapMarkerData[]` | Array of objects with `id`, `lat`, `lng` properties |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `center` | `[number, number]` | `[14.2965, 120.7925]` | Map center coordinates [lat, lng] |
| `zoom` | `number` | `13` | Initial zoom level |
| `minZoom` | `number` | `1` | Minimum zoom level |
| `maxZoom` | `number` | `18` | Maximum zoom level |
| `height` | `string` | `'100%'` | Map container height |
| `width` | `string` | `'100%'` | Map container width |
| `markerIcon` | `L.Icon` | `defaultIcon` | Custom Leaflet icon |
| `tileLayerUrl` | `string` | OpenStreetMap | Custom tile layer URL |
| `attribution` | `string` | OSM attribution | Map attribution text |
| `renderPopup` | `(item) => ReactNode` | `undefined` | Custom popup renderer |
| `showCoordinates` | `boolean` | `true` | Show coordinates in default popup |
| `onMarkerClick` | `(item) => void` | `undefined` | Marker click handler |
| `className` | `string` | `undefined` | Additional CSS classes |

## Data Structure

Your data should follow this interface:

```typescript
interface MapMarkerData {
  id: number | string;    // Required: Unique identifier
  lat: number;           // Required: Latitude
  lng: number;           // Required: Longitude
  [key: string]: any;    // Optional: Any additional properties
}
```

## Examples

### 1. Basic Map with Status Data

```tsx
import { Map } from '@/components/ui/status/Map';
import status from '@/data/statusData.json';

export const BasicStatusMap = () => {
  return (
    <Map 
      data={status}
      center={[14.2965, 120.7925]}
      zoom={13}
      height="500px"
    />
  );
};
```

### 2. Custom Popup Renderer

```tsx
export const CustomPopupMap = () => {
  const customPopup = (item) => (
    <div className="p-4">
      <h3 className="font-bold">{item.firstName} {item.lastName}</h3>
      <p className="text-sm">Status: {item.status}</p>
      <p className="text-sm">Date: {item.date}</p>
    </div>
  );

  return (
    <Map 
      data={status}
      renderPopup={customPopup}
      showCoordinates={false}
    />
  );
};
```

### 3. Filtered Data Map

```tsx
export const MissingPersonsMap = () => {
  const missingPersons = status.filter(person => person.status === 'missing');

  return (
    <Map 
      data={missingPersons}
      center={[14.2965, 120.7925]}
      zoom={14}
      height="400px"
    />
  );
};
```

### 4. Interactive Map with Click Handlers

```tsx
export const InteractiveMap = () => {
  const handleMarkerClick = (item) => {
    alert(`Clicked on ${item.firstName} ${item.lastName}`);
  };

  return (
    <Map 
      data={status}
      onMarkerClick={handleMarkerClick}
      height="600px"
    />
  );
};
```

### 5. Custom Styling and Configuration

```tsx
export const CustomStyledMap = () => {
  return (
    <Map 
      data={status}
      center={[14.3000, 120.7700]}
      zoom={15}
      minZoom={10}
      maxZoom={20}
      height="70vh"
      width="100%"
      className="border-2 border-gray-300 rounded-lg shadow-lg"
      tileLayerUrl="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
      attribution='&copy; OpenTopoMap contributors'
    />
  );
};
```

## Default Popup Features

The default popup automatically displays relevant information if available in your data:

- **Coordinates** (if `showCoordinates={true}`)
- **Name** (firstName + lastName)
- **Status** (with color coding)
- **Date & Time**
- **Location**
- **Contact**
- **Description**

## Status Color Coding

The default popup includes automatic color coding for status:

- 🟢 **Safe** - Green
- 🔵 **Evacuated** - Blue  
- 🔴 **Missing** - Red
- 🟠 **Affected** - Orange
- ⚫ **Unknown** - Gray

## Custom Icons

You can provide custom marker icons:

```tsx
import L from 'leaflet';
import customIconUrl from './custom-marker.png';

const customIcon = new L.Icon({
  iconUrl: customIconUrl,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

<Map data={data} markerIcon={customIcon} />
```

## Performance Tips

- For large datasets (>1000 markers), consider implementing clustering
- Use `React.memo()` for the Map component if re-rendering frequently
- Filter data before passing to the component rather than inside it

## Dependencies

- `react-leaflet`
- `leaflet`
- `react`

Make sure to import the Leaflet CSS:
```tsx
import 'leaflet/dist/leaflet.css';
```
