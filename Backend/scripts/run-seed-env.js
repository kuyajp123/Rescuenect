/**
 * run-seed-env.js
 *
 * Cross-platform environment-aware seed runner.
 *
 * Usage (via npm scripts):
 *   node scripts/run-seed-env.js <environment> [--client=<clientId>] [--module=<module>] [--count=<n>]
 *
 * Examples:
 *   node scripts/run-seed-env.js staging --client=naic --module=evacuations
 *   node scripts/run-seed-env.js production --client=naic --module=carousel --count=3
 *
 * Via npm:
 *   npm run seed:staging -- --client=naic --module=evacuations
 *   npm run seed:production -- --client=naic --module=all
 */

const { spawn } = require('child_process');
const path = require('path');

const environment = process.argv[2];
const extraArgs = process.argv.slice(3); // e.g. ['--client=naic', '--module=evacuations']

const VALID_ENVIRONMENTS = ['staging', 'production'];

if (!environment || !VALID_ENVIRONMENTS.includes(environment)) {
  console.error(`❌ Invalid environment "${environment}". Must be one of: ${VALID_ENVIRONMENTS.join(', ')}`);
  process.exit(1);
}

// Warn loudly when targeting production
if (environment === 'production') {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════════╗');
  console.log('  ║   ⚠️  WARNING: You are seeding PRODUCTION data!  ⚠️   ║');
  console.log('  ║   This will write real records to the live database. ║');
  console.log('  ╚══════════════════════════════════════════════════════╝');
  console.log('');
}

console.log(`🌍 Environment : ${environment}`);
console.log(`📦 Seed args   : ${extraArgs.join(' ') || '(none — --client and --module required)'}`);
console.log('');

const seedScript = path.join(__dirname, 'seed.ts');

const child = spawn(
  'npx',
  ['ts-node', '-r', 'tsconfig-paths/register', seedScript, ...extraArgs],
  {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      APP_ENV: environment,
    },
  }
);

child.on('error', error => {
  console.error(`❌ Failed to start seeder: ${error.message}`);
  process.exit(1);
});

child.on('exit', code => {
  process.exit(code ?? 0);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
