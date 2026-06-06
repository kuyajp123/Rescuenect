import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const loadEnvFile = (envFile: string, override = false) => {
  dotenv.config({
    path: path.resolve(process.cwd(), envFile),
    override,
  });
};

const envFileFor = (environment?: string) => {
  switch (environment) {
    case 'local':
      return fs.existsSync(path.resolve(process.cwd(), '.env.local')) ? '.env.local' : '.env.staging';
    case 'staging':
      return '.env.staging';
    case 'production':
      return fs.existsSync(path.resolve(process.cwd(), '.env.production')) ? '.env.production' : '.env';
    default:
      return undefined;
  }
};

const selectedEnvironment = process.env.APP_ENV;
const selectedEnvFile =
  process.env.BACKEND_ENV_FILE || process.env.DOTENV_CONFIG_PATH || envFileFor(selectedEnvironment);

loadEnvFile('.env');

if (selectedEnvFile && selectedEnvFile !== '.env') {
  loadEnvFile(selectedEnvFile, true);
}
