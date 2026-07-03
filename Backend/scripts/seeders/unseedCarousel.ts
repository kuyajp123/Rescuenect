import { db } from '../../src/db/firestoreConfig';
import { deleteStorageFile, verifyClientExists } from './_utils';

export async function unseedCarousel(clientId: string, target: 'seeded' | 'all'): Promise<void> {
  await verifyClientExists(clientId);

  console.log(`   🧹 Unseeding Carousel Slides for client "${clientId}" (Target: ${target})...`);

  let query = db.collection('carouselSlides').where('clientId', '==', clientId);
  if (target === 'seeded') {
    query = query.where('createdBy', '==', 'seeder-system');
  }

  const snap = await query.get();
  if (snap.empty) {
    console.log(`      No records found to delete.`);
    return;
  }

  let deleted = 0;
  for (const doc of snap.docs) {
    // Seeded carousel images are stored as `<clientId>/<docId>.png`
    await deleteStorageFile('carousel-slides', `${clientId}/${doc.id}.png`);
    await deleteStorageFile('carousel-slides', `${clientId}/${doc.id}.svg`); // fallback for old ones
    
    await doc.ref.delete();
    deleted++;
  }

  console.log(`      ✅ Deleted ${deleted} carousel slide(s) and their images.`);
}
