/**
 * Announcements Seeder
 *
 * Inserts random announcement documents into the `announcements` Firestore collection
 * and uploads a placeholder thumbnail to the `announcement-thumbnails` Supabase bucket.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { ensureBucketExists } from '../../src/components/UploadImageBucket';
import { db } from '../../src/db/firestoreConfig';
import { supabase } from '../../src/lib/supabase';
import { fetchPlaceholderImageBuffer, pick, randomBool, verifyClientExists } from './_utils';

// The bucket name used by AnnouncementThumbnailUploadService
const BUCKET_NAME = 'announcement-thumbnails';

// ─── Random data pools ─────────────────────────────────────────────────────────

const TITLES = [
  'Mandatory Evacuation Order for Coastal Barangays',
  'Relief Operations Schedule — Week {n}',
  'Water Interruption Advisory',
  'Road Closure Notice: Main Avenue',
  'Typhoon Preparedness Reminders',
  'Free Medical Mission — {n} August',
  'Distribution of Food Packs to Flood Victims',
  'Suspension of Classes Due to Heavy Rains',
  'Community Meeting: Disaster Risk Reduction',
  'Updating of Resident Information Records',
  'Solid Waste Collection Schedule for July',
  'LGU Advisory: Danger Zone Restrictions',
  'Early Warning System Test Drill',
  'Search and Rescue Team Briefing',
  'Health and Safety Guidelines During Rainy Season',
];

const CATEGORIES = ['Emergency', 'Advisory', 'Health', 'Relief Operations', 'Weather', 'Infrastructure', 'Community'];

const BODY_TEMPLATES = [
  'Residents in low-lying areas are advised to prepare emergency go-bags and be ready to evacuate upon further notice from the local authorities.',
  'The municipal government hereby informs all residents of the scheduled activities. Please coordinate with your barangay captain for further details.',
  'Due to the approaching weather disturbance, all residents are strongly encouraged to follow the prescribed safety protocols and avoid flood-prone areas.',
  'The LGU is coordinating with national government agencies to ensure that relief goods are distributed equitably to all affected families.',
  'For updates, please monitor official LGU social media pages and the Rescuenect application. Stay safe and stay informed.',
  'All barangay officials are directed to assist in the distribution and to ensure orderly conduct during the relief operations.',
  'Residents with medical emergencies should contact the Rural Health Unit immediately. Mobile medical teams are also being deployed.',
];

const BG_COLORS = ['#1e3a5f', '#c44b4b', '#2d6a4f', '#7b2d00', '#4a1942', '#0077b6', '#560bad'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function uploadThumbnail(docId: string, userId: string, title: string, color: string): Promise<string | null> {
  try {
    await ensureBucketExists(BUCKET_NAME);

    const { buffer, mimetype } = await fetchPlaceholderImageBuffer(title.slice(0, 30), 1200, 630, color);
    const filePath = `${userId}/${docId}/thumbnail.png`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, { contentType: mimetype, upsert: true });

    if (error) {
      console.warn(`   ⚠️  Thumbnail upload failed: ${error.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return urlData?.publicUrl ?? null;
  } catch (err) {
    console.warn(`   ⚠️  Thumbnail upload error:`, err);
    return null;
  }
}

// ─── Seeder ────────────────────────────────────────────────────────────────────

export async function seedAnnouncements(clientId: string, count = 5): Promise<void> {
  await verifyClientExists(clientId);

  console.log(`   Seeding ${count} announcement(s) for client "${clientId}"...`);

  const seederId = 'seeder-system';

  for (let i = 0; i < count; i++) {
    const rawTitle = pick(TITLES).replace('{n}', String(i + 1));
    const category = pick(CATEGORIES);
    const bodyLines = [pick(BODY_TEMPLATES), pick(BODY_TEMPLATES)];
    const body = bodyLines.join('\n\n');
    const bgColor = pick(BG_COLORS);

    // Create the document first to get the ID for the thumbnail path.
    const docRef = await db.collection('announcements').add({
      clientId,
      title: rawTitle,
      category,
      body,
      content: body,
      thumbnail: null,
      isPublished: randomBool(0.75),
      isPinned: randomBool(0.2),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: seederId,
    });

    // Upload thumbnail
    const thumbnailUrl = await uploadThumbnail(docRef.id, seederId, rawTitle, bgColor);
    if (thumbnailUrl) {
      await docRef.update({ thumbnail: thumbnailUrl });
    }

    console.log(`   ✅ [${i + 1}/${count}] "${rawTitle}" — ${docRef.id}`);
  }

  console.log(`   📢 Announcements seeded successfully.`);
}
