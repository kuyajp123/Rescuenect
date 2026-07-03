/**
 * Evacuation Centers Seeder
 *
 * Inserts random evacuation center documents into the `centers` Firestore collection
 * and uploads a placeholder SVG image to the `evacuation-centers` Supabase bucket.
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
  sample,
  fetchPlaceholderImageBuffer,
  verifyClientExists,
} from './_utils';

const BUCKET_NAME = 'evacuation-centers';

// ─── Random data pools ─────────────────────────────────────────────────────────

const CENTER_NAMES = [
  'Barangay Multi-Purpose Hall',
  'Municipal Covered Court',
  'Elementary School Gymnasium',
  'Municipal Sports Complex',
  'Community Center',
  'Barangay Hall Evacuation Area',
  'High School Covered Court',
  'Church Parish Hall',
  'Municipal Auditorium',
  'Covered Basketball Court',
  'Rural Health Unit Grounds',
  'Town Plaza Evacuation Tent Area',
];

const CAPACITIES = [50, 100, 150, 200, 250, 300, 500, 750, 1000];

const FACILITIES = [
  'Restrooms',
  'Running Water',
  'Generator',
  'First Aid Station',
  'Kitchen Area',
  'Sleeping Quarters',
  'Internet Access',
  'Medical Team',
  'Children\'s Area',
  'PWD Accessible',
];

const STATUS_OPTIONS = ['active', 'inactive', 'full'];

// Naic, Cavite approximate bounding box
const GEO_BOUNDS = {
  latMin: 14.26,
  latMax: 14.36,
  lngMin: 120.74,
  lngMax: 120.83,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function buildCenterName(index: number): string {
  return `${pick(CENTER_NAMES)} ${index + 1}`;
}

async function uploadPlaceholderImage(
  docId: string,
  label: string,
  index: number
): Promise<string | null> {
  try {
    const { buffer, mimetype, originalname } = await fetchPlaceholderImageBuffer(label, 800, 450);
    const filePath = `${BUCKET_NAME}/${docId}/image-${index + 1}.png`;

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

  console.log(`   Seeding ${count} evacuation center(s) for client "${clientId}"...`);

  for (let i = 0; i < count; i++) {
    const name = buildCenterName(i);

    // Create the Firestore document first so we have the doc ID for the image path.
    const docRef = await db.collection('centers').add({
      clientId,
      name,
      address: `Sample Road, Brgy. ${pick(['Labac', 'Mabolo', 'Muzon', 'Halang', 'Sabang', 'Molino'])}, ${clientId}`,
      capacity: pick(CAPACITIES),
      currentOccupancy: randomInt(0, 50),
      status: pick(STATUS_OPTIONS),
      latitude: randomFloat(GEO_BOUNDS.latMin, GEO_BOUNDS.latMax),
      longitude: randomFloat(GEO_BOUNDS.lngMin, GEO_BOUNDS.lngMax),
      facilities: sample(FACILITIES, randomInt(2, 5)),
      contactPerson: `Juan dela Cruz ${i + 1}`,
      contactNumber: `09${randomInt(100000000, 999999999)}`,
      notes: randomBool(0.6) ? 'Open 24/7 during emergencies. Has dedicated medical staff on standby.' : null,
      isPublic: randomBool(0.8),
      images: [],
      createdAt: FieldValue.serverTimestamp(),
    });

    // Upload a placeholder image
    const imgUrl = await uploadPlaceholderImage(docRef.id, name, 0);
    if (imgUrl) {
      await docRef.update({ images: [imgUrl] });
    }

    console.log(`   ✅ [${i + 1}/${count}] "${name}" — ${docRef.id}`);
  }

  console.log(`   🏠 Evacuation centers seeded successfully.`);
}
