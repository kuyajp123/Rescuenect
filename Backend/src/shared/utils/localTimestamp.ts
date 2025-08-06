import fs from 'fs';
import path from 'path';
const FILE_PATH_HOURLY = path.join(__dirname, 'hourly-timestamp.json');
const FILE_PATH_REALTIME = path.join(__dirname, 'realtime-timestamp.json');
const FILE_PATH_DAILY = path.join(__dirname, 'daily-timestamp.json');

const getLocalTimestamp = (path: any): Date | null => {
  if (!fs.existsSync(path)) return null;

  const raw = fs.readFileSync(path, 'utf-8');
  if (!raw.trim()) return null; // File is empty

  try {
    const { lastFetch } = JSON.parse(raw);
    return lastFetch ? new Date(lastFetch) : null;
  } catch (e) {
    console.error('Invalid JSON in last-fetch.json:', e);
    return null;
  }
};

const updateLocalTimestamp = (path: any) => {
  const now = new Date().toISOString();
  fs.writeFileSync(path, JSON.stringify({ lastFetch: now }));
};


// Hourly timestamp
export const getHourlyTimestamp = () => {
  return getLocalTimestamp(FILE_PATH_HOURLY);
}

export const updateHourlyTimestamp = () => {
  updateLocalTimestamp(FILE_PATH_HOURLY);
}


// Realtime timestamp
export const getRealtimeTimestamp = () => {
  return getLocalTimestamp(FILE_PATH_REALTIME);
}

export const updateRealtimeTimestamp = () => {
  updateLocalTimestamp(FILE_PATH_REALTIME);
}


// Daily timestamp
export const getDailyTimestamp = () => {
  return getLocalTimestamp(FILE_PATH_DAILY);
}

export const updateDailyTimestamp = () => {
  updateLocalTimestamp(FILE_PATH_DAILY);
}