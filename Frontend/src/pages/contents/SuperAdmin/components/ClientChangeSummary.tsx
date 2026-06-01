import type { ClientChangeRequest } from '@/pages/contents/SuperAdmin/types';

type DiffRow = {
  label: string;
  current: unknown;
  proposed: unknown;
};

const toRecord = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {};

const getPathValue = (value: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((current, key) => (toRecord(current)[key] as unknown) ?? undefined, value);

const hasPathValue = (value: unknown, path: string): boolean => {
  let current = value;

  for (const key of path.split('.')) {
    const record = toRecord(current);
    if (!Object.prototype.hasOwnProperty.call(record, key)) return false;
    current = record[key];
  }

  return true;
};

const humanize = (value: string) =>
  value
    .replace(/\./g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, match => match.toUpperCase());

const formatDiffValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return 'None';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const areSame = (current: unknown, proposed: unknown) => formatDiffValue(current) === formatDiffValue(proposed);
const hasProposalValue = (value: unknown) => value !== null && value !== undefined && value !== '';

const makeRows = (
  current: unknown,
  proposed: unknown,
  fields: Array<{ path: string; label: string }>
): DiffRow[] =>
  fields
    .filter(field => hasPathValue(proposed, field.path))
    .map(field => ({
      label: field.label,
      current: getPathValue(current, field.path),
      proposed: getPathValue(proposed, field.path),
    }))
    .filter(row => hasProposalValue(row.proposed) && !areSame(row.current, row.proposed));

const flattenRecord = (value: unknown, prefix = ''): Record<string, unknown> => {
  const record = toRecord(value);

  return Object.entries(record).reduce<Record<string, unknown>>((acc, [key, item]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (key === 'geoJson' || key === 'geoJsonText') {
      acc[nextKey] = item ? 'GeoJSON boundary file' : null;
      return acc;
    }

    if (item && typeof item === 'object' && !Array.isArray(item)) {
      Object.assign(acc, flattenRecord(item, nextKey));
      return acc;
    }

    acc[nextKey] = item;
    return acc;
  }, {});
};

const enabledBarangayLabel = (barangays: unknown) => {
  if (!Array.isArray(barangays)) return 'None';
  const enabled = barangays.filter(item => toRecord(item).isActive !== false).length;
  return `${enabled} of ${barangays.length} enabled`;
};

const barangayRows = (current: unknown, proposed: unknown): DiffRow[] => {
  const currentBarangays: unknown[] = Array.isArray(toRecord(current).barangays) ? toRecord(current).barangays : [];
  const proposedBarangays: unknown[] = Array.isArray(toRecord(proposed).barangays)
    ? toRecord(proposed).barangays
    : [];
  const byKey = (item: unknown) => {
    const barangay = toRecord(item);
    return String(barangay.barangayCode || barangay.value || barangay.barangayLabel || '');
  };
  const currentMap = new Map<string, Record<string, any>>(currentBarangays.map(item => [byKey(item), toRecord(item)]));
  const proposedMap = new Map<string, Record<string, any>>(
    proposedBarangays.map(item => [byKey(item), toRecord(item)])
  );
  const keys = Array.from(new Set([...currentMap.keys(), ...proposedMap.keys()])).filter(Boolean);
  const changedBarangays = keys
    .map(key => {
      const currentBarangay = currentMap.get(key);
      const proposedBarangay = proposedMap.get(key);
      const label = proposedBarangay?.barangayLabel || currentBarangay?.barangayLabel || key;
      const currentStatus = currentBarangay ? (currentBarangay.isActive === false ? 'Disabled' : 'Enabled') : 'Missing';
      const proposedStatus = proposedBarangay ? (proposedBarangay.isActive === false ? 'Disabled' : 'Enabled') : 'Removed';
      return { label: `Barangay: ${label}`, current: currentStatus, proposed: proposedStatus };
    })
    .filter(row => !areSame(row.current, row.proposed));

  return [
    {
      label: 'Enabled barangays',
      current: enabledBarangayLabel(currentBarangays),
      proposed: enabledBarangayLabel(proposedBarangays),
    },
    ...changedBarangays,
  ].filter(row => !areSame(row.current, row.proposed));
};

const getDiffRows = (request: ClientChangeRequest): DiffRow[] => {
  const current = request.currentSnapshot || {};
  const proposed = request.proposedChanges || {};

  if (request.type === 'weather_coordinates') {
    return makeRows(current, proposed, [
      { path: 'weatherLocationKey', label: 'Center key' },
      { path: 'weatherLatitude', label: 'Center latitude' },
      { path: 'weatherLongitude', label: 'Center longitude' },
    ]);
  }

  if (request.type === 'map_settings') {
    return makeRows(current, proposed, [
      { path: 'mapSettings.centerLatitude', label: 'Center latitude' },
      { path: 'mapSettings.centerLongitude', label: 'Center longitude' },
      { path: 'mapSettings.minZoom', label: 'Minimum zoom' },
      { path: 'mapSettings.zoom', label: 'Default zoom' },
      { path: 'mapSettings.maxZoom', label: 'Maximum zoom' },
      { path: 'mapSettings.maxBounds.north', label: 'North bound' },
      { path: 'mapSettings.maxBounds.south', label: 'South bound' },
      { path: 'mapSettings.maxBounds.east', label: 'East bound' },
      { path: 'mapSettings.maxBounds.west', label: 'West bound' },
      { path: 'mapSettings.boundarySource', label: 'Boundary source' },
      { path: 'mapSettings.boundaryVerified', label: 'Boundary verified' },
    ]);
  }

  if (request.type === 'barangay_coverage') return barangayRows(current, proposed);

  if (request.type === 'client_info') {
    const currentFlat = flattenRecord(current);
    const proposedFlat = flattenRecord(proposed);
    const keys = Object.keys(proposedFlat);

    return keys
      .map(key => ({ label: humanize(key), current: currentFlat[key], proposed: proposedFlat[key] }))
      .filter(row => hasProposalValue(row.proposed) && !areSame(row.current, row.proposed));
  }

  if (request.type === 'admin_invite') return [{ label: 'LGU admin email', current: null, proposed: proposed.email }];

  if (request.type === 'boundary_update') {
    return [
      { label: 'Boundary source', current: getPathValue(current, 'source'), proposed: proposed.source },
      {
        label: 'Boundary GeoJSON',
        current: getPathValue(current, 'geoJson') || getPathValue(current, 'geoJsonText') ? 'Existing boundary file' : null,
        proposed: proposed.geoJson || proposed.geoJsonText ? 'Proposed boundary file' : null,
      },
    ].filter(row => hasProposalValue(row.proposed) && !areSame(row.current, row.proposed));
  }

  const currentFlat = flattenRecord(current);
  const proposedFlat = flattenRecord(proposed);
  const keys = Object.keys(proposedFlat);
  return keys
    .map(key => ({ label: humanize(key), current: currentFlat[key], proposed: proposedFlat[key] }))
    .filter(row => hasProposalValue(row.proposed) && !areSame(row.current, row.proposed));
};

export const ClientChangeSummary = ({ request }: { request: ClientChangeRequest }) => {
  const rows = getDiffRows(request);

  if (rows.length === 0) {
    return <span className="text-sm text-default-400">No visible changes</span>;
  }

  return (
    <div className="max-h-44 min-w-[360px] max-w-xl overflow-auto rounded-lg border border-default-200 bg-default-50 p-2">
      <div className="sticky top-0 z-10 grid grid-cols-[1fr_1.1fr_1.1fr] gap-2 bg-default-50 pb-2 text-[11px] font-semibold uppercase text-default-500">
        <span>Field</span>
        <span>Current</span>
        <span>Proposed</span>
      </div>
      <div className="space-y-2">
        {rows.map(row => (
          <div key={row.label} className="grid grid-cols-[1fr_1.1fr_1.1fr] gap-2 text-xs">
            <span className="break-words font-semibold text-default-600">{row.label}</span>
            <span className="break-words rounded-md border border-danger-200/60 bg-danger-50 px-2 py-1 text-danger-700">
              {formatDiffValue(row.current)}
            </span>
            <span className="break-words rounded-md border border-success-200/60 bg-success-50 px-2 py-1 text-success-700">
              {formatDiffValue(row.proposed)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
