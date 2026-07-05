import axios from 'axios';
import { createReadStream } from 'fs';

export const APK_CONTENT_TYPE = 'application/vnd.android.package-archive';

const DEFAULT_GITHUB_REPOSITORY = 'kuyajp123/Rescuenect';
const GITHUB_API_URL = 'https://api.github.com';

export type GithubUploadResult = {
  assetId: number;
  downloadUrl: string;
  releaseId: number;
  releaseTag: string;
  releaseUrl: string;
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

const stringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

export const getGithubToken = (): string => {
  const token =
    stringOrNull(process.env.MOBILE_APK_GITHUB_TOKEN) ??
    stringOrNull(process.env.GITHUB_RELEASE_TOKEN) ??
    stringOrNull(process.env.GITHUB_TOKEN);
  if (!token) {
    throw new Error('MOBILE_APK_GITHUB_TOKEN or GITHUB_RELEASE_TOKEN must be configured to upload APK assets.');
  }
  return token;
};

export const getGithubRepository = (): string => {
  const repository =
    stringOrNull(process.env.MOBILE_APK_GITHUB_REPO) ??
    stringOrNull(process.env.GITHUB_REPOSITORY) ??
    DEFAULT_GITHUB_REPOSITORY;
  if (!/^[^/\s]+\/[^/\s]+$/.test(repository)) {
    throw new Error('MOBILE_APK_GITHUB_REPO must use the owner/repository format.');
  }
  return repository;
};

export const getGithubHeaders = (token: string): Record<string, string> => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'rescuenect-mobile-release-upload',
});

export const getGithubReleaseByTag = async (
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

export const createGithubRelease = async (params: {
  repository: string;
  token: string;
  releaseTag: string;
  releaseName: string;
  releaseBody: string;
  prerelease: boolean;
  targetCommitish?: string | null;
}): Promise<GithubRelease> => {
  const response = await axios.post<GithubRelease>(
    `${GITHUB_API_URL}/repos/${params.repository}/releases`,
    {
      tag_name: params.releaseTag,
      target_commitish: params.targetCommitish ?? undefined,
      name: params.releaseName,
      body: params.releaseBody,
      draft: false,
      prerelease: params.prerelease,
      make_latest: 'false',
    },
    { headers: getGithubHeaders(params.token) }
  );

  return response.data;
};

export const ensureGithubRelease = async (params: {
  repository: string;
  token: string;
  releaseTag: string;
  releaseName: string;
  releaseBody: string;
  prerelease: boolean;
  targetCommitish?: string | null;
}): Promise<GithubRelease> =>
  (await getGithubReleaseByTag(params.repository, params.token, params.releaseTag)) ??
  createGithubRelease(params);

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

  try {
    await axios.delete(`${GITHUB_API_URL}/repos/${repository}/releases/assets/${duplicateAsset.id}`, {
      headers: getGithubHeaders(token),
    });
  } catch (error: any) {
    // Asset may have already been deleted (e.g. race condition) — safe to ignore
    if (error?.response?.status === 404) {
      console.warn(`[mobileAppReleaseGithub] Asset ${duplicateAsset.id} (${fileName}) not found during delete, skipping.`);
      return;
    }
    throw error;
  }
};

export const uploadGithubReleaseAsset = async (params: {
  repository: string;
  token: string;
  release: GithubRelease;
  fileName: string;
  fileSize: number;
  filePath: string;
}): Promise<GithubUploadResult> => {
  await deleteDuplicateGithubAsset(params.repository, params.token, params.release.id, params.fileName);

  const uploadUrl = params.release.upload_url.split('{')[0];
  const response = await axios.post<GithubReleaseAsset>(uploadUrl, createReadStream(params.filePath), {
    headers: {
      ...getGithubHeaders(params.token),
      'Content-Type': APK_CONTENT_TYPE,
      'Content-Length': String(params.fileSize),
    },
    params: {
      name: params.fileName,
      label: params.fileName,
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  return {
    assetId: response.data.id,
    downloadUrl: response.data.browser_download_url,
    releaseId: params.release.id,
    releaseTag: params.release.tag_name,
    releaseUrl: params.release.html_url,
  };
};
