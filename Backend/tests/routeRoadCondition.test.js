const test = require('node:test');
const assert = require('node:assert/strict');

const {
  RouteRoadConditionService,
} = require('../dist/src/services/RouteRoadConditionService');
const {
  MapboxTrafficTilequeryService,
} = require('../dist/src/services/MapboxTrafficTilequeryService');

const geometry = {
  type: 'LineString',
  coordinates: [
    [120.75, 14.29],
    [120.76, 14.3],
    [120.77, 14.31],
    [120.78, 14.32],
  ],
};

test('Mapbox road-condition parser prioritizes closures over incidents and congestion', () => {
  const { summary, segments } = RouteRoadConditionService.buildFromMapboxDirections({
    geometry,
    durationTypicalSeconds: 600,
    legs: [
      {
        incidents: [
          {
            type: 'road_hazard',
            description: 'Hazard on road',
            impact: 'major',
            geometry_index_start: 1,
            geometry_index_end: 1,
          },
        ],
        closures: [
          {
            geometry_index_start: 2,
            geometry_index_end: 2,
          },
        ],
        annotation: {
          congestion: ['low', 'severe', 'heavy'],
          congestion_numeric: [10, 90, 80],
          speed: [8, 2, 3],
          duration: [60, 180, 160],
        },
      },
    ],
  });

  assert.equal(segments[0].condition, 'low');
  assert.equal(segments[1].condition, 'incident');
  assert.equal(segments[1].incidentType, 'road_hazard');
  assert.equal(segments[2].condition, 'closed');
  assert.equal(summary.worstCondition, 'closed');
  assert.equal(summary.closureCount, 1);
  assert.equal(summary.incidentCount, 1);
  assert.equal(summary.hasLiveTraffic, true);
});

test('sampled traffic route conditions build tilequery segments', () => {
  const { summary, segments } = RouteRoadConditionService.buildFromSampledTraffic([
    { lat: 14.29, lng: 120.75, congestion: 'moderate' },
    { lat: 14.3, lng: 120.76, congestion: 'severe' },
    { lat: 14.31, lng: 120.77, congestion: 'low', closed: 'yes' },
  ]);

  assert.equal(segments.length, 2);
  assert.equal(segments[0].condition, 'moderate');
  assert.equal(segments[1].condition, 'severe');
  assert.equal(summary.source, 'mapbox_traffic_tilequery');
  assert.equal(summary.worstCondition, 'severe');
});

test('Tilequery route sampling is capped and keeps route endpoints', () => {
  const longGeometry = {
    type: 'LineString',
    coordinates: Array.from({ length: 80 }, (_, index) => [120 + index / 1000, 14 + index / 1000]),
  };

  const samples = MapboxTrafficTilequeryService.buildSampleCoordinates(longGeometry, 30);

  assert.equal(samples.length, 30);
  assert.deepEqual(samples[0], { lng: 120, lat: 14 });
  assert.deepEqual(samples[samples.length - 1], { lng: 120.079, lat: 14.079 });
});
