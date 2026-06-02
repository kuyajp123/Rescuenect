declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import type { ClientEarthquakeImpact, EarthquakeClientScope, ProcessedEarthquake, USGSEarthquake } from './types.ts';

const MINUTE_MS = 60 * 1000;
const DEFAULT_HISTORY_LOOKBACK_DAYS = 30;
const DEFAULT_HISTORY_QUERY_LIMIT = 500;
const DEFAULT_MAX_EVENT_AGE_MINUTES = 12 * 60;
const DEFAULT_FUTURE_TOLERANCE_MINUTES = 5;

type EarthquakeFetchOptions = {
  now?: number;
  queryLookbackMinutes?: number;
};

function getNumericEnv(key: string, fallback: number, min: number, max: number): number {
  const raw = Deno.env.get(key);
  if (!raw) return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(max, Math.max(min, parsed));
}

export function getEarthquakeFreshnessConfig(): {
  maxEventAgeMinutes: number;
  futureToleranceMinutes: number;
} {
  return {
    maxEventAgeMinutes: getNumericEnv('EARTHQUAKE_MAX_EVENT_AGE_MINUTES', DEFAULT_MAX_EVENT_AGE_MINUTES, 5, 24 * 60),
    futureToleranceMinutes: getNumericEnv(
      'EARTHQUAKE_EVENT_FUTURE_TOLERANCE_MINUTES',
      DEFAULT_FUTURE_TOLERANCE_MINUTES,
      0,
      60
    ),
  };
}

export function getEarthquakeHistoryConfig(): {
  historyLookbackMinutes: number;
  historyLookbackDays: number;
  queryLimit: number;
} {
  const historyLookbackDays = getNumericEnv('EARTHQUAKE_HISTORY_LOOKBACK_DAYS', DEFAULT_HISTORY_LOOKBACK_DAYS, 1, 45);

  return {
    historyLookbackDays,
    historyLookbackMinutes: Math.round(historyLookbackDays * 24 * 60),
    queryLimit: getNumericEnv('EARTHQUAKE_HISTORY_QUERY_LIMIT', DEFAULT_HISTORY_QUERY_LIMIT, 50, 2000),
  };
}

export function getEarthquakeEventAgeMinutes(eventTime: number, now = Date.now()): number {
  return Math.round(((now - eventTime) / MINUTE_MS) * 10) / 10;
}

export function isEarthquakeEventFresh(
  earthquake: Pick<ProcessedEarthquake, 'time' | 'id'> | Pick<USGSEarthquake, 'id'> & { properties: { time: number } },
  now = Date.now()
): boolean {
  const eventTime = 'time' in earthquake ? earthquake.time : earthquake.properties.time;
  if (!Number.isFinite(eventTime)) return false;

  const { maxEventAgeMinutes, futureToleranceMinutes } = getEarthquakeFreshnessConfig();
  const oldestAllowed = now - maxEventAgeMinutes * MINUTE_MS;
  const newestAllowed = now + futureToleranceMinutes * MINUTE_MS;

  return eventTime >= oldestAllowed && eventTime <= newestAllowed;
}

function toUsgsDateTime(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Fetch earthquake data from USGS for one active LGU client scope.
 */
export async function fetchUSGSEarthquakesForScope(
  scope: EarthquakeClientScope,
  options: EarthquakeFetchOptions = {}
): Promise<USGSEarthquake[]> {
  const now = options.now ?? Date.now();
  const freshness = getEarthquakeFreshnessConfig();
  const history = getEarthquakeHistoryConfig();
  const queryLookbackMinutes = options.queryLookbackMinutes ?? history.historyLookbackMinutes;
  const startTime = now - queryLookbackMinutes * MINUTE_MS;
  const endTime = now + freshness.futureToleranceMinutes * MINUTE_MS;
  const params = new URLSearchParams({
    format: 'geojson',
    latitude: scope.centerLatitude.toString(),
    longitude: scope.centerLongitude.toString(),
    maxradiuskm: scope.radiusKm.toString(),
    minmagnitude: scope.minMagnitude.toString(),
    starttime: toUsgsDateTime(startTime),
    endtime: toUsgsDateTime(endTime),
    orderby: 'time',
    limit: history.queryLimit.toString(),
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
  const features = Array.isArray(data.features) ? (data.features as USGSEarthquake[]) : [];
  return features.filter(earthquake => {
    const eventTime = earthquake.properties?.time;
    return Number.isFinite(eventTime) && eventTime >= startTime && eventTime <= endTime;
  });
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
  const ageMinutes = getEarthquakeEventAgeMinutes(earthquake.time);

  console.log('Checking notification criteria for earthquake:', {
    id: earthquake.id,
    magnitude: earthquake.magnitude,
    clientId: impact?.clientId,
    distance_km: distanceKm,
    tsunami_warning: earthquake.tsunami_warning,
    severity: earthquake.severity,
    event_time: new Date(earthquake.time).toISOString(),
    age_minutes: ageMinutes,
  });

  if (!isEarthquakeEventFresh(earthquake)) {
    console.warn(`Skipping stale earthquake notification for ${earthquake.id}: event is ${ageMinutes} minutes old`);
    return false;
  }

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
