import {
  MobileAppReleaseModel,
  type MobileAppReleaseRecord,
  type PublicMobileAppRelease,
} from '@/models/public/MobileAppReleaseModel';
import {
  ensureGithubRelease,
  getGithubRepository,
  getGithubToken,
  uploadGithubReleaseAsset,
} from '@/services/mobileAppReleaseGithub';
import { stat } from 'fs/promises';
import path from 'path';

export type ManualMobileAppReleaseSource = 'manual-script' | 'super-admin-upload';

export type PublishManualMobileAppReleaseParams = {
  apkPath: string;
  originalFileName?: string | null;
  fileSize?: number | null;
  buildProfile?: string | null;
  appIdentifier?: string | null;
  appVersion?: string | null;
  buildNumber?: string | null;
  releaseTag?: string | null;
  releaseName?: string | null;
  releaseSource: ManualMobileAppReleaseSource;
  uploadedBy?: string | null;
};

export type PublishManualMobileAppReleaseResult = {
  release: PublicMobileAppRelease;
  releaseRecord: MobileAppReleaseRecord;
};

const stringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const envOrNull = (name: string): string | null => stringOrNull(process.env[name]);

const sanitizeFilePart = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const parseBooleanEnv = (name: string): boolean | null => {
  const value = envOrNull(name)?.toLowerCase();
  if (!value) return null;
  if (['1', 'true', 'yes', 'on'].includes(value)) return true;
  if (['0', 'false', 'no', 'off'].includes(value)) return false;
  return null;
};

const getDefaultBuildProfile = (): string =>
  envOrNull('MOBILE_APK_ALLOWED_BUILD_PROFILE') ?? envOrNull('MOBILE_APK_MANUAL_BUILD_PROFILE') ?? 'staging';

const getDefaultAppIdentifier = (buildProfile: string): string =>
  envOrNull('MOBILE_APK_ALLOWED_APP_IDENTIFIER') ??
  envOrNull('MOBILE_APK_MANUAL_APP_IDENTIFIER') ??
  (['preview', 'production', 'prod'].includes(buildProfile.toLowerCase())
    ? 'com.yajeyps.client'
    : 'com.yajeyps.client.staging');

const getDefaultReleaseTag = (buildProfile: string): string =>
  envOrNull('MOBILE_APK_GITHUB_RELEASE_TAG') ??
  `mobile-app-${sanitizeFilePart(buildProfile) || 'android'}`;

const getDefaultReleaseName = (buildProfile: string): string =>
  envOrNull('MOBILE_APK_GITHUB_RELEASE_NAME') ?? `Rescuenect Android APK (${buildProfile})`;

const buildReleaseFileName = (params: {
  appVersion: string | null;
  buildNumber: string | null;
  buildProfile: string;
  timestamp: number;
}): string => {
  const versionPart = sanitizeFilePart(params.appVersion ?? 'manual') || 'manual';
  const buildPart =
    sanitizeFilePart(params.buildNumber ? `build-${params.buildNumber}` : params.buildProfile) ||
    String(params.timestamp);

  return `rescuenect-${versionPart}-${buildPart}.apk`;
};

export const publishManualMobileAppRelease = async (
  params: PublishManualMobileAppReleaseParams
): Promise<PublishManualMobileAppReleaseResult> => {
  const apkStats = params.fileSize
    ? { size: params.fileSize }
    : await stat(params.apkPath);
  const timestamp = Date.now();
  const buildProfile = stringOrNull(params.buildProfile) ?? getDefaultBuildProfile();
  const appIdentifier = stringOrNull(params.appIdentifier) ?? getDefaultAppIdentifier(buildProfile);
  const appVersion = stringOrNull(params.appVersion);
  const buildNumber = stringOrNull(params.buildNumber);
  const releaseTag = stringOrNull(params.releaseTag) ?? getDefaultReleaseTag(buildProfile);
  const releaseName = stringOrNull(params.releaseName) ?? getDefaultReleaseName(buildProfile);
  const fileName = buildReleaseFileName({
    appVersion,
    buildNumber,
    buildProfile,
    timestamp,
  });
  const githubToken = getGithubToken();
  const githubRepository = getGithubRepository();
  const githubRelease = await ensureGithubRelease({
    repository: githubRepository,
    token: githubToken,
    releaseTag,
    releaseName,
    releaseBody: 'Manual Android APK asset published for Rescuenect downloads.',
    prerelease: parseBooleanEnv('MOBILE_APK_GITHUB_RELEASE_PRERELEASE') ?? true,
    targetCommitish: envOrNull('MOBILE_APK_GITHUB_RELEASE_TARGET'),
  });
  const githubAsset = await uploadGithubReleaseAsset({
    repository: githubRepository,
    token: githubToken,
    release: githubRelease,
    fileName,
    fileSize: apkStats.size,
    filePath: params.apkPath,
  });
  const buildId = `manual-${sanitizeFilePart(buildProfile) || 'android'}-${timestamp}`;
  const sourceLabel =
    params.releaseSource === 'super-admin-upload'
      ? `super-admin-upload:${params.originalFileName ?? path.basename(params.apkPath)}`
      : `manual-script:${params.apkPath}`;
  const releaseRecord: MobileAppReleaseRecord = {
    platform: 'android',
    storageProvider: 'github-release-assets',
    buildId,
    accountName: envOrNull('MOBILE_APK_ALLOWED_EAS_ACCOUNT'),
    projectName: envOrNull('MOBILE_APK_ALLOWED_EAS_PROJECT'),
    buildProfile,
    appVersion,
    appBuildVersion: buildNumber,
    appIdentifier,
    publicUrl: githubAsset.downloadUrl,
    downloadUrl: githubAsset.downloadUrl,
    fileName,
    filePath: fileName,
    fileSize: apkStats.size,
    githubAssetId: githubAsset.assetId,
    githubReleaseId: githubAsset.releaseId,
    githubReleaseTag: githubAsset.releaseTag,
    githubReleaseUrl: githubAsset.releaseUrl,
    sourceBuildUrl: sourceLabel,
    buildDetailsPageUrl: null,
    completedAt: new Date(timestamp).toISOString(),
    releaseSource: params.releaseSource,
    uploadedBy: stringOrNull(params.uploadedBy),
  };

  await MobileAppReleaseModel.saveLatestAndroidRelease(releaseRecord);

  return {
    releaseRecord,
    release: await MobileAppReleaseModel.getLatestAndroidRelease(),
  };
};
