const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DANGER_ZONE_BASELINE_WARNING,
  EvacuationRouteSelectionService,
  EvacuationRoutingError,
  ROUTE_ADVISORY_WARNING,
  haversineDistanceMeters,
} = require('../dist/src/services/EvacuationRouteSelectionService');

const origin = { lat: 14.2919325, lng: 120.7752839 };

const center = (overrides) => ({
  id: 'center-1',
  clientId: 'naic',
  name: 'Main Center',
  status: 'available',
  coordinates: { lat: 14.3, lng: 120.78 },
  ...overrides,
});

const route = (durationSeconds) => ({
  provider: 'mapbox',
  profile: 'mapbox/driving',
  geometry: {
    type: 'LineString',
    coordinates: [
      [120.7752839, 14.2919325],
      [120.78, 14.3],
    ],
  },
  distanceMeters: durationSeconds * 10,
  durationSeconds,
});

test('filters available same-client centers with valid coordinates', () => {
  const centers = EvacuationRouteSelectionService.filterAvailableCenters(
    [
      center({ id: 'available' }),
      center({ id: 'full', status: 'full' }),
      center({ id: 'other-client', clientId: 'other' }),
      center({ id: 'missing-coordinates', coordinates: null }),
      center({ id: 'invalid-coordinates', coordinates: { lat: 120, lng: 14 } }),
    ],
    'naic'
  );

  assert.deepEqual(
    centers.map(item => item.id),
    ['available']
  );
});

test('orders nearest route candidates by straight-line distance', () => {
  const near = center({ id: 'near', coordinates: { lat: 14.292, lng: 120.776 } });
  const far = center({ id: 'far', coordinates: { lat: 14.35, lng: 120.83 } });

  assert.equal(
    haversineDistanceMeters(origin, near.coordinates) < haversineDistanceMeters(origin, far.coordinates),
    true
  );
  assert.deepEqual(
    EvacuationRouteSelectionService.getNearestCandidates(origin, [far, near]).map(item => item.id),
    ['near', 'far']
  );
});

test('automatic route selection chooses shortest successful duration among nearest candidates', async () => {
  const slowNear = center({ id: 'slow-near', coordinates: { lat: 14.292, lng: 120.776 } });
  const fastFar = center({ id: 'fast-far', coordinates: { lat: 14.31, lng: 120.79 } });

  const result = await EvacuationRouteSelectionService.chooseRoute({
    origin,
    centers: [slowNear, fastFar],
    routeProvider: async item => route(item.id === 'slow-near' ? 900 : 300),
  });

  assert.equal(result.center.id, 'fast-far');
  assert.equal(result.route.durationSeconds, 300);
});

test('selected-center route uses only the requested center', async () => {
  const selected = center({ id: 'selected' });
  const other = center({ id: 'other' });
  const visited = [];

  const result = await EvacuationRouteSelectionService.chooseRoute({
    origin,
    centers: [other, selected],
    targetCenterId: 'selected',
    routeProvider: async item => {
      visited.push(item.id);
      return route(100);
    },
  });

  assert.equal(result.center.id, 'selected');
  assert.deepEqual(visited, ['selected']);
});

test('route selection reports unavailable selected centers and provider failure', async () => {
  await assert.rejects(
    () =>
      EvacuationRouteSelectionService.chooseRoute({
        origin,
        centers: [center({ id: 'available' })],
        targetCenterId: 'missing',
        routeProvider: async () => route(100),
      }),
    error => error instanceof EvacuationRoutingError && error.statusCode === 404
  );

  await assert.rejects(
    () =>
      EvacuationRouteSelectionService.chooseRoute({
        origin,
        centers: [center({ id: 'available' })],
        routeProvider: async () => {
          throw new Error('Mapbox unavailable');
        },
      }),
    error => error instanceof EvacuationRoutingError && error.statusCode === 502
  );
});

test('route warnings include danger-zone baseline warning only when needed', () => {
  assert.deepEqual(EvacuationRouteSelectionService.buildWarnings(0), [ROUTE_ADVISORY_WARNING]);
  assert.deepEqual(EvacuationRouteSelectionService.buildWarnings(2), [
    ROUTE_ADVISORY_WARNING,
    DANGER_ZONE_BASELINE_WARNING,
  ]);
});
