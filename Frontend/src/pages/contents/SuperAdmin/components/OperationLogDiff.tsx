import type { OperationLog } from '@/pages/contents/SuperAdmin/types';

type DiffRow = {
  label: string;
  before: unknown;
  after: unknown;
};

const toRecord = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {};

const humanize = (value: string) =>
  value
    .replace(/\./g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, match => match.toUpperCase());

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return 'None';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const areSame = (before: unknown, after: unknown) => formatValue(before) === formatValue(after);

const flattenRecord = (value: unknown, prefix = ''): Record<string, unknown> => {
  const record = toRecord(value);

  return Object.entries(record).reduce<Record<string, unknown>>((acc, [key, item]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (item && typeof item === 'object' && !Array.isArray(item)) {
      Object.assign(acc, flattenRecord(item, nextKey));
      return acc;
    }

    acc[nextKey] = item;
    return acc;
  }, {});
};

const getSimpleRows = (log: OperationLog): DiffRow[] | null => {
  const before = toRecord(log.before);
  const after = toRecord(log.after);

  if (log.action === 'admin.invite') {
    return [{ label: 'Invitation', before: null, after: 'Created' }];
  }

  if (log.action === 'lgu_request.delete') {
    return [{ label: 'LGU request', before: before.status || 'Existing', after: 'Deleted' }];
  }

  if (log.action === 'client_change_request.delete') {
    return [{ label: 'Client request', before: before.status || 'Existing', after: 'Deleted' }];
  }

  if (log.action === 'client.delete') {
    const rows: DiffRow[] = [{ label: 'Client record', before: before.status || 'Existing', after: 'Deleted' }];
    if (after.affectedAdmins) rows.push({ label: 'Affected admins', before: null, after: after.affectedAdmins });
    return rows;
  }

  if (log.action === 'admin.delete') {
    return [{ label: 'LGU admin', before: before.status || 'Existing', after: 'Deleted' }];
  }

  if (log.action === 'client_boundary.upload') {
    const beforeSettings = toRecord(before.mapSettings);
    const afterSettings = toRecord(after.mapSettings);
    return [
      {
        label: 'Boundary',
        before: beforeSettings.boundaryVerified ? 'Verified' : 'Not verified',
        after: afterSettings.boundaryVerified ? 'Verified' : 'Updated',
      },
      {
        label: 'Map bounds',
        before: beforeSettings.maxBounds ? 'Existing bounds' : 'None',
        after: afterSettings.maxBounds ? 'Recalculated' : 'None',
      },
      {
        label: 'Center',
        before:
          beforeSettings.centerLatitude && beforeSettings.centerLongitude
            ? `${beforeSettings.centerLatitude}, ${beforeSettings.centerLongitude}`
            : null,
        after:
          afterSettings.centerLatitude && afterSettings.centerLongitude
            ? `${afterSettings.centerLatitude}, ${afterSettings.centerLongitude}`
            : null,
      },
    ].filter(row => !areSame(row.before, row.after));
  }

  return null;
};

const TABLE_CONTEXT_KEYS = new Set([
  'actorEmail',
  'actorRole',
  'actorUid',
  'clientId',
  'clientName',
  'id',
  'lguName',
  'requestedByEmail',
  'requesterEmail',
  'targetId',
  'targetName',
  'type',
  'uid',
]);

const getRows = (log: OperationLog): DiffRow[] => {
  const simpleRows = getSimpleRows(log);
  if (simpleRows) return simpleRows;

  const before = flattenRecord(log.before || {});
  const after = flattenRecord(log.after || {});
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).filter(key => {
    const lastSegment = key.split('.').pop() || key;
    return !TABLE_CONTEXT_KEYS.has(key) && !TABLE_CONTEXT_KEYS.has(lastSegment);
  });

  return keys
    .map(key => ({ label: humanize(key), before: before[key], after: after[key] }))
    .filter(row => !areSame(row.before, row.after));
};

export const OperationLogDiff = ({ log }: { log: OperationLog }) => {
  const rows = getRows(log);

  if (rows.length === 0) {
    return <span className="text-sm text-default-400">No field changes recorded</span>;
  }

  return (
    <div className="max-h-48 min-w-[390px] max-w-2xl overflow-auto rounded-lg border border-default-200 bg-default-50 p-2">
      <div className="sticky top-0 z-10 grid grid-cols-[1fr_1.15fr_1.15fr] gap-2 bg-default-50 pb-2 text-[11px] font-semibold uppercase text-default-500">
        <span>Field</span>
        <span>Before</span>
        <span>After</span>
      </div>
      <div className="space-y-2">
        {rows.map(row => (
          <div key={row.label} className="grid grid-cols-[1fr_1.15fr_1.15fr] gap-2 text-xs">
            <span className="break-words font-semibold text-default-600">{row.label}</span>
            <span className="break-words rounded-md border border-danger-200/60 bg-danger-50 px-2 py-1 text-danger-700">
              {formatValue(row.before)}
            </span>
            <span className="break-words rounded-md border border-success-200/60 bg-success-50 px-2 py-1 text-success-700">
              {formatValue(row.after)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
