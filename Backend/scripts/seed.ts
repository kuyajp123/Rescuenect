/**
 * Rescuenect Data Seeder
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/seed.ts --client=<clientId> --module=<module>
 *
 * Modules:
 *   evacuations   — Seed random evacuation centers
 *   danger-zones  — Seed random danger zone records
 *   announcements — Seed random announcements
 *   contacts      — Seed random contact categories and items
 *   carousel      — Seed random carousel slides with images
 *   all           — Run all seeders
 *
 * Examples:
 *   npx ts-node -r tsconfig-paths/register scripts/seed.ts --client=naic --module=evacuations
 *   npx ts-node -r tsconfig-paths/register scripts/seed.ts --client=naic --module=all
 */

import '../src/config/loadEnv';

import { parseCliArgs } from './seeders/_utils';
import { seedAnnouncements } from './seeders/seedAnnouncements';
import { seedCarousel } from './seeders/seedCarousel';
import { seedContacts } from './seeders/seedContacts';
import { seedDangerZones } from './seeders/seedDangerZones';
import { seedEvacuations } from './seeders/seedEvacuations';

const VALID_MODULES = ['evacuations', 'danger-zones', 'announcements', 'contacts', 'carousel', 'all'] as const;
type SeederModule = (typeof VALID_MODULES)[number];

const isValidModule = (value: string): value is SeederModule => (VALID_MODULES as readonly string[]).includes(value);

const main = async () => {
  const { clientId, module: rawModule, count } = parseCliArgs();

  if (!clientId) {
    console.error('❌ Missing --client argument. Usage: --client=<clientId>');
    process.exit(1);
  }

  if (!rawModule) {
    console.error(`❌ Missing --module argument. Valid modules: ${VALID_MODULES.join(', ')}`);
    process.exit(1);
  }

  if (!isValidModule(rawModule)) {
    console.error(`❌ Unknown module "${rawModule}". Valid modules: ${VALID_MODULES.join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🌱 Rescuenect Seeder`);
  console.log(`   Client  : ${clientId}`);
  console.log(`   Module  : ${rawModule}`);
  console.log(`   Count   : ${count}\n`);

  const runners: Record<Exclude<SeederModule, 'all'>, () => Promise<void>> = {
    evacuations: () => seedEvacuations(clientId, count),
    'danger-zones': () => seedDangerZones(clientId, count),
    announcements: () => seedAnnouncements(clientId, count),
    contacts: () => seedContacts(clientId),
    carousel: () => seedCarousel(clientId, count),
  };

  if (rawModule === 'all') {
    for (const [name, run] of Object.entries(runners)) {
      console.log(`\n▶ Running seeder: ${name}`);
      await run();
    }
  } else {
    await runners[rawModule]();
  }

  console.log('\n✅ Seeding complete.');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Seeder failed:', error);
  process.exit(1);
});
