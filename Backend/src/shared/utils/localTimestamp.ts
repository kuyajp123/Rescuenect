import fs from 'fs';
import path from 'path';
const FILE_PATH = path.join(__dirname, 'last-fetch.json');

export const getLocalTimestamp = (): Date | null => {
  if (!fs.existsSync(FILE_PATH)) return null;

  const raw = fs.readFileSync(FILE_PATH, 'utf-8');
  if (!raw.trim()) return null; // File is empty

  try {
    const { lastFetch } = JSON.parse(raw);
    return lastFetch ? new Date(lastFetch) : null;
  } catch (e) {
    console.error('Invalid JSON in last-fetch.json:', e);
    return null;
  }
};

export const updateLocalTimestamp = () => {
  const now = new Date().toISOString();
  fs.writeFileSync(FILE_PATH, JSON.stringify({ lastFetch: now }));
};
