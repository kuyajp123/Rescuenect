const { spawn } = require('child_process');

const environment = process.argv[2] || 'staging';
const isEnvFile = environment.startsWith('.env') || environment.includes('/') || environment.includes('\\');
const command = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : 'npm';
const args = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run dev-backend'] : ['run', 'dev-backend'];

const child = spawn(command, args, {
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
