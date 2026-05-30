import type { BaseNotification, EarthquakeNotificationData } from '@/types/notification';

const STALE_EARTHQUAKE_DISPLAY_AGE_MS = 24 * 60 * 60 * 1000;

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function parseTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return null;

  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseLegacyEarthquakeMessageTime(message: string | undefined, referenceTimestamp: number): number | null {
  if (!message) return null;

  const match = message.match(/\bat\s+([A-Za-z]{3,9})\s+(\d{1,2}),\s+(\d{1,2}):(\d{2})\s*(AM|PM)\b/i);
  if (!match) return null;

  const month = MONTH_INDEX[match[1].slice(0, 3).toLowerCase()];
  const day = Number(match[2]);
  let hour = Number(match[3]);
  const minute = Number(match[4]);
  const meridiem = match[5].toUpperCase();

  if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  const year = new Date(referenceTimestamp).getFullYear();
  return new Date(year, month, day, hour, minute).getTime();
}

export function getEarthquakeEventTimestamp(notification: Pick<BaseNotification, 'type' | 'data' | 'message' | 'timestamp'>): number | null {
  if (notification.type !== 'earthquake') return null;

  const earthquakeData = notification.data as EarthquakeNotificationData | Record<string, unknown> | undefined;
  const fromData =
    parseTimestamp((earthquakeData as EarthquakeNotificationData | undefined)?.eventTime) ??
    parseTimestamp((earthquakeData as EarthquakeNotificationData | undefined)?.eventTimeIso) ??
    parseTimestamp((earthquakeData as Record<string, unknown> | undefined)?.time);

  return fromData ?? parseLegacyEarthquakeMessageTime(notification.message, notification.timestamp);
}

export function getNotificationDisplayTimestamp(notification: Pick<BaseNotification, 'type' | 'data' | 'message' | 'timestamp'>): number {
  return getEarthquakeEventTimestamp(notification) ?? notification.timestamp;
}

export function isStaleEarthquakeNotification(
  notification: Pick<BaseNotification, 'type' | 'data' | 'message' | 'timestamp'>,
  now = Date.now()
): boolean {
  const eventTimestamp = getEarthquakeEventTimestamp(notification);
  return eventTimestamp !== null && now - eventTimestamp > STALE_EARTHQUAKE_DISPLAY_AGE_MS;
}
