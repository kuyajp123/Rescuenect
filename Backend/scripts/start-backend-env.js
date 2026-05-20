const { spawn } = require('child_process');

const environment = process.argv[2] || 'staging';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const isEnvFile = environment.startsWith('.env') || environment.includes('/') || environment.includes('\\');

const child = spawn(npmCommand, ['run', 'dev-backend'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ...(isEnvFile ? { BACKEND_ENV_FILE: environment } : { BACKEND_ENV: environment }),
  },
});

child.on('error', error => {
  console.error(`Failed to start backend with ${environment}:`, error);
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
