import { DateTime } from 'luxon';

export function convertToManilaTime(utcTime: string): string {
  const isoString = DateTime
    .fromISO(utcTime, { zone: 'utc' })       // Step 1: Parse as UTC
    .setZone('Asia/Manila')                  // Step 2: Convert to Manila time
    .toISO({ suppressMilliseconds: true });  // Step 3: Get ISO string
  return isoString ?? '';
}
