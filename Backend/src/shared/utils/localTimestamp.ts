import fs from 'fs';
import path from 'path';
const FILE_PATH_FORECAST = path.join(__dirname, 'forecast-timestamp.json');
const FILE_PATH_REALTIME = path.join(__dirname, 'realtime-timestamp.json');

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

export const getForecastTimestamp = () => {
  return getLocalTimestamp(FILE_PATH_FORECAST);
}

export const updateForecastTimestamp = () => {
  updateLocalTimestamp(FILE_PATH_FORECAST);
}



export const getRealtimeTimestamp = () => {
  return getLocalTimestamp(FILE_PATH_REALTIME);
}

export const updateRealtimeTimestamp = () => {
  updateLocalTimestamp(FILE_PATH_REALTIME);
}