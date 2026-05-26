import type { ClientEarthquakeImpact, EarthquakeClientScope, ProcessedEarthquake, USGSEarthquake } from './types.ts';

const NAIC_CENTER = { lat: 14.2919325, lng: 120.7752839 };

const DEFAULT_NAIC_SCOPE: EarthquakeClientScope = {
  clientId: 'naic',
  clientName: 'Naic',
  weatherLocationKey: 'naic',
  centerLatitude: NAIC_CENTER.lat,
  centerLongitude: NAIC_CENTER.lng,
  radiusKm: 150,
  minMagnitude: 1.5,
};

/**
 * Fetch earthquake data from USGS for the legacy Naic scope.
 */
export async function fetchUSGSEarthquakes(): Promise<USGSEarthquake[]> {
  return fetchUSGSEarthquakesForScope(DEFAULT_NAIC_SCOPE);
}

/**
 * Fetch earthquake data from USGS for one active LGU client scope.
 */
export async function fetchUSGSEarthquakesForScope(scope: EarthquakeClientScope): Promise<USGSEarthquake[]> {
  const params = new URLSearchParams({
    format: 'geojson',
    latitude: scope.centerLatitude.toString(),
    longitude: scope.centerLongitude.toString(),
    maxradiuskm: scope.radiusKm.toString(),
    minmagnitude: scope.minMagnitude.toString(),
    orderby: 'time',
    limit: '50',
  });

  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`;
  console.log(`Fetching USGS earthquakes for ${scope.clientName}:`, url);

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
 * Process raw USGS earthquake data for the legacy Naic scope.
 */
export function processEarthquakeData(earthquake: USGSEarthquake): ProcessedEarthquake {
  return processEarthquakeDataForScope(earthquake, DEFAULT_NAIC_SCOPE);
}

/**
 * Process raw USGS earthquake data for one client scope.
 */
export function processEarthquakeDataForScope(
  earthquake: USGSEarthquake,
  scope: EarthquakeClientScope
): ProcessedEarthquake {
  const magnitude = earthquake.properties.mag;
  const severity = classifyEarthquakeSeverity(magnitude);
  const priority = determinePriority(magnitude);
  const depth = Math.abs(earthquake.geometry.coordinates[2]);
  const distanceFromCenter = calculateDistance(
    scope.centerLatitude,
    scope.centerLongitude,
    earthquake.geometry.coordinates[1],
    earthquake.geometry.coordinates[0]
  );
  const radiiEstimation = estimateEarthquakeRadii(magnitude, depth);

  return {
    id: earthquake.id,
    magnitude,
    place: earthquake.properties.place,
    time: earthquake.properties.time,
    updated: earthquake.properties.updated,
    coordinates: {
      longitude: earthquake.geometry.coordinates[0],
      latitude: earthquake.geometry.coordinates[1],
      depth,
    },
    severity,
    priority,
    tsunami_warning: earthquake.properties.tsunami === 1,
    usgs_url: earthquake.properties.url,
    distance_km: distanceFromCenter,
    affectedClientIds: [scope.clientId],
    clientImpacts: [
      {
        clientId: scope.clientId,
        clientName: scope.clientName,
        weatherLocationKey: scope.weatherLocationKey,
        distanceKm: distanceFromCenter,
        radiusKm: scope.radiusKm,
      },
    ],
    impact_radii: {
      felt_radius_km: radiiEstimation.feltRadiusKmRounded,
      moderate_shaking_radius_km: radiiEstimation.moderateRadiusKmRounded,
      strong_shaking_radius_km: radiiEstimation.strongRadiusKmRounded,
      estimation_params: radiiEstimation.params,
    },
    notification_sent: false,
  };
}

export function mergeClientEarthquakes(earthquakes: ProcessedEarthquake[]): ProcessedEarthquake[] {
  const byId = new Map<string, ProcessedEarthquake>();

  earthquakes.forEach(earthquake => {
    const existing = byId.get(earthquake.id);
    if (!existing) {
      byId.set(earthquake.id, {
        ...earthquake,
        affectedClientIds: [...new Set(earthquake.affectedClientIds || [])],
        clientImpacts: [...(earthquake.clientImpacts || [])],
      });
      return;
    }

    const mergedImpacts = [...(existing.clientImpacts || []), ...(earthquake.clientImpacts || [])].reduce<
      ClientEarthquakeImpact[]
    >((acc, impact) => {
      if (!acc.some(item => item.clientId === impact.clientId)) acc.push(impact);
      return acc;
    }, []);

    mergedImpacts.sort((left, right) => left.distanceKm - right.distanceKm);

    byId.set(earthquake.id, {
      ...existing,
      affectedClientIds: mergedImpacts.map(impact => impact.clientId),
      clientImpacts: mergedImpacts,
      distance_km: mergedImpacts[0]?.distanceKm ?? existing.distance_km,
    });
  });

  return Array.from(byId.values()).sort((left, right) => right.time - left.time);
}

/**
 * Classify earthquake severity based on magnitude.
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
 * Determine notification priority based on magnitude.
 */
export function determinePriority(magnitude: number): ProcessedEarthquake['priority'] {
  if (magnitude < 3.0) return 'low';
  if (magnitude < 5.0) return 'normal';
  if (magnitude < 6.0) return 'high';
  return 'critical';
}

/**
 * Calculate distance between two coordinates using Haversine formula.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(radiusKm * c * 100) / 100;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Filter earthquakes that should trigger notifications.
 */
export function shouldNotify(earthquake: ProcessedEarthquake, impact?: ClientEarthquakeImpact): boolean {
  const distanceKm = impact?.distanceKm ?? earthquake.distance_km;

  console.log('Checking notification criteria for earthquake:', {
    id: earthquake.id,
    magnitude: earthquake.magnitude,
    clientId: impact?.clientId,
    distance_km: distanceKm,
    tsunami_warning: earthquake.tsunami_warning,
    severity: earthquake.severity,
  });

  if (earthquake.magnitude < 2.0) return false;
  if (earthquake.magnitude >= 5.0) return true;
  if (earthquake.tsunami_warning) return true;
  if (earthquake.magnitude >= 4.0 && distanceKm && distanceKm <= 150) return true;
  if (earthquake.magnitude >= 3.0 && distanceKm && distanceKm <= 20) return true;

  return false;
}

/**
 * Format earthquake time for display.
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
 * Prefer ShakeMap or local models for official impact.
 */
export function estimateEarthquakeRadii(
  magnitude: number,
  depthKm: number,
  opts?: {
    feltA?: number;
    moderateA?: number;
    strongA?: number;
    B?: number;
    D?: number;
  }
) {
  const feltA = opts?.feltA ?? 1.0;
  const moderateA = opts?.moderateA ?? 0.1;
  const strongA = opts?.strongA ?? 0.02;
  const B = opts?.B ?? 0.5;
  const D = opts?.D ?? 100;

  const base = Math.pow(10, B * magnitude);
  const attenuation = Math.exp(-depthKm / D);
  const feltRadiusKm = feltA * base * attenuation;
  const moderateRadiusKm = moderateA * base * attenuation;
  const strongRadiusKm = strongA * base * attenuation;

  return {
    feltRadiusKm,
    moderateRadiusKm,
    strongRadiusKm,
    feltRadiusKmRounded: Math.round(feltRadiusKm * 10) / 10,
    moderateRadiusKmRounded: Math.round(moderateRadiusKm * 10) / 10,
    strongRadiusKmRounded: Math.round(strongRadiusKm * 10) / 10,
    params: { feltA, moderateA, strongA, B, D },
  };
}

/**
 * Get emoji for earthquake severity.
 */
export function getEarthquakeEmoji(severity: string, tsunamiWarning: boolean): string {
  if (tsunamiWarning) return 'Tsunami';

  switch (severity) {
    case 'micro':
      return 'Micro';
    case 'minor':
      return 'Minor';
    case 'light':
      return 'Light';
    case 'moderate':
      return 'Moderate';
    case 'strong':
      return 'Strong';
    case 'major':
      return 'Major';
    case 'great':
      return 'Great';
    default:
      return 'Earthquake';
  }
}
