export const CLIENT_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const CLIENT_LOGO_MIN_SIZE = 128;
export const CLIENT_LOGO_MAX_SIZE = 1024;
export const CLIENT_LOGO_RECOMMENDED_SIZE = '512x512 PNG';

export type ClientLogoDimensions = {
  width: number;
  height: number;
};

export const CLIENT_LOGO_HELP_TEXT =
  `Upload a square PNG. Recommended ${CLIENT_LOGO_RECOMMENDED_SIZE}; accepted ${CLIENT_LOGO_MIN_SIZE}-${CLIENT_LOGO_MAX_SIZE}px, max 2 MB.`;

export const validateClientLogoFile = (file: File): string | null => {
  const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
  if (!isPng) return 'Logo must be a PNG file.';
  if (file.size > CLIENT_LOGO_MAX_BYTES) return 'Logo must not exceed 2 MB.';
  return null;
};

export const readClientLogoDimensions = (file: File): Promise<ClientLogoDimensions> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read logo image dimensions.'));
    };

    image.src = objectUrl;
  });

export const validateClientLogoDimensions = ({ width, height }: ClientLogoDimensions): string | null => {
  if (
    width < CLIENT_LOGO_MIN_SIZE ||
    height < CLIENT_LOGO_MIN_SIZE ||
    width > CLIENT_LOGO_MAX_SIZE ||
    height > CLIENT_LOGO_MAX_SIZE
  ) {
    return `Logo must be between ${CLIENT_LOGO_MIN_SIZE}x${CLIENT_LOGO_MIN_SIZE} and ${CLIENT_LOGO_MAX_SIZE}x${CLIENT_LOGO_MAX_SIZE}px.`;
  }

  const aspectRatio = width / height;
  if (Math.abs(1 - aspectRatio) > 0.1) return 'Logo must be a square PNG image.';
  return null;
};
