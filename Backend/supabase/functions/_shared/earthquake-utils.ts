import type { ProcessedEarthquake, USGSEarthquake } from './types.ts';

// NAIC_CENTER center coordinates for distance calculation
const NAIC_CENTER = { lat: 14.2919325, lng: 120.7752839 };

/**
 * Fetch earthquake data from USGS API
 */
export async function fetchUSGSEarthquakes(): Promise<USGSEarthquake[]> {
  const params = new URLSearchParams({
    format: 'geojson',
    latitude: NAIC_CENTER.lat.toString(),
    longitude: NAIC_CENTER.lng.toString(),
    maxradiuskm: '70', // 70km radius around Naic center
    minmagnitude: '1.5', // Only get earthquakes above 1.5 magnitude
    orderby: 'time',
    limit: '50', // Limit to 50 most recent
  });

  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`;

  console.log('🌐 Fetching from USGS:', url);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Rescuenect-EarthquakeMonitor/1.0 (+https://rescuenect.com)',
    },
  });

  if (!response.ok) {
    throw new Error(`USGS API failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.features || [];
}

/**
 * Process raw USGS earthquake data
 */
export function processEarthquakeData(earthquake: USGSEarthquake): ProcessedEarthquake {
  const magnitude = earthquake.properties.mag;
  const severity = classifyEarthquakeSeverity(magnitude);
  const priority = determinePriority(magnitude);
  const depth = Math.abs(earthquake.geometry.coordinates[2]); // Ensure positive depth

  // Calculate distance from Naic center
  const distanceFromCenter = calculateDistance(
    NAIC_CENTER.lat,
    NAIC_CENTER.lng,
    earthquake.geometry.coordinates[1],
    earthquake.geometry.coordinates[0]
  );

  // Estimate earthquake impact radii
  const radiiEstimation = estimateEarthquakeRadii(magnitude, depth);

  return {
    id: earthquake.id,
    magnitude: magnitude,
    place: earthquake.properties.place,
    time: earthquake.properties.time,
    updated: earthquake.properties.updated,
    coordinates: {
      longitude: earthquake.geometry.coordinates[0],
      latitude: earthquake.geometry.coordinates[1],
      depth: depth,
    },
    severity: severity,
    priority: priority,
    tsunami_warning: earthquake.properties.tsunami === 1,
    usgs_url: earthquake.properties.url,
    distance_km: distanceFromCenter,
    // Add earthquake impact radii
    impact_radii: {
      felt_radius_km: radiiEstimation.feltRadiusKmRounded,
      moderate_shaking_radius_km: radiiEstimation.moderateRadiusKmRounded,
      strong_shaking_radius_km: radiiEstimation.strongRadiusKmRounded,
      estimation_params: radiiEstimation.params,
    },
    notification_sent: false,
  };
}

/**
 * Classify earthquake severity based on magnitude
 */
export function classifyEarthquakeSeverity(magnitude: number): ProcessedEarthquake['severity'] {
  if (magnitude < 2.0) return 'micro';
  if (magnitude < 4.0) return 'minor';
  if (magnitude < 5.0) return 'light';
  if (magnitude < 6.0) return 'moderate';
  if (magnitude < 7.0) return 'strong';
  if (magnitude < 8.0) return 'major';
  return 'great';
}

/**
 * Determine notification priority based on magnitude
 */
export function determinePriority(magnitude: number): ProcessedEarthquake['priority'] {
  if (magnitude < 3.0) return 'low';
  if (magnitude < 5.0) return 'normal';
  if (magnitude < 6.0) return 'high';
  return 'critical';
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Filter earthquakes that should trigger notifications
 */
export function shouldNotify(earthquake: ProcessedEarthquake): boolean {
  console.log(`🔍 Checking notification criteria for earthquake:`, {
    id: earthquake.id,
    magnitude: earthquake.magnitude,
    distance_km: earthquake.distance_km,
    tsunami_warning: earthquake.tsunami_warning,
    severity: earthquake.severity,
  });

  // Don't notify for micro earthquakes
  if (earthquake.magnitude < 2.0) {
    console.log(`❌ Below magnitude threshold (${earthquake.magnitude} < 2.0)`);
    return false;
  }

  // Always notify for strong earthquakes
  if (earthquake.magnitude >= 5.0) {
    console.log(`✅ Strong earthquake - always notify (magnitude ${earthquake.magnitude})`);
    return true;
  }

  // Always notify for tsunami warnings
  if (earthquake.tsunami_warning) {
    console.log(`✅ Tsunami warning - always notify`);
    return true;
  }

  // Notify for moderate earthquakes closer to populated areas
  if (earthquake.magnitude >= 4.0 && earthquake.distance_km && earthquake.distance_km <= 50) {
    console.log(`✅ Moderate earthquake within 50km (${earthquake.distance_km}km)`);
    return true;
  }

  // For testing: lower the threshold - notify for magnitude 4.0+ within 150km
  if (earthquake.magnitude >= 4.0 && earthquake.distance_km && earthquake.distance_km <= 150) {
    console.log(`✅ Testing: Magnitude 4.0+ within 150km (${earthquake.distance_km}km)`);
    return true;
  }

  // Notify for minor earthquakes very close to populated areas
  if (earthquake.magnitude >= 3.0 && earthquake.distance_km && earthquake.distance_km <= 20) {
    console.log(`✅ Minor earthquake very close (${earthquake.distance_km}km)`);
    return true;
  }

  console.log(`❌ Does not meet notification criteria`);
  return false;
}

/**
 * Format earthquake time for display
 */
export function formatEarthquakeTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Estimate earthquake radii (heuristic).
 * Returns estimated km for felt, moderate, and strong shaking.
 *
 * NOTE: Heuristic only — prefer ShakeMap or local models for official impact.
 */
export function estimateEarthquakeRadii(
  magnitude: number,
  depthKm: number,
  opts?: {
    // tunable coefficients (defaults shown)
    feltA?: number; // default 1.0
    moderateA?: number; // default 0.1
    strongA?: number; // default 0.02
    B?: number; // scale exponent on magnitude, default 0.5
    D?: number; // depth attenuation scale (km), default 100
  }
) {
  const feltA = opts?.feltA ?? 1.0;
  const moderateA = opts?.moderateA ?? 0.1;
  const strongA = opts?.strongA ?? 0.02;
  const B = opts?.B ?? 0.5;
  const D = opts?.D ?? 100;

  // base factor 10^(B * M)
  const base = Math.pow(10, B * magnitude);

  // depth attenuation
  const attenuation = Math.exp(-depthKm / D);

  const feltRadiusKm = feltA * base * attenuation;
  const moderateRadiusKm = moderateA * base * attenuation;
  const strongRadiusKm = strongA * base * attenuation;

  return {
    feltRadiusKm,
    moderateRadiusKm,
    strongRadiusKm,
    // Also return human-friendly rounded values
    feltRadiusKmRounded: Math.round(feltRadiusKm * 10) / 10,
    moderateRadiusKmRounded: Math.round(moderateRadiusKm * 10) / 10,
    strongRadiusKmRounded: Math.round(strongRadiusKm * 10) / 10,
    // parameters used
    params: { feltA, moderateA, strongA, B, D },
  };
}

/**
 * Get emoji for earthquake severity
 */
export function getEarthquakeEmoji(severity: string, tsunamiWarning: boolean): string {
  if (tsunamiWarning) return '🌊';

  switch (severity) {
    case 'micro':
      return '🔵';
    case 'minor':
      return '🟡';
    case 'light':
      return '🟠';
    case 'moderate':
      return '🔴';
    case 'strong':
      return '🚨';
    case 'major':
      return '⚠️';
    case 'great':
      return '🆘';
    default:
      return '🔶';
  }
}
