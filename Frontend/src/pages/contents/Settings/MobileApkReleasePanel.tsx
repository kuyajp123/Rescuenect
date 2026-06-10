import { API_ENDPOINTS } from '@/config/endPoints';
import { getToken } from '@/pages/contents/SuperAdmin/utils';
import { Button, Card, CardBody, CardHeader, Chip, Divider, Input, Progress, addToast } from '@heroui/react';
import axios from 'axios';
import { ExternalLink, FileArchive, PackageCheck, RefreshCcw, UploadCloud } from 'lucide-react';
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

type MobileApkRelease = {
  available: boolean;
  platform?: 'android';
  version: string | null;
  buildNumber: string | null;
  buildProfile: string | null;
  fileName: string | null;
  fileSize: number | null;
  uploadedAt?: string | null;
  completedAt?: string | null;
  downloadUrl: string | null;
  publicUrl?: string | null;
};

type MobileApkUploadResponse = {
  message: string;
  release: MobileApkRelease;
};

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getReleaseLabel = (release: MobileApkRelease | null) =>
  release
    ? [release.version, release.buildNumber ? `build ${release.buildNumber}` : null].filter(Boolean).join(' ')
    : '';

export const MobileApkReleasePanel = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishedLabel, setPublishedLabel] = useState('');
  const [currentRelease, setCurrentRelease] = useState<MobileApkRelease | null>(null);
  const [isLoadingCurrentRelease, setIsLoadingCurrentRelease] = useState(false);
  const [releaseForm, setReleaseForm] = useState({
    appVersion: '',
    buildNumber: '',
    buildProfile: '',
    appIdentifier: '',
  });

  const fetchCurrentRelease = async () => {
    try {
      setIsLoadingCurrentRelease(true);
      const response = await axios.get<{ release: MobileApkRelease }>(API_ENDPOINTS.PUBLIC.MOBILE_APP_LATEST);
      const release = response.data.release;
      setCurrentRelease(release);
      setPublishedLabel(release?.available ? getReleaseLabel(release) || release.fileName || 'Latest APK' : '');
    } catch (error) {
      setCurrentRelease(null);
    } finally {
      setIsLoadingCurrentRelease(false);
    }
  };

  useEffect(() => {
    void fetchCurrentRelease();
  }, []);

  const updateField = (field: keyof typeof releaseForm) => (value: string) => {
    setReleaseForm(current => ({ ...current, [field]: value }));
  };

  const setSelectedApkFile = (file: File | null): boolean => {
    if (file && !file.name.toLowerCase().endsWith('.apk')) {
      addToast({ title: 'Choose an APK file', color: 'warning' });
      setApkFile(null);
      return false;
    }

    setApkFile(file);
    return true;
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const didSelectFile = setSelectedApkFile(event.target.files?.[0] ?? null);
    if (!didSelectFile) event.target.value = '';
  };

  const handleFileDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    setSelectedApkFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDropZoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    fileInputRef.current?.click();
  };

  const publishApk = async () => {
    if (!apkFile) {
      addToast({ title: 'APK file required', color: 'warning' });
      return;
    }

    const formData = new FormData();
    formData.append('apk', apkFile);
    Object.entries(releaseForm).forEach(([key, value]) => {
      const normalizedValue = value.trim();
      if (normalizedValue) formData.append(key, normalizedValue);
    });

    try {
      setUploading(true);
      setUploadProgress(0);

      const token = await getToken();
      const response = await axios.post<MobileApkUploadResponse>(API_ENDPOINTS.SUPER_ADMIN.MOBILE_APP_RELEASE, formData, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: event => {
          const total = event.total ?? apkFile.size;
          if (total > 0) setUploadProgress(Math.min(100, Math.round((event.loaded / total) * 100)));
        },
      });
      const release = response.data.release;
      const releaseLabel = getReleaseLabel(release);

      setCurrentRelease(release);
      setPublishedLabel(releaseLabel || release.fileName || 'Latest APK');
      setApkFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      addToast({ title: 'APK published', description: release.fileName ?? 'Latest resident APK updated.', color: 'success' });
    } catch (error) {
      addToast({
        title: 'Upload failed',
        description: axios.isAxiosError(error) ? error.response?.data?.message || error.message : 'Failed to publish APK',
        color: 'danger',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="border border-primary/20 shadow-lg">
      <CardHeader className="flex flex-col items-start gap-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <PackageCheck size={20} className="text-primary" />
          </div>
          <div className="flex flex-col">
            <p className="text-lg font-semibold">Mobile App Release</p>
            <p className="text-small text-default-500">Publish the resident Android APK</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".apk,application/vnd.android.package-archive,application/octet-stream"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          color="primary"
          variant="flat"
          startContent={<UploadCloud size={18} />}
          onPress={() => fileInputRef.current?.click()}
          isDisabled={uploading}
        >
          Choose APK
        </Button>
      </CardHeader>
      <Divider />
      <CardBody className="gap-5 py-6">
        <div className="rounded-lg border border-default-200 bg-content1 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">Current APK</p>
                <Chip size="sm" color={currentRelease?.available ? 'success' : 'default'} variant="flat">
                  {currentRelease?.available ? 'Published' : 'No APK'}
                </Chip>
              </div>
              <p className="mt-1 text-sm text-default-500">
                {currentRelease?.available
                  ? currentRelease.fileName || 'Latest Android APK'
                  : isLoadingCurrentRelease
                    ? 'Checking current release...'
                    : 'No APK is currently shown on the home page.'}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                isIconOnly
                variant="flat"
                aria-label="Refresh current APK"
                isLoading={isLoadingCurrentRelease}
                onPress={fetchCurrentRelease}
              >
                <RefreshCcw size={16} />
              </Button>
              {currentRelease?.available && currentRelease.downloadUrl && (
                <Button
                  as="a"
                  href={currentRelease.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="flat"
                  color="primary"
                  endContent={<ExternalLink size={16} />}
                >
                  Open APK
                </Button>
              )}
            </div>
          </div>

          {currentRelease?.available && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-md bg-default-50 px-3 py-2">
                <p className="text-xs text-default-500">Version</p>
                <p className="truncate text-sm font-medium">{currentRelease.version || 'Not set'}</p>
              </div>
              <div className="rounded-md bg-default-50 px-3 py-2">
                <p className="text-xs text-default-500">Build number</p>
                <p className="truncate text-sm font-medium">{currentRelease.buildNumber || 'Not set'}</p>
              </div>
              <div className="rounded-md bg-default-50 px-3 py-2">
                <p className="text-xs text-default-500">Build profile</p>
                <p className="truncate text-sm font-medium">{currentRelease.buildProfile || 'Not set'}</p>
              </div>
              <div className="rounded-md bg-default-50 px-3 py-2">
                <p className="text-xs text-default-500">File size</p>
                <p className="truncate text-sm font-medium">
                  {currentRelease.fileSize ? formatBytes(currentRelease.fileSize) : 'Not available'}
                </p>
              </div>
              <div className="rounded-md bg-default-50 px-3 py-2">
                <p className="text-xs text-default-500">Uploaded</p>
                <p className="truncate text-sm font-medium">{formatDateTime(currentRelease.uploadedAt)}</p>
              </div>
              <div className="rounded-md bg-default-50 px-3 py-2">
                <p className="text-xs text-default-500">Completed</p>
                <p className="truncate text-sm font-medium">{formatDateTime(currentRelease.completedAt)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Version" placeholder="2.1.0" value={releaseForm.appVersion} onValueChange={updateField('appVersion')} />
          <Input label="Build number" placeholder="8" value={releaseForm.buildNumber} onValueChange={updateField('buildNumber')} />
          <Input label="Build profile" placeholder="Backend default" value={releaseForm.buildProfile} onValueChange={updateField('buildProfile')} />
          <Input
            label="App identifier"
            placeholder="Backend default"
            value={releaseForm.appIdentifier}
            onValueChange={updateField('appIdentifier')}
          />
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={handleDropZoneKeyDown}
          onDragEnter={handleDragOver}
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          className={`flex cursor-pointer flex-col gap-3 rounded-lg border p-4 outline-none transition-all sm:flex-row sm:items-center sm:justify-between ${
            isDragging
              ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20'
              : 'border-default-200 bg-content1 hover:border-primary/50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20'
          }`}
          aria-label="Choose or drop Android APK"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                isDragging ? 'bg-primary/15 text-primary' : 'bg-default-100 text-default-500'
              }`}
            >
              <FileArchive size={20} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{isDragging ? 'Drop APK here' : apkFile?.name ?? 'No APK selected'}</p>
              <p className="text-sm text-default-500">
                {apkFile ? formatBytes(apkFile.size) : publishedLabel ? `Last published: ${publishedLabel}` : 'Ready for upload'}
              </p>
            </div>
          </div>

          <Button
            color="primary"
            startContent={<PackageCheck size={18} />}
            onPress={publishApk}
            isLoading={uploading}
            onClick={event => event.stopPropagation()}
          >
            Publish APK
          </Button>
        </div>

        {uploading && <Progress aria-label="APK upload progress" color="primary" value={uploadProgress} />}
      </CardBody>
    </Card>
  );
};
