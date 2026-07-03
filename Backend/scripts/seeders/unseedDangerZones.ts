import { db } from '../../src/db/firestoreConfig';
import { verifyClientExists } from './_utils';

export async function unseedDangerZones(clientId: string, target: 'seeded' | 'all'): Promise<void> {
  await verifyClientExists(clientId);

  console.log(`   🧹 Unseeding Danger Zones for client "${clientId}" (Target: ${target})...`);

  let query = db.collection('dangerZones').where('clientId', '==', clientId);
  if (target === 'seeded') {
    query = query.where('reportedBy', '==', 'seeder-system');
  }

  const snap = await query.get();
  if (snap.empty) {
    console.log(`      No records found to delete.`);
    return;
  }

  let deleted = 0;
  // Firestore batches can handle up to 500 ops. We'll just loop for simplicity in a seeder.
  for (const doc of snap.docs) {
    await doc.ref.delete();
    deleted++;
  }

  console.log(`      ✅ Deleted ${deleted} danger zone record(s).`);
}
