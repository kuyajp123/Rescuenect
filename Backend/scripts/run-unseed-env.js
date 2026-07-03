const { spawn } = require('child_process');
const path = require('path');

const environment = process.argv[2];
const extraArgs = process.argv.slice(3);

const VALID_ENVIRONMENTS = ['staging', 'production'];

if (!environment || !VALID_ENVIRONMENTS.includes(environment)) {
  console.error(`❌ Invalid environment "${environment}". Must be one of: ${VALID_ENVIRONMENTS.join(', ')}`);
  process.exit(1);
}

const unseedScript = path.join(__dirname, 'unseed.ts');

const child = spawn(
  'npx',
  ['ts-node', '-r', 'tsconfig-paths/register', unseedScript, ...extraArgs],
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
  console.error(`❌ Failed to start unseeder: ${error.message}`);
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
