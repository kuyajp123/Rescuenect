import { supabase } from '@/lib/supabase';
import {
  MobileAppReleaseModel,
  type PublicMobileAppRelease,
  type MobileAppReleaseRecord,
} from '@/models/public/MobileAppReleaseModel';
import axios from 'axios';

const DEFAULT_BUCKET_NAME = 'mobile-app-releases';
const DEFAULT_MAX_APK_BYTES = 250 * 1024 * 1024;
const APK_CONTENT_TYPE = 'application/vnd.android.package-archive';

const allowedApkMimeTypes = [APK_CONTENT_TYPE, 'application/octet-stream', 'application/zip'];

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

const getBucketName = (): string => envOrNull('MOBILE_APK_BUCKET') ?? DEFAULT_BUCKET_NAME;

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

export class MobileAppReleaseUploadService {
  private static async ensureApkBucketExists(): Promise<string> {
    const bucketName = getBucketName();
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      throw new Error(`Failed to list Supabase buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    const bucketOptions = {
      public: true,
      allowedMimeTypes: allowedApkMimeTypes,
      fileSizeLimit: getMaxApkBytes(),
    };

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, bucketOptions);
      if (createError) {
        throw new Error(`Failed to create APK bucket: ${createError.message}`);
      }
    } else {
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, bucketOptions);
      if (updateError) {
        console.warn('Failed to update APK bucket settings:', updateError);
      }
    }

    return bucketName;
  }

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

    const response = await axios.get<ArrayBuffer>(artifactUrl, {
      responseType: 'arraybuffer',
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    const contentDispositionFileName = extractFileNameFromDisposition(response.headers['content-disposition']);
    if (isProbablyAab(contentDispositionFileName, artifactUrl)) {
      return {
        ignored: true,
        message: 'Android build artifact is not an APK. Use an EAS build profile with android.buildType set to apk.',
      };
    }

    const apkBuffer = Buffer.from(response.data);
    const maxApkBytes = getMaxApkBytes();
    if (apkBuffer.byteLength > maxApkBytes) {
      throw new Error(`APK exceeds the configured ${maxApkBytes} byte upload limit.`);
    }

    const bucketName = await this.ensureApkBucketExists();
    const buildId = stringOrNull(payload.id) ?? `android-${Date.now()}`;
    const appVersion = getAppVersion(payload);
    const buildNumber = getAppBuildVersion(payload);
    const versionPart = sanitizePathSegment(appVersion ?? 'latest') || 'latest';
    const buildPart = sanitizePathSegment(buildNumber ? `build-${buildNumber}` : buildId) || buildId;
    const fileName = `rescuenect-${versionPart}-${buildPart}.apk`;
    const filePath = `android/${sanitizePathSegment(buildId)}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, apkBuffer, {
      contentType: APK_CONTENT_TYPE,
      upsert: true,
    });

    if (uploadError) {
      throw new Error(`Failed to upload APK to Supabase Storage: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    if (!urlData?.publicUrl) {
      throw new Error('Failed to generate APK public URL from Supabase Storage.');
    }

    const publicUrl = urlData.publicUrl;
    const downloadUrl = `${publicUrl}?download=${encodeURIComponent(fileName)}`;
    const releaseRecord: MobileAppReleaseRecord = {
      platform: 'android',
      buildId,
      accountName: getAccountName(payload),
      projectName: getProjectName(payload),
      buildProfile: getBuildProfile(payload),
      appVersion,
      appBuildVersion: buildNumber,
      appIdentifier: getAppIdentifier(payload),
      publicUrl,
      downloadUrl,
      fileName,
      filePath,
      fileSize: apkBuffer.byteLength,
      bucketName,
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
  }
}
