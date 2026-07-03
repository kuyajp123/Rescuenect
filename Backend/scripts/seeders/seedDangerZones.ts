/**
 * Danger Zones Seeder
 *
 * Inserts random danger zone records into the `dangerZones` Firestore collection
 * using the LGU-official source so no resident UID is required.
 */

import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../../src/db/firestoreConfig';
import { pick, randomBool, randomFloat, randomInt, sample, verifyClientExists } from './_utils';

// ─── Naic, Cavite geo bounds ───────────────────────────────────────────────────

const LAT_MIN = 14.26;
const LAT_MAX = 14.36;
const LNG_MIN = 120.74;
const LNG_MAX = 120.83;

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

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
const STATUSES = ['pending', 'verified', 'resolved'] as const;
const GEOMETRY_TYPES = ['point', 'circle', 'polygon'] as const;
const CONFIDENCES = ['low', 'medium', 'high'] as const;

const BARANGAYS = [
  'Labac',
  'Mabolo',
  'Bancaan',
  'Balsahan',
  'Bagong Karsada',
  'Sapa',
  'Bucana Sasahan',
  'Gomez-Zamora',
  'Kanluran',
  'Humbac',
  'Bucana Malaki',
  'Ibayo Estacion',
  'Ibayo Silangan',
  'Latoria',
  'Munting Mapino',
  'Muzon',
  'Santulan',
  'Calubcob',
  'Makina',
  'San Roque',
  'Sabang',
  'Molino',
  'Halang',
  'Palangue 1',
];

const VERIFICATION_NOTES = [
  'Validated by on-site inspection team.',
  'Confirmed via satellite imagery analysis.',
  'Reported by multiple residents in the area.',
  'Official survey conducted by municipal engineers.',
  'Ground-truthed by barangay officials.',
];

// ─── Geometry builders ─────────────────────────────────────────────────────────

function buildPointOrCircleData(geoType: 'point' | 'circle') {
  const lat = randomFloat(LAT_MIN, LAT_MAX);
  const lng = randomFloat(LNG_MIN, LNG_MAX);

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

function buildPolygonData() {
  const lat = randomFloat(LAT_MIN, LAT_MAX);
  const lng = randomFloat(LNG_MIN, LNG_MAX);
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

function buildGeometry(geoType: (typeof GEOMETRY_TYPES)[number]) {
  if (geoType === 'polygon') return buildPolygonData();
  return buildPointOrCircleData(geoType as 'point' | 'circle');
}

// ─── Seeder ────────────────────────────────────────────────────────────────────

export async function seedDangerZones(clientId: string, count = 5): Promise<void> {
  await verifyClientExists(clientId);

  console.log(`   Seeding ${count} danger zone(s) for client "${clientId}"...`);

  const COLLECTION = 'dangerZones';

  for (let i = 0; i < count; i++) {
    const zoneType = pick(ZONE_TYPES);
    const severity = pick(SEVERITY_POOL);
    const status = pick(STATUS_POOL);
    const geoType = pick(GEO_POOL);
    const barangay = pick(BARANGAYS);
    const affected = sample(BARANGAYS, randomInt(1, 4));
    const geometry = buildGeometry(geoType);
    const confidence = pick(CONFIDENCE_POOL);
    const isActive = status === 'verified';

    const source = status === 'pending' || randomBool(0.5) ? 'resident_report' : 'lgu_official';
    
    const reportedByRole = source === 'resident_report' ? 'resident' : 'super_admin';
    const reporterName = source === 'resident_report' ? 'Juan Dela Cruz (Seed)' : 'System Seeder';
    const reporterEmail = source === 'resident_report' ? 'juan@example.com' : 'seeder@rescuenect.com';

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
      municipalityName: clientId === 'naic' ? 'Naic' : clientId,
      provinceName: 'Cavite',
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

    console.log(`   ✅ [${i + 1}/${count}] "${zoneType}" (${severity}) — ${docRef.id}`);
  }

  console.log(`   ⚠️  Danger zones seeded successfully.`);
}

// ─── Local pool constants (avoids TS strict inference issues with pick()) ───────
const SEVERITY_POOL = [...SEVERITIES];
const STATUS_POOL = [...STATUSES];
const GEO_POOL = [...GEOMETRY_TYPES];
const CONFIDENCE_POOL = [...CONFIDENCES];
