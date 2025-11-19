# USGS Earthquake API Integration

## Overview

The system integrates with the United States Geological Survey (USGS) Earthquake Hazards Program API to fetch real-time earthquake data within a 150km radius of specified coordinates.

## API Endpoint

```
https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=14.2919325&longitude=120.7752839&maxradiuskm=150
```

### Parameters

| Parameter     | Value         | Description                  |
| ------------- | ------------- | ---------------------------- |
| `format`      | `geojson`     | Response format (GeoJSON)    |
| `latitude`    | `14.2919325`  | Center latitude for search   |
| `longitude`   | `120.7752839` | Center longitude for search  |
| `maxradiuskm` | `150`         | Maximum radius in kilometers |

## Response Structure

### Metadata Object

```typescript
interface USGSMetadata {
  generated: number; // Timestamp when data was generated
  url: string; // Request URL
  title: string; // "USGS Earthquakes"
  status: number; // HTTP status code
  api: string; // API version
  count: number; // Number of earthquakes in response
}
```

### Feature Object (Earthquake Data)

```typescript
interface USGSEarthquake {
  type: 'Feature';
  properties: {
    mag: number; // Magnitude
    place: string; // Location description
    time: number; // Occurrence timestamp (milliseconds)
    updated: number; // Last update timestamp (milliseconds)
    tz: number | null; // Timezone offset
    url: string; // USGS event page URL
    detail: string; // Detailed API endpoint URL
    felt: number | null; // Number of "Did You Feel It?" responses
    cdi: number | null; // Maximum Community Determined Intensity
    mmi: number | null; // Maximum Modified Mercalli Intensity
    alert: string | null; // Alert level (green, yellow, orange, red)
    status: string; // Review status
    tsunami: number; // Tsunami warning flag (0 or 1)
    sig: number; // Significance score
    net: string; // Data source network
    code: string; // Event code
    ids: string; // Event IDs (comma-separated)
    sources: string; // Data sources (comma-separated)
    types: string; // Data types available
    nst: number; // Number of seismic stations
    dmin: number; // Minimum distance to stations
    rms: number; // Root mean square travel time residual
    gap: number; // Largest azimuthal gap
    magType: string; // Magnitude type (mb, ml, mw, etc.)
    type: 'earthquake'; // Event type
    title: string; // Event title
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [longitude, latitude, depth]
  };
  id: string; // Unique earthquake identifier
}
```

### Complete Response Structure

```typescript
interface USGSResponse {
  type: 'FeatureCollection';
  metadata: USGSMetadata;
  features: USGSEarthquake[];
}
```

## Sample Response

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "generated": 1763512396000,
    "url": "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=14.2919325&longitude=120.7752839&maxradiuskm=150",
    "title": "USGS Earthquakes",
    "status": 200,
    "api": "1.14.1",
    "count": 1
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "mag": 4.6,
        "place": "6 km NW of Bagalangit, Philippines",
        "time": 1763373268186,
        "updated": 1763387967040,
        "tz": null,
        "url": "https://earthquake.usgs.gov/earthquakes/eventpage/us6000rnq9",
        "detail": "https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=us6000rnq9&format=geojson",
        "felt": null,
        "cdi": null,
        "mmi": null,
        "alert": null,
        "status": "reviewed",
        "tsunami": 0,
        "sig": 326,
        "net": "us",
        "code": "6000rnq9",
        "ids": ",us6000rnq9,",
        "sources": ",us,",
        "types": ",origin,phase-data,",
        "nst": 37,
        "dmin": 14.088,
        "rms": 0.91,
        "gap": 89,
        "magType": "mb",
        "type": "earthquake",
        "title": "M 4.6 - 6 km NW of Bagalangit, Philippines"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [120.8377, 13.7424, 146.927]
      },
      "id": "us6000rnq9"
    }
  ]
}
```

## Data Processing Rules

### Magnitude Classification

| Magnitude | Classification | Notification Priority |
| --------- | -------------- | --------------------- |
| < 2.0     | Micro          | None                  |
| 2.0 - 2.9 | Minor          | Low                   |
| 3.0 - 3.9 | Minor          | Low                   |
| 4.0 - 4.9 | Light          | Medium                |
| 5.0 - 5.9 | Moderate       | High                  |
| 6.0 - 6.9 | Strong         | Critical              |
| 7.0 - 7.9 | Major          | Critical              |
| 8.0+      | Great          | Emergency             |

### Filtering Criteria

1. **Geographic**: Within 150km radius of coordinates
2. **Temporal**: Last 30 days (USGS default)
3. **Magnitude**: All magnitudes (filtering done in application)
4. **Status**: All statuses (automatic, reviewed, deleted)

### Unique Identification

- Use the `id` field as the primary key
- The ID format is typically: `{network}{eventcode}` (e.g., "us6000rnq9")
- IDs are globally unique across all USGS earthquake events

## Error Handling

### HTTP Status Codes

| Code | Description         | Action                               |
| ---- | ------------------- | ------------------------------------ |
| 200  | Success             | Process data                         |
| 400  | Bad Request         | Log error, retry with default params |
| 404  | Not Found           | Log error, continue monitoring       |
| 500  | Server Error        | Retry after delay                    |
| 503  | Service Unavailable | Retry with exponential backoff       |

### Empty Response Handling

```typescript
// When features array is empty
if (response.features.length === 0) {
  console.log('No new earthquakes in the last 30 days');
  // Continue monitoring, no action needed
}
```

## Rate Limits

- **Limit**: No official rate limit documented
- **Recommended**: 1 request per 5 minutes (our current schedule)
- **Best Practice**: Implement exponential backoff for errors

## API Reliability

- **Uptime**: ~99.9% (USGS commitment)
- **Data Latency**: 1-30 minutes from event occurrence
- **Update Frequency**: Continuous updates as more data becomes available

## Implementation Example

```typescript
async function fetchEarthquakeData(): Promise<USGSResponse> {
  const url = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
  const params = new URLSearchParams({
    format: 'geojson',
    latitude: '14.2919325',
    longitude: '120.7752839',
    maxradiuskm: '150',
  });

  try {
    const response = await fetch(`${url}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: USGSResponse = await response.json();

    console.log(`Fetched ${data.features.length} earthquakes`);
    return data;
  } catch (error) {
    console.error('Failed to fetch earthquake data:', error);
    throw error;
  }
}
```
