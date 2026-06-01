const normalizeComparableValue = (value: unknown): unknown => {
  if (value === undefined || value === null || value === '') return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return Number.isFinite(value) ? Number(value.toFixed(6)) : null;
  if (typeof value === 'object' && value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(normalizeComparableValue);
  if (typeof value === 'object' && value) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeComparableValue(entry)])
    );
  }

  return value;
};

const stableStringify = (value: unknown): string => JSON.stringify(normalizeComparableValue(value));

export const areChangeValuesEqual = (before: unknown, after: unknown): boolean =>
  stableStringify(before) === stableStringify(after);

export const hasRecordChanges = (
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined
): boolean => {
  const beforeRecord = before ?? {};
  const afterRecord = after ?? {};
  const keys = new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)]);

  return Array.from(keys).some(key => !areChangeValuesEqual(beforeRecord[key], afterRecord[key]));
};
