import { db } from '../../src/db/firestoreConfig';
import { canonicalizeClientId } from '../../src/config/locationConfig';
import { verifyClientExists } from './_utils';

export async function unseedContacts(clientId: string, target: 'seeded' | 'all'): Promise<void> {
  await verifyClientExists(clientId);

  const canonicalId = canonicalizeClientId(clientId) ?? clientId;
  console.log(`   🧹 Unseeding Contacts for client "${canonicalId}" (Target: ${target})...`);

  const docRef = db.collection('contacts').doc(canonicalId);
  const snap = await docRef.get();

  if (!snap.exists) {
    console.log(`      No contacts record found to delete.`);
    return;
  }

  if (target === 'seeded') {
    const data = snap.data();
    if (data?.updatedBy !== 'seeder-system') {
      console.log(`      Contacts record was not created by the seeder (updatedBy: ${data?.updatedBy}). Skipping.`);
      return;
    }
  }

  await docRef.delete();
  console.log(`      ✅ Deleted contacts record for client "${canonicalId}".`);
}
