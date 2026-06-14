const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DangerZoneAvoidanceGeometryService,
} = require('../dist/src/services/DangerZoneAvoidanceGeometryService');

const baseZone = overrides => ({
  id: overrides.id ?? 'zone-1',
  clientId: 'naic',
  source: 'lgu_official',
  status: 'verified',
  isActive: true,
  type: 'flooded_road',
  severity: overrides.severity ?? 'medium',
  description: 'Danger zone',
  geometryType: 'point',
  center: { lat: 14.29, lng: 120.75 },
  radiusMeters: null,
  geojson: null,
  affectedWidthMeters: null,
  avoidGeojson: null,
  photoUrls: [],
  reportedBy: 'admin-1',
  reportedByRole: 'lgu_admin',
  createdAt: { seconds: overrides.createdAtSeconds ?? 1 },
  updatedAt: { seconds: overrides.createdAtSeconds ?? 1 },
  ...overrides,
});

test('builds ORS avoid polygons for point, circle, line, and polygon zones', () => {
  const avoidGeojson = DangerZoneAvoidanceGeometryService.buildOpenRouteServiceAvoidPolygons([
    baseZone({ id: 'point-zone', geometryType: 'point' }),
    baseZone({
      id: 'circle-zone',
      geometryType: 'circle',
      radiusMeters: 120,
    }),
    baseZone({
      id: 'line-zone',
      geometryType: 'line',
      geojson: {
        type: 'LineString',
        coordinates: [
          [120.75, 14.29],
          [120.76, 14.3],
        ],
      },
      affectedWidthMeters: 30,
    }),
    baseZone({
      id: 'polygon-zone',
      geometryType: 'polygon',
      geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [120.75, 14.29],
            [120.76, 14.29],
            [120.76, 14.3],
            [120.75, 14.29],
          ],
        ],
      },
    }),
  ]);

  assert.equal(avoidGeojson.type, 'MultiPolygon');
  assert.equal(avoidGeojson.coordinates.length, 4);
  assert.ok(avoidGeojson.coordinates.every(polygon => polygon[0].length >= 4));
});

test('single polygon zone stays an ORS Polygon', () => {
  const avoidGeojson = DangerZoneAvoidanceGeometryService.buildOpenRouteServiceAvoidPolygons([
    baseZone({
      geometryType: 'polygon',
      geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [120.75, 14.29],
            [120.76, 14.29],
            [120.76, 14.3],
            [120.75, 14.29],
          ],
        ],
      },
    }),
  ]);

  assert.equal(avoidGeojson.type, 'Polygon');
  assert.deepEqual(avoidGeojson.coordinates[0][0], [120.75, 14.29]);
});

test('builds Mapbox exclude points from all geometry types', () => {
  const points = DangerZoneAvoidanceGeometryService.buildMapboxExcludePoints([
    baseZone({ id: 'point-zone', geometryType: 'point' }),
    baseZone({
      id: 'circle-zone',
      geometryType: 'circle',
      center: { lat: 14.31, lng: 120.77 },
      radiusMeters: 100,
    }),
    baseZone({
      id: 'line-zone',
      geometryType: 'line',
      geojson: {
        type: 'LineString',
        coordinates: [
          [120.78, 14.32],
          [120.79, 14.33],
        ],
      },
    }),
    baseZone({
      id: 'polygon-zone',
      geometryType: 'polygon',
      geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [120.8, 14.34],
            [120.81, 14.34],
            [120.81, 14.35],
            [120.8, 14.34],
          ],
        ],
      },
    }),
  ]);

  assert.ok(points.length >= 12);
  assert.ok(points.every(point => Number.isFinite(point.lat) && Number.isFinite(point.lng)));
});

test('Mapbox exclude points are deduped, capped, and severity prioritized', () => {
  const lowZones = Array.from({ length: 60 }, (_, index) =>
    baseZone({
      id: `low-${index}`,
      severity: 'low',
      center: { lat: 14.1 + index / 1000, lng: 120.1 + index / 1000 },
      createdAtSeconds: index,
    })
  );

  const points = DangerZoneAvoidanceGeometryService.buildMapboxExcludePoints([
    ...lowZones,
    baseZone({
      id: 'critical-newest',
      severity: 'critical',
      center: { lat: 14.9, lng: 120.9 },
      createdAtSeconds: 999,
    }),
  ]);

  assert.equal(points.length, 50);
  assert.deepEqual(points[0], { lat: 14.9, lng: 120.9 });
});
