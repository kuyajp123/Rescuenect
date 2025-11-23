import { EarthquakeGeoJSONCollection, GeoJSONEarthquake, ProcessedEarthquake } from '@/types/types';

/**
 * Converts GeoJSON earthquake data to ProcessedEarthquake format
 */
export function convertGeoJSONToProcessedEarthquake(geoJsonEarthquake: GeoJSONEarthquake): ProcessedEarthquake {
  const [lng, lat, depth] = geoJsonEarthquake.geometry.coordinates;

  // Determine severity based on magnitude
  const getSeverityFromMagnitude = (
    mag: number
  ): 'micro' | 'minor' | 'light' | 'moderate' | 'strong' | 'major' | 'great' => {
    if (mag < 2.0) return 'micro';
    if (mag < 4.0) return 'minor';
    if (mag < 5.0) return 'light';
    if (mag < 6.0) return 'moderate';
    if (mag < 7.0) return 'strong';
    if (mag < 8.0) return 'major';
    return 'great';
  };

  return {
    id: geoJsonEarthquake.id,
    magnitude: geoJsonEarthquake.properties.mag,
    place: geoJsonEarthquake.properties.place,
    time: geoJsonEarthquake.properties.time,
    updated: geoJsonEarthquake.properties.updated,
    coordinates: {
      longitude: lng,
      latitude: lat,
      depth: depth,
    },
    severity: getSeverityFromMagnitude(geoJsonEarthquake.properties.mag),
    priority: 'normal', // Default priority since not in JSON
    tsunami_warning: geoJsonEarthquake.properties.tsunami === 1,
    usgs_url: geoJsonEarthquake.properties.url,
    // Generate mock impact radii based on magnitude for testing
    impact_radii: {
      felt_radius_km: geoJsonEarthquake.properties.mag * 15,
      moderate_shaking_radius_km: geoJsonEarthquake.properties.mag * 8,
      strong_shaking_radius_km: geoJsonEarthquake.properties.mag * 4,
      estimation_params: {
        feltA: 10,
        moderateA: 8,
        strongA: 6,
        B: 2.3,
        D: depth || 10,
      },
    },
    notification_sent: false,
  };
}

/**
 * Converts an array of GeoJSON earthquakes to ProcessedEarthquake format
 */
export function convertGeoJSONCollectionToProcessed(collection: EarthquakeGeoJSONCollection): ProcessedEarthquake[] {
  return collection.features.map(convertGeoJSONToProcessedEarthquake);
}

/**
 * Converts ProcessedEarthquake to Map marker format
 */
export function convertProcessedEarthquakeToMapMarker(earthquake: ProcessedEarthquake) {
  return {
    uid: earthquake.id,
    lat: earthquake.coordinates.latitude,
    lng: earthquake.coordinates.longitude,
    severity: earthquake.severity,
    magnitude: earthquake.magnitude,
    place: earthquake.place,
    time: earthquake.time,
    tsunami_warning: earthquake.tsunami_warning,
    usgs_url: earthquake.usgs_url,
    priority: earthquake.priority,
    impact_radii: earthquake.impact_radii,
  };
}

/**
 * Unified adapter function that handles both data sources
 */
export function adaptEarthquakeDataForMap(data: ProcessedEarthquake[] | EarthquakeGeoJSONCollection) {
  // Check if it's GeoJSON collection
  if ('features' in data && data.type === 'FeatureCollection') {
    const processedData = convertGeoJSONCollectionToProcessed(data);
    return processedData.map(convertProcessedEarthquakeToMapMarker);
  }

  // It's already ProcessedEarthquake array
  return (data as ProcessedEarthquake[]).map(convertProcessedEarthquakeToMapMarker);
}
