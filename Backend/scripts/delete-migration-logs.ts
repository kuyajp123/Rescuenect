/**
 * One-off script: Delete migration/test operation logs from Firestore.
 * Run: npx ts-node -r tsconfig-paths/register scripts/delete-migration-logs.ts
 *
 * This removes all operationLogs with targetType === 'migration' that were
 * created during testing (dynamic client cutover dry-runs, naic backfills, etc.)
 * These are not real system operations and should not appear in the admin dashboard.
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, '../staging-rescuenect-firebase-adminsdk-fbsvc-e5d6112a7c.json');

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('❌ Service account file not found:', SERVICE_ACCOUNT_PATH);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function deleteMigrationLogs() {
  console.log('🔍 Fetching migration logs from operationLogs...');

  const snapshot = await db
    .collection('operationLogs')
    .where('targetType', '==', 'migration')
    .get();

  if (snapshot.empty) {
    console.log('✅ No migration logs found. Nothing to delete.');
    return;
  }

  console.log(`🗑️  Found ${snapshot.docs.length} migration log(s). Deleting...`);

  // Show what will be deleted
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`   - [${new Date(data.timestamp).toLocaleString()}] ${data.actionLabel} (${data.targetId})`);
  });

  // Batch delete
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  console.log(`✅ Successfully deleted ${snapshot.docs.length} migration log(s).`);
}

deleteMigrationLogs()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
