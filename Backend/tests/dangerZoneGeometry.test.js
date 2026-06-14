const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DangerZoneGeometryService,
  DangerZonePayloadError,
} = require('../dist/src/services/DangerZoneGeometryService');
const {
  DangerZoneFirestoreGeometryService,
} = require('../dist/src/services/DangerZoneFirestoreGeometryService');

const basePayload = {
  type: 'flooded_road',
  severity: 'high',
  description: 'Flooding near the main road',
};

test('resident danger-zone reports remain limited to point and circle', () => {
  assert.throws(
    () =>
      DangerZoneGeometryService.validatePointCirclePayload({
        ...basePayload,
        geometryType: 'line',
        geojson: {
          type: 'LineString',
          coordinates: [
            [120.75, 14.29],
            [120.76, 14.3],
          ],
        },
      }),
    DangerZonePayloadError
  );

  assert.throws(
    () =>
      DangerZoneGeometryService.validatePointCirclePayload({
        ...basePayload,
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
    DangerZonePayloadError
  );
});

test('admin danger-zone validation accepts line geometry with default affected width', () => {
  const input = DangerZoneGeometryService.validateAdminPayload({
    ...basePayload,
    geometryType: 'line',
    geojson: {
      type: 'LineString',
      coordinates: [
        [120.75, 14.29],
        [120.76, 14.3],
      ],
    },
  });

  assert.equal(input.geometryType, 'line');
  assert.equal(input.geojson.type, 'LineString');
  assert.equal(input.geojson.coordinates.length, 2);
  assert.equal(input.affectedWidthMeters, 30);
  assert.equal(input.center, null);
});

test('line and polygon GeoJSON are converted to Firestore-safe point maps', () => {
  const lineStorage = DangerZoneFirestoreGeometryService.toFirestoreGeoJson({
    type: 'LineString',
    coordinates: [
      [120.75, 14.29],
      [120.76, 14.3],
    ],
  });

  assert.deepEqual(lineStorage, {
    type: 'LineString',
    points: [
      { lng: 120.75, lat: 14.29 },
      { lng: 120.76, lat: 14.3 },
    ],
  });

  const polygonStorage = DangerZoneFirestoreGeometryService.toFirestoreGeoJson({
    type: 'Polygon',
    coordinates: [
      [
        [120.75, 14.29],
        [120.76, 14.29],
        [120.76, 14.3],
        [120.75, 14.29],
      ],
    ],
  });

  assert.deepEqual(polygonStorage, {
    type: 'Polygon',
    points: [
      { lng: 120.75, lat: 14.29 },
      { lng: 120.76, lat: 14.29 },
      { lng: 120.76, lat: 14.3 },
      { lng: 120.75, lat: 14.29 },
    ],
  });
});

test('admin danger-zone validation rejects invalid line coordinates and width', () => {
  assert.throws(
    () =>
      DangerZoneGeometryService.validateAdminPayload({
        ...basePayload,
        geometryType: 'line',
        affectedWidthMeters: 101,
        geojson: {
          type: 'LineString',
          coordinates: [
            [120.75, 14.29],
            [190, 14.3],
          ],
        },
      }),
    DangerZonePayloadError
  );
});

test('admin danger-zone validation accepts closed polygon geometry', () => {
  const input = DangerZoneGeometryService.validateAdminPayload({
    ...basePayload,
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
  });

  assert.equal(input.geometryType, 'polygon');
  assert.equal(input.geojson.type, 'Polygon');
  assert.equal(input.geojson.coordinates[0].length, 4);
  assert.equal(input.center, null);
});

test('admin danger-zone validation rejects unclosed polygons', () => {
  assert.throws(
    () =>
      DangerZoneGeometryService.validateAdminPayload({
        ...basePayload,
        geometryType: 'polygon',
        geojson: {
          type: 'Polygon',
          coordinates: [
            [
              [120.75, 14.29],
              [120.76, 14.29],
              [120.76, 14.3],
              [120.75, 14.3],
            ],
          ],
        },
      }),
    DangerZonePayloadError
  );
});
