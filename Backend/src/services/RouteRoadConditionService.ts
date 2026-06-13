import {
  RoadCondition,
  RoadConditionSegment,
  RoadConditionSource,
  RoadConditionSummary,
  RouteCoordinates,
  RouteLineString,
} from '@/types/evacuationRoute';

type MapboxIncident = {
  id?: unknown;
  type?: unknown;
  description?: unknown;
  long_description?: unknown;
  impact?: unknown;
  closed?: unknown;
  congestion?: { value?: unknown };
  geometry_index_start?: unknown;
  geometry_index_end?: unknown;
};

type MapboxClosure = {
  geometry_index_start?: unknown;
  geometry_index_end?: unknown;
};

export type MapboxRouteConditionInput = {
  geometry: RouteLineString;
  durationTypicalSeconds?: number | null;
  legs?: Array<{
    incidents?: MapboxIncident[];
    closures?: MapboxClosure[];
    annotation?: {
      congestion?: unknown[];
      congestion_numeric?: unknown[];
      speed?: unknown[];
      duration?: unknown[];
    };
  }>;
};

const CONDITION_RANK: Record<RoadCondition, number> = {
  closed: 6,
  incident: 5,
  severe: 4,
  heavy: 3,
  moderate: 2,
  low: 1,
  unknown: 0,
};

export const EMPTY_ROAD_CONDITION_SUMMARY: RoadConditionSummary = {
  available: false,
  source: 'none',
  worstCondition: 'unknown',
  closureCount: 0,
  incidentCount: 0,
  hasLiveTraffic: false,
};

const asFiniteNumber = (value: unknown): number | null => {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

const getConditionLabel = (condition: RoadCondition): string => {
  switch (condition) {
    case 'closed':
      return 'Road closure';
    case 'incident':
      return 'Road incident';
    case 'severe':
      return 'Severe traffic';
    case 'heavy':
      return 'Heavy traffic';
    case 'moderate':
      return 'Moderate traffic';
    case 'low':
      return 'Low traffic';
    default:
      return 'Road condition unknown';
  }
};

const normalizeCongestion = (value: unknown): RoadCondition => {
  const congestion = asString(value).toLowerCase();
  return congestion === 'severe' || congestion === 'heavy' || congestion === 'moderate' || congestion === 'low'
    ? congestion
    : 'unknown';
};

const normalizeIndexRange = (start: unknown, end: unknown, segmentCount: number): [number, number] | null => {
  const startIndex = asFiniteNumber(start);
  const endIndex = asFiniteNumber(end);
  if (startIndex === null || endIndex === null || segmentCount <= 0) return null;
  const normalizedStart = Math.max(0, Math.min(segmentCount - 1, Math.floor(startIndex)));
  const normalizedEnd = Math.max(normalizedStart, Math.min(segmentCount - 1, Math.floor(endIndex)));
  return [normalizedStart, normalizedEnd];
};

const isIndexInRange = (index: number, range: [number, number]): boolean => index >= range[0] && index <= range[1];

const getWorstCondition = (segments: RoadConditionSegment[]): RoadCondition =>
  segments.reduce<RoadCondition>(
    (worst, segment) => (CONDITION_RANK[segment.condition] > CONDITION_RANK[worst] ? segment.condition : worst),
    'unknown'
  );

export const buildRoadConditionSummary = (
  segments: RoadConditionSegment[],
  source: RoadConditionSource,
  hasLiveTraffic: boolean
): RoadConditionSummary => ({
  available: segments.length > 0 && source !== 'none',
  source: segments.length > 0 ? source : 'none',
  worstCondition: getWorstCondition(segments),
  closureCount: segments.filter(segment => segment.condition === 'closed').length,
  incidentCount: segments.filter(segment => segment.condition === 'incident').length,
  hasLiveTraffic,
});

export class RouteRoadConditionService {
  static buildFromMapboxDirections(route: MapboxRouteConditionInput): {
    summary: RoadConditionSummary;
    segments: RoadConditionSegment[];
  } {
    const leg = route.legs?.[0];
    const annotation = leg?.annotation ?? {};
    const coordinates = route.geometry.coordinates;
    const segmentCount = Math.max(0, coordinates.length - 1);
    if (segmentCount === 0) {
      return { summary: EMPTY_ROAD_CONDITION_SUMMARY, segments: [] };
    }

    const closureRanges = (leg?.closures ?? [])
      .map(closure => normalizeIndexRange(closure.geometry_index_start, closure.geometry_index_end, segmentCount))
      .filter((range): range is [number, number] => Boolean(range));
    const incidentRanges = (leg?.incidents ?? [])
      .map(incident => ({
        incident,
        range: normalizeIndexRange(incident.geometry_index_start, incident.geometry_index_end, segmentCount),
      }))
      .filter((item): item is { incident: MapboxIncident; range: [number, number] } => Boolean(item.range));

    const segments: RoadConditionSegment[] = [];
    for (let index = 0; index < segmentCount; index++) {
      const incident = incidentRanges.find(item => isIndexInRange(index, item.range))?.incident;
      const isClosed =
        closureRanges.some(range => isIndexInRange(index, range)) ||
        incident?.closed === true ||
        asFiniteNumber(incident?.congestion?.value) === 100;

      const condition: RoadCondition = isClosed
        ? 'closed'
        : incident
          ? 'incident'
          : normalizeCongestion(annotation.congestion?.[index]);

      segments.push({
        id: `mapbox-condition-${index}`,
        geometry: {
          type: 'LineString',
          coordinates: [coordinates[index], coordinates[index + 1]],
        },
        condition,
        label: getConditionLabel(condition),
        speedMetersPerSecond: asFiniteNumber(annotation.speed?.[index]),
        typicalDurationSeconds: route.durationTypicalSeconds ?? null,
        liveDurationSeconds: asFiniteNumber(annotation.duration?.[index]),
        congestionNumeric: asFiniteNumber(incident?.congestion?.value) ?? asFiniteNumber(annotation.congestion_numeric?.[index]),
        incidentType: incident ? asString(incident.type) || null : null,
        incidentDescription: incident
          ? asString(incident.description) || asString(incident.long_description) || null
          : null,
        source: 'mapbox_directions',
      });
    }

    return {
      summary: buildRoadConditionSummary(segments, 'mapbox_directions', true),
      segments,
    };
  }

  static buildFromSampledTraffic(points: Array<RouteCoordinates & { congestion?: unknown; closed?: unknown }>): {
    summary: RoadConditionSummary;
    segments: RoadConditionSegment[];
  } {
    const segments = points.flatMap((point, index): RoadConditionSegment[] => {
      if (index === points.length - 1) return [];
      const nextPoint = points[index + 1];
      const condition: RoadCondition = point.closed === 'yes' || point.closed === true ? 'closed' : normalizeCongestion(point.congestion);
      return [
        {
          id: `tilequery-condition-${index}`,
          geometry: {
            type: 'LineString',
            coordinates: [
              [point.lng, point.lat],
              [nextPoint.lng, nextPoint.lat],
            ],
          },
          condition,
          label: getConditionLabel(condition),
          speedMetersPerSecond: null,
          typicalDurationSeconds: null,
          liveDurationSeconds: null,
          congestionNumeric: null,
          incidentType: null,
          incidentDescription: null,
          source: 'mapbox_traffic_tilequery',
        },
      ];
    });

    return {
      summary: buildRoadConditionSummary(segments, 'mapbox_traffic_tilequery', segments.length > 0),
      segments,
    };
  }
}
