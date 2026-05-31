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

const firstPresent = (...values: unknown[]): unknown =>
  values.find(value => value !== undefined && value !== null && value !== '');

const toMillis = (value: unknown): number | null => {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }
  const record = toRecord(value);
  const seconds = record.seconds ?? record._seconds;
  if (typeof seconds === 'number') return seconds * 1000;
  return null;
};

const formatDateValue = (value: unknown): unknown => {
  const millis = toMillis(value);
  if (!millis) return value;
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(millis));
};

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

const COUNT_LABELS: Record<string, string> = {
  residents: 'residents',
  lguAdmins: 'LGU admins',
  adminInvitations: 'admin invites',
  statuses: 'status records',
  evacuationCenters: 'evacuation centers',
  announcements: 'announcements',
  contacts: 'contacts',
  notifications: 'notifications',
  clientBoundaries: 'boundaries',
  clientChangeRequests: 'change requests',
  lguRequests: 'LGU requests',
  clientArchive: 'archive snapshots',
  clientRecord: 'client records',
  operationalRecords: 'operational records',
};

const summarizeCounts = (value: unknown, emptyLabel = 'No affected records'): string => {
  const record = toRecord(value);
  const parts = Object.entries(COUNT_LABELS)
    .map(([key, label]) => [label, Number(record[key] ?? 0)] as const)
    .filter(([, count]) => Number.isFinite(count) && count > 0)
    .map(([label, count]) => `${count} ${label}`);

  return parts.length > 0 ? parts.join(', ') : emptyLabel;
};

const summarizeJobs = (jobsValue: unknown): string => {
  if (!Array.isArray(jobsValue) || jobsValue.length === 0) return 'No due jobs';
  const names = jobsValue.slice(0, 3).map(job => {
    const record = toRecord(job);
    const name = record.clientName || record.clientId || record.id || 'Client';
    return record.status ? `${name} (${record.status})` : String(name);
  });
  return jobsValue.length > names.length ? `${names.join(', ')} +${jobsValue.length - names.length} more` : names.join(', ');
};

const summarizeJobProgress = (jobsValue: unknown): string => {
  if (!Array.isArray(jobsValue) || jobsValue.length === 0) return 'No cleanup records';
  const totals = jobsValue.reduce<Record<string, number>>((acc, job) => {
    const progress = toRecord(toRecord(job).progress);
    Object.keys(COUNT_LABELS).forEach(key => {
      const count = Number(progress[key] ?? 0);
      if (Number.isFinite(count) && count > 0) acc[key] = (acc[key] || 0) + count;
    });
    return acc;
  }, {});
  return summarizeCounts(totals, 'No cleanup records');
};

const getClientDeletionRows = (log: OperationLog, before: Record<string, any>, after: Record<string, any>): DiffRow[] | null => {
  if (log.action === 'client.schedule_deletion') {
    const afterClient = Object.keys(toRecord(after.client)).length ? toRecord(after.client) : after;
    const job = toRecord(after.job);
    const preview = toRecord(after.preview);
    const dependencies = firstPresent(preview.dependencies, after.dependencies, after.affectedRecords);

    return [
      { label: 'Status', before: before.status || null, after: firstPresent(afterClient.status, 'deletion_scheduled') },
      {
        label: 'Effective date',
        before: null,
        after: formatDateValue(firstPresent(afterClient.deletionEffectiveAt, job.deletionEffectiveAt)),
      },
      { label: 'Reason', before: null, after: firstPresent(afterClient.deletionReason, job.deletionReason, after.reason) },
      { label: 'Affected data', before: null, after: summarizeCounts(dependencies) },
    ].filter(row => row.after !== undefined && !areSame(row.before, row.after));
  }

  if (log.action === 'client.cancel_deletion') {
    const afterClient = Object.keys(toRecord(after.client)).length ? toRecord(after.client) : after;
    const job = toRecord(after.job);

    return [
      { label: 'Status', before: before.status || 'deletion_scheduled', after: firstPresent(afterClient.status, 'inactive') },
      {
        label: 'Effective date',
        before: formatDateValue(before.deletionEffectiveAt),
        after: null,
      },
      { label: 'Job status', before: 'scheduled', after: firstPresent(job.status, after.jobStatus, 'cancelled') },
    ].filter(row => !areSame(row.before, row.after));
  }

  if (log.action === 'client_deletion.process_due_jobs' || log.action === 'client_deletion.edge_process_due_jobs') {
    return [
      { label: 'Processed jobs', before: null, after: firstPresent(after.processed, 0) },
      { label: 'Completed', before: null, after: firstPresent(after.completed, 0) },
      { label: 'Failed', before: null, after: firstPresent(after.failed, 0) },
      { label: 'Remaining due', before: null, after: after.remainingDue },
      { label: 'Clients', before: null, after: summarizeJobs(after.jobs) },
      { label: 'Cleanup summary', before: null, after: summarizeJobProgress(after.jobs) },
    ].filter(row => row.after !== undefined && !areSame(row.before, row.after));
  }

  if (log.action === 'client_archive.permanent_delete') {
    const counts = firstPresent(before.snapshotCounts, before.counts, before.cleanupProgress);

    return [
      { label: 'Archive', before: before.status || 'Archived', after: 'Permanently deleted' },
      { label: 'Captured data', before: summarizeCounts(counts, 'Archive snapshot'), after: 'Removed' },
      { label: 'Archived at', before: formatDateValue(before.archivedAt), after: null },
    ].filter(row => row.before !== undefined && !areSame(row.before, row.after));
  }

  return null;
};

const getSimpleRows = (log: OperationLog): DiffRow[] | null => {
  const before = toRecord(log.before);
  const after = toRecord(log.after);
  const clientDeletionRows = getClientDeletionRows(log, before, after);
  if (clientDeletionRows) return clientDeletionRows;

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
