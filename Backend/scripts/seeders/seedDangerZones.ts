/**
 * Danger Zones Seeder
 *
 * Inserts random danger zone records into the `dangerZones` Firestore collection.
 * Geo bounds, barangays, and municipality metadata are loaded dynamically from
 * Firestore for each client, so the seeder works for any LGU.
 */

import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../../src/db/firestoreConfig';
import {
  pick,
  randomBool,
  randomFloat,
  randomInt,
  sample,
  verifyClientExists,
  getClientGeoBounds,
  type ClientGeoBounds,
} from './_utils';

// ─── Random data pools ─────────────────────────────────────────────────────────

const ZONE_TYPES = [
  'Flood',
  'Landslide',
  'Storm Surge',
  'Earthquake Fault',
  'Fire Hazard',
  'Unstable Ground',
  'Chemical Spill',
  'Road Collapse',
  'Coastal Erosion',
  'Gas Leak',
];

const SEVERITIES    = ['low', 'medium', 'high', 'critical'] as const;
const STATUSES      = ['pending', 'verified', 'resolved']   as const;
const GEOMETRY_TYPES = ['point', 'circle', 'polygon', 'line']       as const;
const CONFIDENCES   = ['low', 'medium', 'high']             as const;

const VERIFICATION_NOTES = [
  'Validated by on-site inspection team.',
  'Confirmed via satellite imagery analysis.',
  'Reported by multiple residents in the area.',
  'Official survey conducted by municipal engineers.',
  'Ground-truthed by barangay officials.',
];

// ─── Geometry builders ─────────────────────────────────────────────────────────

function buildPointOrCircleData(geoType: 'point' | 'circle', geo: ClientGeoBounds) {
  const lat = randomFloat(geo.latMin, geo.latMax);
  const lng = randomFloat(geo.lngMin, geo.lngMax);

  if (geoType === 'circle') {
    const radius = randomInt(50, 500);
    return {
      geometryType: 'circle',
      center: { lat, lng },
      radiusMeters: radius,
      geojson: null,
      affectedWidthMeters: null,
      bbox: [lng - 0.005, lat - 0.005, lng + 0.005, lat + 0.005] as [number, number, number, number],
      centroid: { lat, lng },
    };
  }

  return {
    geometryType: 'point',
    center: { lat, lng },
    radiusMeters: null,
    geojson: null,
    affectedWidthMeters: null,
    bbox: [lng - 0.001, lat - 0.001, lng + 0.001, lat + 0.001] as [number, number, number, number],
    centroid: { lat, lng },
  };
}

function buildPolygonData(geo: ClientGeoBounds) {
  const lat = randomFloat(geo.latMin, geo.latMax);
  const lng = randomFloat(geo.lngMin, geo.lngMax);
  const d = 0.003;

  const coordinates: [number, number][] = [
    [lng - d, lat - d],
    [lng + d, lat - d],
    [lng + d, lat + d],
    [lng - d, lat + d],
    [lng - d, lat - d],
  ];

  return {
    geometryType: 'polygon',
    center: { lat, lng },
    radiusMeters: null,
    geojson: {
      type: 'Polygon' as const,
      points: coordinates.map(([lng, lat]) => ({ lng, lat })),
    },
    affectedWidthMeters: null,
    bbox: [lng - d, lat - d, lng + d, lat + d] as [number, number, number, number],
    centroid: { lat, lng },
  };
}

function buildLineData(geo: ClientGeoBounds) {
  const startLat = randomFloat(geo.latMin, geo.latMax);
  const startLng = randomFloat(geo.lngMin, geo.lngMax);
  const d = 0.005;

  const coordinates: [number, number][] = [
    [startLng, startLat],
    [startLng + d, startLat + d / 2],
    [startLng + d * 2, startLat - d / 2],
    [startLng + d * 3, startLat],
  ];

  const lats = coordinates.map(c => c[1]);
  const lngs = coordinates.map(c => c[0]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    geometryType: 'line',
    center: { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 },
    radiusMeters: null,
    geojson: {
      type: 'LineString' as const,
      points: coordinates.map(([lng, lat]) => ({ lng, lat })),
    },
    affectedWidthMeters: randomInt(10, 50),
    bbox: [minLng, minLat, maxLng, maxLat] as [number, number, number, number],
    centroid: { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 },
  };
}

function buildGeometry(geoType: (typeof GEOMETRY_TYPES)[number], geo: ClientGeoBounds) {
  if (geoType === 'polygon') return buildPolygonData(geo);
  if (geoType === 'line') return buildLineData(geo);
  return buildPointOrCircleData(geoType as 'point' | 'circle', geo);
}

// ─── Seeder ────────────────────────────────────────────────────────────────────

export async function seedDangerZones(clientId: string, count = 5): Promise<void> {
  await verifyClientExists(clientId);

  // Dynamically load geo bounds and metadata from Firestore
  const geo = await getClientGeoBounds(clientId);

  // Fallback barangay list if client has none configured
  const barangayPool = geo.barangays.length > 0
    ? geo.barangays
    : ['Poblacion', 'Zone 1', 'Zone 2', 'Zone 3', 'Zone 4'];

  console.log(`   Seeding ${count} danger zone(s) for client "${clientId}" (${geo.municipalityName}, ${geo.provinceName})...`);

  const COLLECTION = 'dangerZones';
  const SEVERITY_POOL   = [...SEVERITIES];
  const STATUS_POOL     = [...STATUSES];
  const GEO_POOL        = [...GEOMETRY_TYPES];
  const CONFIDENCE_POOL = [...CONFIDENCES];

  for (let i = 0; i < count; i++) {
    const zoneType  = pick(ZONE_TYPES);
    const severity  = pick(SEVERITY_POOL);
    const status    = pick(STATUS_POOL);
    const geoType   = pick(GEO_POOL);
    const barangay  = pick(barangayPool);
    const affected  = sample(barangayPool, randomInt(1, Math.min(4, barangayPool.length)));
    const geometry  = buildGeometry(geoType, geo);
    const confidence = pick(CONFIDENCE_POOL);
    const isActive  = status === 'verified';

    const source = status === 'pending' || randomBool(0.5) ? 'resident_report' : 'lgu_official';
    const reportedByRole = source === 'resident_report' ? 'resident' : 'super_admin';
    const reporterName   = source === 'resident_report' ? 'Juan Dela Cruz (Seed)' : 'System Seeder';
    const reporterEmail  = source === 'resident_report' ? 'juan@example.com' : 'seeder@rescuenect.com';

    const futureDate = new Date(Date.now() + randomInt(1, 90) * 24 * 60 * 60 * 1000);

    const docRef = await db.collection(COLLECTION).add({
      clientId,
      source,
      status,
      isActive,
      type: zoneType,
      severity,
      description: `${zoneType} hazard zone in Brgy. ${barangay}. ${randomBool(0.5) ? 'Residents are advised to evacuate immediately.' : 'Please exercise caution in this area.'}`,
      ...geometry,
      confidence,
      verificationNotes: randomBool(0.6) ? pick(VERIFICATION_NOTES) : null,
      affectedBarangays: affected,
      photoUrls: [],
      reportedBy: 'seeder-system',
      reportedByRole,
      reporterName,
      reporterEmail,
      barangay: barangay.toLowerCase(),
      barangayCode: null,
      barangayLabel: barangay,
      municipalityName: geo.municipalityName,
      provinceName: geo.provinceName,
      expiresAt: randomBool(0.4) ? Timestamp.fromDate(futureDate) : null,
      verifiedBy: status === 'verified' ? 'seeder-system' : null,
      verifiedAt: status === 'verified' ? Timestamp.now() : null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      resolvedBy: status === 'resolved' ? 'seeder-system' : null,
      resolvedAt: status === 'resolved' ? Timestamp.now() : null,
      auditTrail: [
        {
          action: 'created',
          actorId: 'seeder-system',
          actorRole: 'super_admin',
          at: Timestamp.now(),
          note: 'Created by Rescuenect seeder script',
        },
      ],
      notificationAudit: {},
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`   ✅ [${i + 1}/${count}] "${zoneType}" (${severity}) [${geoType}] — ${docRef.id}`);
  }

  console.log(`   ⚠️  Danger zones seeded successfully.`);
}
