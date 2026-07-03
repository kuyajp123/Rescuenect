/**
 * Carousel Slides Seeder
 *
 * Inserts random carousel slide documents into the `carouselSlides` Firestore collection
 * and uploads a placeholder SVG image to the `carousel-slides` Supabase bucket.
 */

import { ensureBucketExists } from '../../src/components/UploadImageBucket';
import { db } from '../../src/db/firestoreConfig';
import { supabase } from '../../src/lib/supabase';
import { FieldValue } from 'firebase-admin/firestore';
import { fetchPlaceholderImageBuffer, pick, verifyClientExists } from './_utils';

const BUCKET_NAME = 'carousel-slides';
const COLLECTION = 'carouselSlides';

// ─── Random data pools ─────────────────────────────────────────────────────────

const SLIDE_DATA: Array<{ title: string; subtitle: string; description: string; bgColor: string }> = [
  {
    title: 'Stay Safe, Stay Informed',
    subtitle: 'Your Safety Is Our Priority',
    description:
      'Rescuenect keeps you updated with real-time alerts and emergency information for your community.',
    bgColor: '#1e3a5f',
  },
  {
    title: 'Know Your Evacuation Routes',
    subtitle: 'Be Prepared. Be Ready.',
    description:
      'Familiarize yourself with the nearest evacuation centers and pre-designated safe zones in your barangay.',
    bgColor: '#2d6a4f',
  },
  {
    title: 'Report Danger Zones',
    subtitle: 'Help Your Community',
    description:
      'Spot a hazard? Report it through Rescuenect so authorities can respond quickly and keep everyone safe.',
    bgColor: '#c44b4b',
  },
  {
    title: 'Emergency Contacts at Your Fingertips',
    subtitle: 'Help Is Just One Tap Away',
    description:
      'Access critical hotlines for fire, police, medical, and disaster response services anytime, anywhere.',
    bgColor: '#560bad',
  },
  {
    title: 'Typhoon Season Preparedness',
    subtitle: 'Prepare Your Go-Bag Now',
    description:
      'Have enough water, food, medicines, and important documents ready. Monitor official alerts regularly.',
    bgColor: '#0077b6',
  },
  {
    title: 'Community Resilience Program',
    subtitle: 'Together We Are Stronger',
    description:
      'Join the LGU-led disaster preparedness trainings and drills to build a more resilient community.',
    bgColor: '#774936',
  },
  {
    title: 'Real-Time Weather Updates',
    subtitle: 'Know Before The Storm',
    description:
      'Get live weather conditions and forecasts specific to your municipality to plan ahead effectively.',
    bgColor: '#023e8a',
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function uploadSlideImage(
  clientId: string,
  docId: string,
  title: string,
  bgColor: string
): Promise<string | null> {
  try {
    const { buffer, mimetype } = await fetchPlaceholderImageBuffer(title, 1200, 500, bgColor);
    const filePath = `${clientId}/${docId}.png`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, { contentType: mimetype, upsert: true });

    if (error) {
      console.warn(`   ⚠️  Slide image upload failed: ${error.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return urlData?.publicUrl ?? null;
  } catch (err) {
    console.warn(`   ⚠️  Slide image upload error:`, err);
    return null;
  }
}

// ─── Seeder ────────────────────────────────────────────────────────────────────

export async function seedCarousel(clientId: string, count = 5): Promise<void> {
  await verifyClientExists(clientId);
  await ensureBucketExists(BUCKET_NAME);

  const MAX_SLIDES = 4;

  // Check how many slides already exist for this client
  const existingSnap = await db.collection(COLLECTION).where('clientId', '==', clientId).get();
  const existingCount = existingSnap.size;

  if (existingCount >= MAX_SLIDES) {
    console.log(`   ⚠️  Client "${clientId}" already has ${existingCount} carousel slides (max is ${MAX_SLIDES}). Skipping carousel seeding.`);
    return;
  }

  const remainingCapacity = MAX_SLIDES - existingCount;

  // Cap at available slide definitions and remaining capacity
  const actualCount = Math.min(count, SLIDE_DATA.length, remainingCapacity);
  
  if (actualCount < count) {
    console.warn(`   ⚠️  Limiting to ${actualCount} slides (Requested: ${count}, Existing: ${existingCount}, Max: ${MAX_SLIDES}).`);
  }

  console.log(`   Seeding ${actualCount} carousel slide(s) for client "${clientId}"...`);

  // Shuffle the slide data so we get different slides each run
  const slidePool = [...SLIDE_DATA].sort(() => Math.random() - 0.5).slice(0, actualCount);

  for (let i = 0; i < slidePool.length; i++) {
    const slide = slidePool[i];
    const now = FieldValue.serverTimestamp();

    // Create Firestore doc first to get the ID for the storage path
    const docRef = db.collection(COLLECTION).doc();

    const imageUrl = await uploadSlideImage(clientId, docRef.id, slide.title, slide.bgColor);

    await docRef.set({
      clientId,
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description,
      imageUrl: imageUrl ?? '',
      order: existingCount + i + 1,
      createdAt: now,
      updatedAt: now,
      createdBy: 'seeder-system',
    });

    console.log(`   ✅ [${i + 1}/${slidePool.length}] "${slide.title}" — ${docRef.id}`);
  }

  console.log(`   🎠 Carousel slides seeded successfully.`);
}
