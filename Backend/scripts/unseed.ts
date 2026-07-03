import admin from 'firebase-admin';
import readline from 'readline';
import '../src/config/loadEnv'; // Ensure env is loaded first
import { parseCliArgs } from './seeders/_utils';

import { unseedAnnouncements } from './seeders/unseedAnnouncements';
import { unseedCarousel } from './seeders/unseedCarousel';
import { unseedContacts } from './seeders/unseedContacts';
import { unseedDangerZones } from './seeders/unseedDangerZones';
import { unseedEvacuations } from './seeders/unseedEvacuations';
import { verifyFirebaseConnection } from '../src/db/firestoreConfig';

async function promptConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(`\n⚠️  ${message} (y/N): `, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

async function run() {
  const { clientId, module: targetModule, target } = parseCliArgs();

  if (!clientId) {
    console.error('❌ Missing --client argument. Usage: --client=<clientId>');
    process.exit(1);
  }

  if (!targetModule) {
    console.error('❌ Missing --module argument. Usage: --module=<module|all>');
    process.exit(1);
  }

  console.log('\n🧹 Rescuenect Unseeder');
  console.log(`   Client  : ${clientId}`);
  console.log(`   Module  : ${targetModule}`);
  console.log(`   Target  : ${target === 'all' ? 'ALL DATA (Destructive!)' : 'Seeded Data Only'}\n`);

  // ── Pre-flight checks ──────────────────────────────────────────────────────
  console.log('🔍 Verifying Firebase connection before unseeding...');
  const isConnected = await verifyFirebaseConnection();
  if (!isConnected) {
    console.error('❌ Firebase connection check failed. Aborting unseed to prevent partial deletions.');
    process.exit(1);
  }

  if (target === 'all') {
    console.log('   ╔══════════════════════════════════════════════════════╗');
    console.log('   ║   🔥 DANGER: DELETING ALL DATA FOR THIS CLIENT!  🔥  ║');
    console.log('   ╚══════════════════════════════════════════════════════╝');

    const env = process.env.APP_ENV || 'production';
    const isConfirmed = await promptConfirmation(
      `You are about to delete ALL data for client "${clientId}" in ${env.toUpperCase()}. Are you absolutely sure?`
    );

    if (!isConfirmed) {
      console.log('\n❌ Unseed operation aborted by user.');
      process.exit(0);
    }
    console.log('');
  }

  const modules =
    targetModule === 'all' ? ['evacuations', 'danger-zones', 'announcements', 'contacts', 'carousel'] : [targetModule];

  try {
    for (const mod of modules) {
      switch (mod) {
        case 'evacuations':
          await unseedEvacuations(clientId, target);
          break;
        case 'danger-zones':
          await unseedDangerZones(clientId, target);
          break;
        case 'announcements':
          await unseedAnnouncements(clientId, target);
          break;
        case 'contacts':
          await unseedContacts(clientId, target);
          break;
        case 'carousel':
          await unseedCarousel(clientId, target);
          break;
        default:
          console.error(`❌ Unknown module: ${mod}`);
      }
    }

    console.log('\n✅ Unseeding complete.\n');
  } catch (error) {
    console.error('\n❌ Unseeder failed:', error);
  } finally {
    await admin.app().delete();
  }
}

run();
