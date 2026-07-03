import { db } from '../../src/db/firestoreConfig';
import { deleteStorageFolder, verifyClientExists } from './_utils';

export async function unseedEvacuations(clientId: string, target: 'seeded' | 'all'): Promise<void> {
  await verifyClientExists(clientId);

  console.log(`   🧹 Unseeding Evacuations for client "${clientId}" (Target: ${target})...`);

  let query = db.collection('centers').where('clientId', '==', clientId);
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
    // Delete the storage folder containing images for this evacuation center
    await deleteStorageFolder('evacuation-centers', doc.id);
    
    // Delete the Firestore document
    await doc.ref.delete();
    deleted++;
  }

  console.log(`      ✅ Deleted ${deleted} evacuation record(s) and their images.`);
}
