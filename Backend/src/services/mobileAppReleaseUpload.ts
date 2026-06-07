import {
  MobileAppReleaseModel,
  type PublicMobileAppRelease,
  type MobileAppReleaseRecord,
} from '@/models/public/MobileAppReleaseModel';
import axios from 'axios';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir, rm, stat } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';

const DEFAULT_MAX_APK_BYTES = 250 * 1024 * 1024;
const DEFAULT_GITHUB_REPOSITORY = 'kuyajp123/Rescuenect';
const GITHUB_API_URL = 'https://api.github.com';
const APK_CONTENT_TYPE = 'application/vnd.android.package-archive';

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

const getGithubToken = (): string => {
  const token = envOrNull('MOBILE_APK_GITHUB_TOKEN') ?? envOrNull('GITHUB_RELEASE_TOKEN') ?? envOrNull('GITHUB_TOKEN');
  if (!token) {
    throw new Error('MOBILE_APK_GITHUB_TOKEN or GITHUB_RELEASE_TOKEN must be configured to upload APK assets.');
  }
  return token;
};

const getGithubRepository = (): string => {
  const repository = envOrNull('MOBILE_APK_GITHUB_REPO') ?? envOrNull('GITHUB_REPOSITORY') ?? DEFAULT_GITHUB_REPOSITORY;
  if (!/^[^/\s]+\/[^/\s]+$/.test(repository)) {
    throw new Error('MOBILE_APK_GITHUB_REPO must use the owner/repository format.');
  }
  return repository;
};

const getGithubReleaseTag = (payload: EasBuildWebhookPayload): string => {
  const configuredTag = envOrNull('MOBILE_APK_GITHUB_RELEASE_TAG');
  if (configuredTag) return configuredTag;

  const buildProfile = sanitizePathSegment(getBuildProfile(payload) ?? 'android') || 'android';
  return `mobile-app-${buildProfile}`;
};

const getGithubReleaseName = (payload: EasBuildWebhookPayload, releaseTag: string): string =>
  envOrNull('MOBILE_APK_GITHUB_RELEASE_NAME') ??
  `Rescuenect Android APK${getBuildProfile(payload) ? ` (${getBuildProfile(payload)})` : ` - ${releaseTag}`}`;

const getGithubHeaders = (token: string): Record<string, string> => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'rescuenect-mobile-release-upload',
});

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

type GithubReleaseAsset = {
  id: number;
  name: string;
  browser_download_url: string;
};

type GithubRelease = {
  id: number;
  html_url: string;
  upload_url: string;
  tag_name: string;
};

type GithubUploadResult = {
  assetId: number;
  downloadUrl: string;
  releaseId: number;
  releaseTag: string;
  releaseUrl: string;
};

const getGithubReleaseByTag = async (
  repository: string,
  token: string,
  releaseTag: string
): Promise<GithubRelease | null> => {
  try {
    const response = await axios.get<GithubRelease>(
      `${GITHUB_API_URL}/repos/${repository}/releases/tags/${encodeURIComponent(releaseTag)}`,
      { headers: getGithubHeaders(token) }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

const createGithubRelease = async (
  repository: string,
  token: string,
  payload: EasBuildWebhookPayload,
  releaseTag: string
): Promise<GithubRelease> => {
  const prerelease = parseBooleanEnv('MOBILE_APK_GITHUB_RELEASE_PRERELEASE') ?? true;
  const response = await axios.post<GithubRelease>(
    `${GITHUB_API_URL}/repos/${repository}/releases`,
    {
      tag_name: releaseTag,
      target_commitish: envOrNull('MOBILE_APK_GITHUB_RELEASE_TARGET') ?? undefined,
      name: getGithubReleaseName(payload, releaseTag),
      body: 'Automated Android APK assets published from successful EAS builds.',
      draft: false,
      prerelease,
      make_latest: 'false',
    },
    { headers: getGithubHeaders(token) }
  );

  return response.data;
};

const ensureGithubRelease = async (
  repository: string,
  token: string,
  payload: EasBuildWebhookPayload,
  releaseTag: string
): Promise<GithubRelease> =>
  (await getGithubReleaseByTag(repository, token, releaseTag)) ??
  createGithubRelease(repository, token, payload, releaseTag);

const deleteDuplicateGithubAsset = async (
  repository: string,
  token: string,
  releaseId: number,
  fileName: string
): Promise<void> => {
  const response = await axios.get<GithubReleaseAsset[]>(
    `${GITHUB_API_URL}/repos/${repository}/releases/${releaseId}/assets`,
    { headers: getGithubHeaders(token), params: { per_page: 100 } }
  );
  const duplicateAsset = response.data.find(asset => asset.name === fileName);

  if (!duplicateAsset) return;

  await axios.delete(`${GITHUB_API_URL}/repos/${repository}/releases/assets/${duplicateAsset.id}`, {
    headers: getGithubHeaders(token),
  });
};

const uploadGithubReleaseAsset = async (
  repository: string,
  token: string,
  release: GithubRelease,
  fileName: string,
  fileSize: number,
  filePath: string
): Promise<GithubUploadResult> => {
  await deleteDuplicateGithubAsset(repository, token, release.id, fileName);

  const uploadUrl = release.upload_url.split('{')[0];
  const response = await axios.post<GithubReleaseAsset>(uploadUrl, createReadStream(filePath), {
    headers: {
      ...getGithubHeaders(token),
      'Content-Type': APK_CONTENT_TYPE,
      'Content-Length': String(fileSize),
    },
    params: {
      name: fileName,
      label: fileName,
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  return {
    assetId: response.data.id,
    downloadUrl: response.data.browser_download_url,
    releaseId: release.id,
    releaseTag: release.tag_name,
    releaseUrl: release.html_url,
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
      const githubRelease = await ensureGithubRelease(githubRepository, githubToken, payload, githubReleaseTag);
      const githubAsset = await uploadGithubReleaseAsset(
        githubRepository,
        githubToken,
        githubRelease,
        fileName,
        fileSize,
        tempFilePath
      );
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
