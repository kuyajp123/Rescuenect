/**
 * Shared CLI utilities for seeders.
 */

import { db } from '../../src/db/firestoreConfig';

// ─── CLI arg parsing ───────────────────────────────────────────────────────────

export interface CliArgs {
  clientId: string;
  module: string;
  count: number;
  target: 'seeded' | 'all';
}

export function parseCliArgs(): CliArgs {
  const args = process.argv.slice(2);
  const get = (prefix: string): string | undefined => {
    const arg = args.find(a => a.startsWith(prefix));
    return arg ? arg.slice(prefix.length) : undefined;
  };

  const clientId = get('--client=') ?? '';
  const module = get('--module=') ?? '';
  const countRaw = get('--count=');
  const count = countRaw ? Math.max(1, parseInt(countRaw, 10) || 5) : 5;
  
  const targetRaw = get('--target=') ?? 'seeded';
  const target = targetRaw === 'all' ? 'all' : 'seeded';

  return { clientId, module, count, target };
}

// ─── Random helpers ────────────────────────────────────────────────────────────

export const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

export const randomFloat = (min: number, max: number, decimals = 6): number =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

export const randomBool = (probability = 0.5): boolean => Math.random() < probability;

export const uuid = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

/** Shuffle an array in-place and return it. */
export const shuffle = <T>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/** Return a random sub-array of length `n` from `arr`. */
export const sample = <T>(arr: T[], n: number): T[] => shuffle([...arr]).slice(0, n);

// ─── Firestore helper ──────────────────────────────────────────────────────────

/** Verify the client exists in Firestore (clients collection). */
export async function verifyClientExists(clientId: string): Promise<void> {
  if (clientId === 'naic') return; // legacy static client — always valid

  const snap = await db.collection('clients').doc(clientId).get();
  if (!snap.exists) {
    throw new Error(`Client "${clientId}" not found in Firestore. Double-check the --client argument.`);
  }

  const status = snap.data()?.status;
  if (status && !['active', 'draft'].includes(status)) {
    console.warn(`⚠️  Client "${clientId}" has status "${status}". Seeding anyway...`);
  }
}

export interface ClientGeoBounds {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
  centerLat: number;
  centerLng: number;
  barangays: string[];
  municipalityName: string;
  provinceName: string;
}

// Default padding in degrees when deriving bounds from a single center point
const DEFAULT_BOUNDS_PADDING = 0.05; // ~5.5 km

/**
 * Fetches geo bounds for a client dynamically from Firestore.
 * Uses maxBounds if configured, otherwise derives bounds from the center
 * point (weatherLatitude/weatherLongitude) with a padding.
 * Falls back to hardcoded Naic values for the legacy static client.
 */
export async function getClientGeoBounds(clientId: string): Promise<ClientGeoBounds> {
  // ── Legacy static client (Naic) ──────────────────────────────────────────────
  if (clientId === 'naic') {
    return {
      latMin: 14.26,
      latMax: 14.36,
      lngMin: 120.74,
      lngMax: 120.83,
      centerLat: 14.2919325,
      centerLng: 120.7752839,
      municipalityName: 'Naic',
      provinceName: 'Cavite',
      barangays: [
        'Labac', 'Mabolo', 'Bancaan', 'Balsahan', 'Bagong Karsada',
        'Sapa', 'Bucana Sasahan', 'Gomez-Zamora', 'Kanluran', 'Humbac',
        'Bucana Malaki', 'Ibayo Estacion', 'Ibayo Silangan', 'Latoria',
        'Munting Mapino', 'Muzon', 'Santulan', 'Calubcob', 'Makina',
        'San Roque', 'Sabang', 'Molino', 'Halang', 'Palangue 1',
      ],
    };
  }

  // ── Dynamic Firestore client ──────────────────────────────────────────────────
  const snap = await db.collection('clients').doc(clientId).get();
  if (!snap.exists) {
    throw new Error(`Client "${clientId}" not found in Firestore.`);
  }

  const data = snap.data() ?? {};

  // Pull weather center point
  const centerLat: number = typeof data.weatherLatitude === 'number' && Number.isFinite(data.weatherLatitude)
    ? data.weatherLatitude
    : 0;
  const centerLng: number = typeof data.weatherLongitude === 'number' && Number.isFinite(data.weatherLongitude)
    ? data.weatherLongitude
    : 0;

  // Pull maxBounds if available (set by admin in map settings)
  const maxBounds = data.mapSettings?.maxBounds;
  const hasBounds =
    maxBounds &&
    typeof maxBounds.north === 'number' &&
    typeof maxBounds.south === 'number' &&
    typeof maxBounds.east === 'number' &&
    typeof maxBounds.west === 'number';

  const latMin = hasBounds ? maxBounds.south : centerLat - DEFAULT_BOUNDS_PADDING;
  const latMax = hasBounds ? maxBounds.north : centerLat + DEFAULT_BOUNDS_PADDING;
  const lngMin = hasBounds ? maxBounds.west  : centerLng - DEFAULT_BOUNDS_PADDING;
  const lngMax = hasBounds ? maxBounds.east  : centerLng + DEFAULT_BOUNDS_PADDING;

  // Pull barangay labels from the barangays array
  const rawBarangays: unknown[] = Array.isArray(data.barangays) ? data.barangays : [];
  const barangays = rawBarangays
    .map((b: unknown) => {
      if (typeof b === 'object' && b !== null) {
        const obj = b as Record<string, unknown>;
        return typeof obj.barangayLabel === 'string' ? obj.barangayLabel
          : typeof obj.label === 'string' ? obj.label
          : null;
      }
      return null;
    })
    .filter((label): label is string => label !== null && label.trim() !== '');

  const municipalityName: string = typeof data.municipalityName === 'string' ? data.municipalityName
    : typeof data.name === 'string' ? data.name
    : clientId;
  const provinceName: string = typeof data.provinceName === 'string' ? data.provinceName : '';

  if (!hasBounds || !centerLat || !centerLng) {
    console.warn(`   ⚠️  Client "${clientId}" is missing mapSettings.maxBounds or weather coordinates.`);
    console.warn(`       Seeding with derived bounds (center ± ${DEFAULT_BOUNDS_PADDING}°). Set maxBounds in the admin panel for precise seeding.`);
  }

  return { latMin, latMax, lngMin, lngMax, centerLat, centerLng, barangays, municipalityName, provinceName };
}


// ─── Image generation ──────────────────────────────────────────────────────────

/**
 * Fetch a placeholder image buffer from placehold.co
 * This downloads a real PNG which satisfies Supabase's allowedMimeTypes.
 */
export async function fetchPlaceholderImageBuffer(
  label: string,
  width = 800,
  height = 450,
  bg = '#1e3a5f'
): Promise<{ buffer: Buffer; mimetype: string; originalname: string }> {
  const colors = ['1e3a5f', '2d6a4f', '774936', '560bad', '0077b6', 'd62828', '023e8a', '7b2d00'];
  // Remove # if present for the URL path
  const bgColor = (bg ?? pick(colors)).replace('#', '');
  const textColor = 'ffffff';
  
  // Format label for URL (max chars, replace spaces with +)
  const safeLabel = encodeURIComponent(label.slice(0, 30));
  const url = `https://placehold.co/${width}x${height}/${bgColor}/${textColor}.png?text=${safeLabel}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch placeholder: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    
    return {
      buffer: Buffer.from(arrayBuffer),
      mimetype: 'image/png',
      originalname: `${label.toLowerCase().replace(/\s+/g, '-')}.png`,
    };
  } catch (error) {
    console.warn('⚠️ Fallback to 1x1 transparent PNG due to fetch error:', error);
    // 1x1 transparent PNG fallback if network fails
    const fallbackPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    return {
      buffer: fallbackPng,
      mimetype: 'image/png',
      originalname: 'fallback.png',
    };
  }
}

// ─── Storage cleanup ───────────────────────────────────────────────────────────

import { supabase } from '../../src/lib/supabase';

/** Safely deletes all files inside a specific folder in a Supabase bucket */
export async function deleteStorageFolder(bucket: string, folderPath: string): Promise<void> {
  try {
    const { data: files } = await supabase.storage.from(bucket).list(folderPath);
    if (!files || files.length === 0) return;

    const pathsToRemove = files.map(file => `${folderPath}/${file.name}`);
    const { error } = await supabase.storage.from(bucket).remove(pathsToRemove);
    
    if (error) {
      console.warn(`   ⚠️  Failed to delete storage files in ${bucket}/${folderPath}: ${error.message}`);
    }
  } catch (err) {
    console.warn(`   ⚠️  Storage cleanup error for ${bucket}/${folderPath}:`, err);
  }
}

/** Safely deletes a specific file in a Supabase bucket */
export async function deleteStorageFile(bucket: string, filePath: string): Promise<void> {
  try {
    await supabase.storage.from(bucket).remove([filePath]);
  } catch (err) {
    console.warn(`   ⚠️  Storage file deletion error for ${bucket}/${filePath}:`, err);
  }
}
