import '@/config/loadEnv';
import { publishManualMobileAppRelease } from '@/services/mobileAppManualRelease';
import path from 'path';

type ScriptOptions = {
  apkPath: string;
  buildProfile: string;
  appIdentifier: string | null;
  appVersion: string | null;
  buildNumber: string | null;
  releaseTag: string | null;
  releaseName: string | null;
};

const optionDefinitions: Record<string, keyof ScriptOptions> = {
  '--apk': 'apkPath',
  '--profile': 'buildProfile',
  '--app-id': 'appIdentifier',
  '--version': 'appVersion',
  '--build-number': 'buildNumber',
  '--release-tag': 'releaseTag',
  '--release-name': 'releaseName',
};

const requireOption = (options: Partial<ScriptOptions>, key: keyof ScriptOptions): string => {
  const value = options[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required option for ${key}`);
  }
  return value.trim();
};

const parseArgs = (): ScriptOptions => {
  const options: Partial<ScriptOptions> = {
    appVersion: null,
    buildNumber: null,
    buildProfile: process.env.MOBILE_APK_ALLOWED_BUILD_PROFILE ?? 'staging',
    appIdentifier: process.env.MOBILE_APK_ALLOWED_APP_IDENTIFIER ?? null,
    releaseTag: process.env.MOBILE_APK_GITHUB_RELEASE_TAG ?? null,
    releaseName: process.env.MOBILE_APK_GITHUB_RELEASE_NAME ?? null,
  };
  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    const key = optionDefinitions[flag];

    if (!key || value === undefined) {
      throw new Error(`Unknown or incomplete option: ${flag}`);
    }

    (options as Record<string, string | null>)[key] = value;
  }

  return {
    apkPath: path.resolve(requireOption(options, 'apkPath')),
    buildProfile: requireOption(options, 'buildProfile'),
    appIdentifier: options.appIdentifier ?? null,
    appVersion: options.appVersion ?? null,
    buildNumber: options.buildNumber ?? null,
    releaseTag: options.releaseTag ?? null,
    releaseName: options.releaseName ?? null,
  };
};

const main = async () => {
  const options = parseArgs();
  const result = await publishManualMobileAppRelease({
    apkPath: options.apkPath,
    buildProfile: options.buildProfile,
    appIdentifier: options.appIdentifier,
    appVersion: options.appVersion,
    buildNumber: options.buildNumber,
    releaseTag: options.releaseTag,
    releaseName: options.releaseName,
    releaseSource: 'manual-script',
  });

  console.log(JSON.stringify({ release: result.release }, null, 2));
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
