/**
 * Evacuation Centers Seeder
 *
 * Inserts random evacuation center documents into the `centers` Firestore collection
 * and uploads a placeholder PNG image to the `evacuation-centers` Supabase bucket.
 *
 * Schema matches EvacuationController / EvacuationModel:
 *   - location   : string  (human-readable address)
 *   - coordinates: { lat, lng }
 *   - type       : 'school' | 'barangay hall' | 'gymnasium' | 'church' |
 *                  'government building' | 'private facility' | 'vacant building' |
 *                  'covered court' | 'other'
 *   - status     : 'available' | 'full' | 'closed'
 *   - contact    : string
 *   - description: string
 */

import { ensureBucketExists } from '../../src/components/UploadImageBucket';
import { db } from '../../src/db/firestoreConfig';
import { supabase } from '../../src/lib/supabase';
import { FieldValue } from 'firebase-admin/firestore';
import {
  pick,
  randomInt,
  randomFloat,
  randomBool,
  fetchPlaceholderImageBuffer,
  verifyClientExists,
  getClientGeoBounds,
} from './_utils';

const BUCKET_NAME = 'evacuation-centers';

// ─── Schema-aligned data pools ──────────────────────────────────────────────────

const ALLOWED_TYPES = [
  'school',
  'barangay hall',
  'gymnasium',
  'church',
  'government building',
  'private facility',
  'vacant building',
  'covered court',
  'other',
] as const;

const ALLOWED_STATUSES = ['available', 'full', 'closed'] as const;
const CAPACITIES = [50, 100, 150, 200, 250, 300, 500, 750, 1000];

// Generic names that work for any municipality, keyed by type
const TYPE_NAMES: Record<(typeof ALLOWED_TYPES)[number], string[]> = {
  'school': [
    'Central Elementary School',
    'National High School',
    'Elementary School',
    'Primary School',
  ],
  'barangay hall': [
    'Barangay Hall',
    'Barangay Multi-Purpose Hall',
    'Barangay Community Hall',
  ],
  'gymnasium': [
    'Municipal Gymnasium',
    'Sports Complex Gymnasium',
    'Covered Gymnasium',
    'Indoor Sports Hall',
  ],
  'church': [
    'Parish Hall',
    'Chapel Community Center',
    'Church Parish Center',
  ],
  'government building': [
    'Municipal Hall',
    'Rural Health Unit',
    'Government Office Building',
    'Social Welfare Office',
  ],
  'private facility': [
    'Community Learning Center',
    'Private Multi-Purpose Hall',
  ],
  'vacant building': [
    'Former Market Building',
    'Old Municipal Warehouse',
    'Vacant Commercial Building',
  ],
  'covered court': [
    'Covered Basketball Court',
    'Multi-Purpose Covered Court',
    'Covered Recreational Court',
  ],
  'other': [
    'Town Plaza Tent Area',
    'Open Field Evacuation Area',
    'Emergency Shelter Zone',
  ],
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function uploadPlaceholderImage(docId: string, label: string): Promise<string | null> {
  try {
    const { buffer, mimetype } = await fetchPlaceholderImageBuffer(label, 800, 450);
    const filePath = `${BUCKET_NAME}/${docId}/image-1.png`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, { contentType: mimetype, upsert: true });

    if (error) {
      console.warn(`   ⚠️  Image upload failed for ${docId}: ${error.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return urlData?.publicUrl ?? null;
  } catch (err) {
    console.warn(`   ⚠️  Image upload error:`, err);
    return null;
  }
}

// ─── Seeder ────────────────────────────────────────────────────────────────────

export async function seedEvacuations(clientId: string, count = 5): Promise<void> {
  await verifyClientExists(clientId);
  await ensureBucketExists(BUCKET_NAME);

  // Dynamically load geo bounds and metadata from Firestore
  const geo = await getClientGeoBounds(clientId);

  // Fallback barangay list if client has none configured
  const barangayPool = geo.barangays.length > 0
    ? geo.barangays
    : ['Poblacion', 'Zone 1', 'Zone 2', 'Zone 3', 'Zone 4'];

  console.log(`   Seeding ${count} evacuation center(s) for client "${clientId}" (${geo.municipalityName}, ${geo.provinceName})...`);

  const STATUS_POOL = [...ALLOWED_STATUSES];
  const TYPE_POOL = [...ALLOWED_TYPES];

  for (let i = 0; i < count; i++) {
    const type = pick(TYPE_POOL);
    const namePool = TYPE_NAMES[type];
    const barangay = pick(barangayPool);
    const name = `Brgy. ${barangay} ${pick(namePool)}`;
    const status = pick(STATUS_POOL);

    const lat = randomFloat(geo.latMin, geo.latMax);
    const lng = randomFloat(geo.lngMin, geo.lngMax);

    const capacity = pick(CAPACITIES);
    const currentOccupancy = status === 'full'
      ? capacity
      : status === 'closed'
      ? 0
      : randomInt(0, Math.floor(capacity * 0.8));

    const docRef = await db.collection('centers').add({
      clientId,
      name,
      location: `${barangay}, ${geo.municipalityName}, ${geo.provinceName}`,
      coordinates: { lat, lng },
      type,
      status,
      capacity: String(capacity),
      currentOccupancy,
      isSafe: status !== 'closed',
      lastCapacityUpdatedAt: FieldValue.serverTimestamp(),
      contact: `09${randomInt(100000000, 999999999)}`,
      description: randomBool(0.6)
        ? `Open during declared disaster emergencies. ${randomBool(0.5) ? 'Has dedicated medical staff on standby.' : 'Equipped with basic facilities for evacuees.'}`
        : null,
      images: [],
      createdBy: 'seeder-system',
      createdAt: FieldValue.serverTimestamp(),
    });

    const imgUrl = await uploadPlaceholderImage(docRef.id, name);
    if (imgUrl) {
      await docRef.update({ images: [imgUrl] });
    }

    console.log(`   ✅ [${i + 1}/${count}] "${name}" (${type}) [${status}] — ${docRef.id}`);
  }

  console.log(`   🏠 Evacuation centers seeded successfully.`);
}
