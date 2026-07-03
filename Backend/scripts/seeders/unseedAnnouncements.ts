import { db } from '../../src/db/firestoreConfig';
import { deleteStorageFolder, verifyClientExists } from './_utils';

export async function unseedAnnouncements(clientId: string, target: 'seeded' | 'all'): Promise<void> {
  await verifyClientExists(clientId);

  console.log(`   🧹 Unseeding Announcements for client "${clientId}" (Target: ${target})...`);

  let query = db.collection('announcements').where('clientId', '==', clientId);
  if (target === 'seeded') {
    query = query.where('createdBy', '==', 'seeder-system');
  }

  const snap = await query.get();
  if (snap.empty) {
    console.log(`      No records found to delete.`);
    return;
  }

  const seederUserId = 'seeder-system';
  let deleted = 0;

  for (const doc of snap.docs) {
    // Note: The announcements seeder uploads to path `<userId>/<docId>/thumbnail.png`
    // Wait, if target=all, the userId might be different. Let's try to extract it from the thumbnail URL
    const data = doc.data();
    if (data.thumbnail && typeof data.thumbnail === 'string') {
      try {
        const urlObj = new URL(data.thumbnail);
        // Path pattern: .../object/public/announcement-thumbnails/<userId>/<docId>/thumbnail.png
        const pathParts = urlObj.pathname.split('announcement-thumbnails/');
        if (pathParts.length > 1) {
          const relativePath = pathParts[1].replace('/thumbnail.png', '');
          await deleteStorageFolder('announcement-thumbnails', relativePath);
        }
      } catch (err) {
        // Ignore invalid URLs
      }
    } else if (target === 'seeded') {
      // Fallback for seeded data: we know the structure
      await deleteStorageFolder('announcement-thumbnails', `${seederUserId}/${doc.id}`);
    }

    await doc.ref.delete();
    deleted++;
  }

  console.log(`      ✅ Deleted ${deleted} announcement record(s) and their thumbnails.`);
}
