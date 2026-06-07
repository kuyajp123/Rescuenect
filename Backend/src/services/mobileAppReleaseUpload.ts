import {
  MobileAppReleaseModel,
  type PublicMobileAppRelease,
  type MobileAppReleaseRecord,
} from '@/models/public/MobileAppReleaseModel';
import {
  ensureGithubRelease,
  getGithubRepository,
  getGithubToken,
  uploadGithubReleaseAsset,
} from '@/services/mobileAppReleaseGithub';
import axios from 'axios';
import { createWriteStream } from 'fs';
import { mkdir, rm, stat } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';

const DEFAULT_MAX_APK_BYTES = 250 * 1024 * 1024;

export type EasBuildWebhookPayload = {
  id?: string;
  accountName?: string;
  projectName?: string;
  project?: {
    name?: string;
    slug?: string;
    ownerAccount?: {
      name?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  platform?: string;
  status?: string;
  buildProfile?: string;
  appVersion?: string;
  appBuildVersion?: string;
  appIdentifier?: string;
  gitCommitHash?: string;
  buildDetailsPageUrl?: string;
  completedAt?: string;
  artifacts?: {
    buildUrl?: string;
    applicationArchiveUrl?: string;
    [key: string]: unknown;
  };
  metadata?: {
    appVersion?: string;
    appBuildVersion?: string;
    buildProfile?: string;
    appIdentifier?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type MobileAppReleaseProcessResult = {
  ignored: boolean;
  message: string;
  release?: PublicMobileAppRelease;
};

const stringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const lowerStringOrNull = (value: unknown): string | null => stringOrNull(value)?.toLowerCase() ?? null;

const envOrNull = (name: string): string | null => stringOrNull(process.env[name]);

const parseBooleanEnv = (name: string): boolean | null => {
  const value = envOrNull(name)?.toLowerCase();
  if (!value) return null;
  if (['1', 'true', 'yes', 'on'].includes(value)) return true;
  if (['0', 'false', 'no', 'off'].includes(value)) return false;
  return null;
};

const getAccountName = (payload: EasBuildWebhookPayload): string | null =>
  stringOrNull(payload.accountName) ?? stringOrNull(payload.project?.ownerAccount?.name);

const getProjectName = (payload: EasBuildWebhookPayload): string | null =>
  stringOrNull(payload.projectName) ?? stringOrNull(payload.project?.slug) ?? stringOrNull(payload.project?.name);

const getBuildProfile = (payload: EasBuildWebhookPayload): string | null =>
  stringOrNull(payload.metadata?.buildProfile) ?? stringOrNull(payload.buildProfile);

const getAppVersion = (payload: EasBuildWebhookPayload): string | null =>
  stringOrNull(payload.metadata?.appVersion) ?? stringOrNull(payload.appVersion);

const getAppBuildVersion = (payload: EasBuildWebhookPayload): string | null =>
  stringOrNull(payload.metadata?.appBuildVersion) ?? stringOrNull(payload.appBuildVersion);

const getAppIdentifier = (payload: EasBuildWebhookPayload): string | null =>
  stringOrNull(payload.metadata?.appIdentifier) ?? stringOrNull(payload.appIdentifier);

const getGithubReleaseTag = (payload: EasBuildWebhookPayload): string => {
  const configuredTag = envOrNull('MOBILE_APK_GITHUB_RELEASE_TAG');
  if (configuredTag) return configuredTag;

  const buildProfile = sanitizePathSegment(getBuildProfile(payload) ?? 'android') || 'android';
  return `mobile-app-${buildProfile}`;
};

const getGithubReleaseName = (payload: EasBuildWebhookPayload, releaseTag: string): string =>
  envOrNull('MOBILE_APK_GITHUB_RELEASE_NAME') ??
  `Rescuenect Android APK${getBuildProfile(payload) ? ` (${getBuildProfile(payload)})` : ` - ${releaseTag}`}`;

const getMaxApkBytes = (): number => {
  const configuredLimit = Number(process.env.MOBILE_APK_MAX_BYTES);
  return Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : DEFAULT_MAX_APK_BYTES;
};

const getArtifactUrl = (payload: EasBuildWebhookPayload): string | null =>
  stringOrNull(payload.artifacts?.buildUrl) ?? stringOrNull(payload.artifacts?.applicationArchiveUrl);

const sanitizePathSegment = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const parseHeaderValue = (value: unknown): string | null => {
  if (Array.isArray(value)) return stringOrNull(value[0]);
  return stringOrNull(value);
};

const extractFileNameFromDisposition = (value: unknown): string | null => {
  const header = parseHeaderValue(value);
  if (!header) return null;

  const encodedMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1].replace(/"/g, ''));
    } catch {
      return encodedMatch[1].replace(/"/g, '');
    }
  }

  const match = header.match(/filename="?([^";]+)"?/i);
  return match?.[1] ? match[1].trim() : null;
};

const isProbablyAab = (fileName: string | null, artifactUrl: string): boolean => {
  const fileNameIsAab = Boolean(fileName?.toLowerCase().endsWith('.aab'));

  try {
    return fileNameIsAab || new URL(artifactUrl).pathname.toLowerCase().endsWith('.aab');
  } catch {
    return fileNameIsAab || artifactUrl.toLowerCase().includes('.aab');
  }
};

const isFilterMismatch = (label: string, expected: string | null, actual: string | null): string | null => {
  if (!expected) return null;
  return expected === actual ? null : `${label} does not match the configured filter.`;
};

const downloadArtifactToTempFile = async (
  artifactUrl: string,
  tempFilePath: string,
  maxBytes: number
): Promise<{ contentDispositionFileName: string | null; fileSize: number }> => {
  const response = await axios.get<NodeJS.ReadableStream>(artifactUrl, {
    responseType: 'stream',
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  const contentDispositionFileName = extractFileNameFromDisposition(response.headers['content-disposition']);
  const contentLength = Number(response.headers['content-length']);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error(`APK exceeds the configured ${maxBytes} byte upload limit.`);
  }

  let downloadedBytes = 0;
  const byteLimit = new Transform({
    transform(chunk, _encoding, callback) {
      downloadedBytes += Buffer.byteLength(chunk);

      if (downloadedBytes > maxBytes) {
        callback(new Error(`APK exceeds the configured ${maxBytes} byte upload limit.`));
        return;
      }

      callback(null, chunk);
    },
  });

  await pipeline(response.data, byteLimit, createWriteStream(tempFilePath));
  const fileStats = await stat(tempFilePath);

  return {
    contentDispositionFileName,
    fileSize: fileStats.size,
  };
};

export class MobileAppReleaseUploadService {
  private static validateTargetBuild(payload: EasBuildWebhookPayload): string | null {
    if (lowerStringOrNull(payload.status) !== 'finished') {
      return 'Build is not finished.';
    }

    if (lowerStringOrNull(payload.platform) !== 'android') {
      return 'Build is not an Android build.';
    }

    const filters = [
      {
        label: 'EAS account',
        expected: envOrNull('MOBILE_APK_ALLOWED_EAS_ACCOUNT'),
        actual: getAccountName(payload),
      },
      {
        label: 'EAS project',
        expected: envOrNull('MOBILE_APK_ALLOWED_EAS_PROJECT'),
        actual: getProjectName(payload),
      },
      {
        label: 'build profile',
        expected: envOrNull('MOBILE_APK_ALLOWED_BUILD_PROFILE'),
        actual: getBuildProfile(payload),
      },
      {
        label: 'app identifier',
        expected: envOrNull('MOBILE_APK_ALLOWED_APP_IDENTIFIER'),
        actual: getAppIdentifier(payload),
      },
    ];

    for (const filter of filters) {
      const mismatch = isFilterMismatch(filter.label, filter.expected, filter.actual);
      if (mismatch) return mismatch;
    }

    if (!getArtifactUrl(payload)) {
      return 'Build did not include a downloadable artifact URL.';
    }

    return null;
  }

  static async processEasWebhook(payload: EasBuildWebhookPayload): Promise<MobileAppReleaseProcessResult> {
    const ignoreReason = this.validateTargetBuild(payload);
    if (ignoreReason) {
      return { ignored: true, message: ignoreReason };
    }

    const artifactUrl = getArtifactUrl(payload);
    if (!artifactUrl) {
      return { ignored: true, message: 'Build did not include a downloadable artifact URL.' };
    }

    if (isProbablyAab(null, artifactUrl)) {
      return {
        ignored: true,
        message: 'Android build artifact is not an APK. Use an EAS build profile with android.buildType set to apk.',
      };
    }

    const maxApkBytes = getMaxApkBytes();
    const buildId = stringOrNull(payload.id) ?? `android-${Date.now()}`;
    const appVersion = getAppVersion(payload);
    const buildNumber = getAppBuildVersion(payload);
    const versionPart = sanitizePathSegment(appVersion ?? 'latest') || 'latest';
    const buildPart = sanitizePathSegment(buildNumber ? `build-${buildNumber}` : buildId) || buildId;
    const fileName = `rescuenect-${versionPart}-${buildPart}.apk`;
    const tempDir = path.join(tmpdir(), 'rescuenect-mobile-releases', sanitizePathSegment(buildId));
    const tempFilePath = path.join(tempDir, fileName);

    await mkdir(tempDir, { recursive: true });

    try {
      const { contentDispositionFileName, fileSize } = await downloadArtifactToTempFile(
        artifactUrl,
        tempFilePath,
        maxApkBytes
      );

      if (isProbablyAab(contentDispositionFileName, artifactUrl)) {
        return {
          ignored: true,
          message: 'Android build artifact is not an APK. Use an EAS build profile with android.buildType set to apk.',
        };
      }

      const githubToken = getGithubToken();
      const githubRepository = getGithubRepository();
      const githubReleaseTag = getGithubReleaseTag(payload);
      const githubRelease = await ensureGithubRelease({
        repository: githubRepository,
        token: githubToken,
        releaseTag: githubReleaseTag,
        releaseName: getGithubReleaseName(payload, githubReleaseTag),
        releaseBody: 'Automated Android APK assets published from successful EAS builds.',
        prerelease: parseBooleanEnv('MOBILE_APK_GITHUB_RELEASE_PRERELEASE') ?? true,
        targetCommitish: envOrNull('MOBILE_APK_GITHUB_RELEASE_TARGET'),
      });
      const githubAsset = await uploadGithubReleaseAsset({
        repository: githubRepository,
        token: githubToken,
        release: githubRelease,
        fileName,
        fileSize,
        filePath: tempFilePath,
      });
      const downloadUrl = githubAsset.downloadUrl;
      const releaseRecord: MobileAppReleaseRecord = {
        platform: 'android',
        storageProvider: 'github-release-assets',
        buildId,
        accountName: getAccountName(payload),
        projectName: getProjectName(payload),
        buildProfile: getBuildProfile(payload),
        appVersion,
        appBuildVersion: buildNumber,
        appIdentifier: getAppIdentifier(payload),
        publicUrl: downloadUrl,
        downloadUrl,
        fileName,
        filePath: fileName,
        fileSize,
        githubAssetId: githubAsset.assetId,
        githubReleaseId: githubAsset.releaseId,
        githubReleaseTag: githubAsset.releaseTag,
        githubReleaseUrl: githubAsset.releaseUrl,
        sourceBuildUrl: artifactUrl,
        buildDetailsPageUrl: stringOrNull(payload.buildDetailsPageUrl),
        completedAt: stringOrNull(payload.completedAt),
        releaseSource: 'eas-webhook',
        uploadedBy: null,
      };

      await MobileAppReleaseModel.saveLatestAndroidRelease(releaseRecord);

      return {
        ignored: false,
        message: 'Latest Android APK release updated.',
        release: await MobileAppReleaseModel.getLatestAndroidRelease(),
      };
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}
