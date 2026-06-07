import { db } from '@/db/firestoreConfig';
import { FieldValue } from 'firebase-admin/firestore';

export type PublicMobileAppRelease = {
  available: boolean;
  platform: 'android';
  version: string | null;
  buildNumber: string | null;
  buildProfile: string | null;
  fileName: string | null;
  fileSize: number | null;
  uploadedAt: string | null;
  completedAt: string | null;
  downloadUrl: string | null;
  publicUrl: string | null;
};

export type MobileAppReleaseRecord = {
  platform: 'android';
  storageProvider: 'github-release-assets';
  buildId: string;
  accountName: string | null;
  projectName: string | null;
  buildProfile: string | null;
  appVersion: string | null;
  appBuildVersion: string | null;
  appIdentifier: string | null;
  publicUrl: string;
  downloadUrl: string;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  githubAssetId: number | null;
  githubReleaseId: number | null;
  githubReleaseTag: string | null;
  githubReleaseUrl: string | null;
  sourceBuildUrl: string;
  buildDetailsPageUrl: string | null;
  completedAt: string | null;
};

const emptyAndroidRelease = (): PublicMobileAppRelease => ({
  available: false,
  platform: 'android',
  version: null,
  buildNumber: null,
  buildProfile: null,
  fileName: null,
  fileSize: null,
  uploadedAt: null,
  completedAt: null,
  downloadUrl: null,
  publicUrl: null,
});

const stringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const numberOrNull = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const toIsoString = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && 'toDate' in value && typeof (value as any).toDate === 'function') {
    return (value as any).toDate().toISOString();
  }
  return null;
};

export class MobileAppReleaseModel {
  private static readonly latestDocId = 'latest-android';

  private static collectionRef() {
    return db.collection('mobileAppReleases');
  }

  private static historyCollectionRef() {
    return db.collection('mobileAppReleaseHistory');
  }

  static async getLatestAndroidRelease(): Promise<PublicMobileAppRelease> {
    const snapshot = await this.collectionRef().doc(this.latestDocId).get();

    if (!snapshot.exists) {
      return emptyAndroidRelease();
    }

    const data = snapshot.data() ?? {};
    const downloadUrl = stringOrNull(data.downloadUrl);
    const publicUrl = stringOrNull(data.publicUrl);

    if (!downloadUrl || !publicUrl) {
      return emptyAndroidRelease();
    }

    return {
      available: true,
      platform: 'android',
      version: stringOrNull(data.appVersion),
      buildNumber: stringOrNull(data.appBuildVersion),
      buildProfile: stringOrNull(data.buildProfile),
      fileName: stringOrNull(data.fileName),
      fileSize: numberOrNull(data.fileSize),
      uploadedAt: toIsoString(data.uploadedAt),
      completedAt: toIsoString(data.completedAt),
      downloadUrl,
      publicUrl,
    };
  }

  static async saveLatestAndroidRelease(release: MobileAppReleaseRecord): Promise<void> {
    const payload = {
      ...release,
      uploadedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await this.collectionRef().doc(this.latestDocId).set(payload, { merge: true });
    await this.historyCollectionRef().doc(release.buildId).set(payload, { merge: true });
  }
}
