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
