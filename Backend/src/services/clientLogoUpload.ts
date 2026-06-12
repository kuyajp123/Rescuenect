import { supabase } from '@/lib/supabase';

export const CLIENT_LOGO_BUCKET = 'client-logos';
export const CLIENT_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const CLIENT_LOGO_MIN_SIZE = 128;
export const CLIENT_LOGO_MAX_SIZE = 1024;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_ASPECT_RATIO_DELTA = 0.1;

export class ClientLogoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientLogoValidationError';
  }
}

type PngDimensions = {
  width: number;
  height: number;
};

type ClientLogoUploadResult = PngDimensions & {
  logoUrl: string;
  logoPath: string;
};

const assertPngDimensions = (buffer: Buffer): PngDimensions => {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new ClientLogoValidationError('LGU logo must be a valid PNG image.');
  }

  if (buffer.toString('ascii', 12, 16) !== 'IHDR') {
    throw new ClientLogoValidationError('LGU logo PNG is missing valid image metadata.');
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const aspectRatio = width / height;

  if (
    width < CLIENT_LOGO_MIN_SIZE ||
    height < CLIENT_LOGO_MIN_SIZE ||
    width > CLIENT_LOGO_MAX_SIZE ||
    height > CLIENT_LOGO_MAX_SIZE
  ) {
    throw new ClientLogoValidationError(
      `LGU logo must be between ${CLIENT_LOGO_MIN_SIZE}x${CLIENT_LOGO_MIN_SIZE} and ${CLIENT_LOGO_MAX_SIZE}x${CLIENT_LOGO_MAX_SIZE}px.`
    );
  }

  if (Math.abs(1 - aspectRatio) > MAX_ASPECT_RATIO_DELTA) {
    throw new ClientLogoValidationError('LGU logo must be a square PNG image.');
  }

  return { width, height };
};

const ensureClientLogoBucketExists = async (): Promise<void> => {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(`Failed to list Supabase buckets: ${listError.message}`);
  }

  const bucketExists = buckets?.some(bucket => bucket.name === CLIENT_LOGO_BUCKET);
  const bucketOptions = {
    public: true,
    allowedMimeTypes: ['image/png'],
    fileSizeLimit: CLIENT_LOGO_MAX_BYTES,
  };

  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(CLIENT_LOGO_BUCKET, bucketOptions);
    if (error) throw new Error(`Failed to create LGU logo bucket: ${error.message}`);
    return;
  }

  const { error } = await supabase.storage.updateBucket(CLIENT_LOGO_BUCKET, bucketOptions);
  if (error) {
    console.warn('Failed to update LGU logo bucket options:', error.message);
  }
};

export class ClientLogoUploadService {
  static async removeClientLogo(logoPath: string | null | undefined): Promise<void> {
    if (!logoPath) return;

    const { error } = await supabase.storage.from(CLIENT_LOGO_BUCKET).remove([logoPath]);
    if (error) {
      throw new Error(`Failed to remove LGU logo (${logoPath}): ${error.message}`);
    }
  }

  static async uploadClientLogo(file: Express.Multer.File, clientId: string): Promise<ClientLogoUploadResult> {
    if (!file) {
      throw new ClientLogoValidationError('LGU logo file is required.');
    }

    const isPngMime = file.mimetype === 'image/png';
    const isPngName = typeof file.originalname === 'string' && file.originalname.toLowerCase().endsWith('.png');
    if (!isPngMime && !isPngName) {
      throw new ClientLogoValidationError('LGU logo must be uploaded as a PNG file.');
    }

    const fileSize = typeof file.size === 'number' ? file.size : file.buffer.byteLength;
    if (fileSize > CLIENT_LOGO_MAX_BYTES) {
      throw new ClientLogoValidationError('LGU logo must not exceed 2 MB.');
    }

    const dimensions = assertPngDimensions(file.buffer);
    await ensureClientLogoBucketExists();

    const safeClientId = clientId.trim().replace(/[^a-zA-Z0-9_-]+/g, '-');
    const logoPath = `${safeClientId}/logo-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from(CLIENT_LOGO_BUCKET)
      .upload(logoPath, file.buffer, {
        contentType: 'image/png',
        upsert: false,
        cacheControl: '31536000',
      });

    if (uploadError) {
      throw new Error(`Failed to upload LGU logo: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(CLIENT_LOGO_BUCKET).getPublicUrl(logoPath);
    return {
      ...dimensions,
      logoPath,
      logoUrl: data.publicUrl,
    };
  }
}
