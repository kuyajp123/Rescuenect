import { AdminDangerZoneMap } from '@/components/ui/Map/AdminDangerZoneMap';
import {
  getClientConfiguredMapBounds,
  getClientMapCenter,
  getClientMapZoomSettings,
} from '@/helper/clientMapScope';
import { useAuth } from '@/stores/useAuth';
import { useDangerZoneStore } from '@/stores/useDangerZoneStore';
import {
  DangerZoneCreateOfficialPayload,
  DangerZoneGeoJson,
  DangerZoneGeometryType,
  DangerZoneRecord,
  DangerZoneSeverity,
  DangerZoneStatus,
} from '@/types/dangerZone';
import { getDangerZoneCoordinateCount, normalizeDangerZoneGeoJson } from '@/utils/dangerZoneGeometry';
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Textarea,
} from '@heroui/react';
import { CalendarClock, Check, CircleAlert, Eye, History, MapPin, Pencil, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const STATUS_OPTIONS: Array<{ key: DangerZoneStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'expired', label: 'Expired' },
];

const DANGER_TYPES = [
  { key: 'flooded_road', label: 'Flooded Road' },
  { key: 'road_blockage', label: 'Road Blockage' },
  { key: 'heavy_traffic', label: 'Heavy Traffic' },
  { key: 'landslide_or_debris', label: 'Landslide / Debris' },
  { key: 'bridge_damage', label: 'Bridge Damage' },
  { key: 'fire', label: 'Fire' },
  { key: 'accident', label: 'Accident' },
  { key: 'unsafe_area', label: 'Unsafe Area' },
  { key: 'power_line_hazard', label: 'Power Line Hazard' },
  { key: 'other', label: 'Other' },
];

const SEVERITIES: Array<{ key: DangerZoneSeverity; label: string }> = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
  { key: 'critical', label: 'Critical' },
];

const statusColor = (status: DangerZoneStatus): 'warning' | 'success' | 'danger' | 'default' | 'primary' => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'verified':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'resolved':
      return 'primary';
    default:
      return 'default';
  }
};

const severityColor = (severity: DangerZoneSeverity): 'success' | 'warning' | 'danger' | 'default' => {
  switch (severity) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
    case 'critical':
      return 'danger';
    default:
      return 'default';
  }
};

const formatLabel = (value: string) =>
  value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatDate = (value: unknown) => {
  if (!value) return 'No date';
  const timestamp = value as { _seconds?: number; seconds?: number; toDate?: () => Date };
  const date =
    typeof timestamp.toDate === 'function'
      ? timestamp.toDate()
      : typeof timestamp._seconds === 'number'
        ? new Date(timestamp._seconds * 1000)
        : typeof timestamp.seconds === 'number'
          ? new Date(timestamp.seconds * 1000)
          : typeof value === 'string' || typeof value === 'number'
            ? new Date(value)
            : null;

  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : 'No date';
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  const timestamp = value as { _seconds?: number; seconds?: number; toDate?: () => Date };
  const date =
    typeof timestamp.toDate === 'function'
      ? timestamp.toDate()
      : typeof timestamp._seconds === 'number'
        ? new Date(timestamp._seconds * 1000)
        : typeof timestamp.seconds === 'number'
          ? new Date(timestamp.seconds * 1000)
          : typeof value === 'string' || typeof value === 'number'
            ? new Date(value)
            : null;

  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const toLocalDateTimeInputValue = (date: Date): string => {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const expiryToInputValue = (value: unknown): string | null => {
  const date = toDate(value);
  return date ? toLocalDateTimeInputValue(date) : null;
};

const addExpiryHours = (hours: number): string => toLocalDateTimeInputValue(new Date(Date.now() + hours * 60 * 60 * 1000));

const formatExpiry = (zone: Pick<DangerZoneRecord, 'expiresAt' | 'expiredAt' | 'status'>): string => {
  if (zone.status === 'expired') {
    return `Expired ${formatDate(zone.expiredAt ?? zone.expiresAt)}`;
  }
  return zone.expiresAt ? `Until ${formatDate(zone.expiresAt)}` : 'No expiry';
};

const formatAuditAction = (action: string): string =>
  action
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatAuditChanges = (changes?: Record<string, unknown>): string | null => {
  const fields = Array.isArray(changes?.fields) ? changes.fields.filter(field => typeof field === 'string') : [];
  return fields.length ? `Changed: ${fields.join(', ')}` : null;
};

type CreateFormState = {
  type: string;
  severity: DangerZoneSeverity;
  description: string;
  geometryType: DangerZoneGeometryType;
  center: { lat: number; lng: number } | null;
  radiusMeters: number;
  geojson: DangerZoneGeoJson | null;
  affectedWidthMeters: number;
  expiresAt: string | null;
};

const defaultCreateForm: CreateFormState = {
  type: 'flooded_road',
  severity: 'medium',
  description: '',
  geometryType: 'point',
  center: null,
  radiusMeters: 100,
  geojson: null,
  affectedWidthMeters: 30,
  expiresAt: null,
};

const getGeometrySummary = (zone: Pick<DangerZoneRecord, 'geometryType' | 'radiusMeters' | 'affectedWidthMeters' | 'geojson'>) => {
  switch (zone.geometryType) {
    case 'circle':
      return `Circle, ${zone.radiusMeters ?? 0}m`;
    case 'line':
      return `Line, ${getDangerZoneCoordinateCount(zone.geojson)} points`;
    case 'polygon':
      return `Polygon, ${getDangerZoneCoordinateCount(zone.geojson)} points`;
    default:
      return 'Point';
  }
};

const zoneToCreateForm = (zone: DangerZoneRecord): CreateFormState => ({
  type: zone.type,
  severity: zone.severity,
  description: zone.description,
  geometryType: zone.geometryType,
  center: zone.center ?? null,
  radiusMeters: zone.radiusMeters ?? 100,
  geojson: normalizeDangerZoneGeoJson(zone.geojson),
  affectedWidthMeters: zone.affectedWidthMeters ?? 30,
  expiresAt: expiryToInputValue(zone.expiresAt),
});

const EXPIRY_PRESETS = [
  { label: '6 hours', hours: 6 },
  { label: '12 hours', hours: 12 },
  { label: '24 hours', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '7 days', hours: 168 },
];

const ExpiryControls = ({
  value,
  onChange,
  label = 'Expiry',
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
}) => (
  <div className="space-y-2 rounded-md border border-default-200 p-3">
    <div className="flex items-center gap-2 text-sm font-medium text-default-700">
      <CalendarClock size={16} />
      {label}
    </div>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant={!value ? 'solid' : 'flat'} color={!value ? 'primary' : 'default'} onPress={() => onChange(null)}>
        No expiry
      </Button>
      {EXPIRY_PRESETS.map(preset => (
        <Button key={preset.label} size="sm" variant="flat" onPress={() => onChange(addExpiryHours(preset.hours))}>
          {preset.label}
        </Button>
      ))}
    </div>
    <Input
      label="Custom date and time"
      labelPlacement="outside"
      type="datetime-local"
      value={value ?? ''}
      min={toLocalDateTimeInputValue(new Date(Date.now() + 60 * 1000))}
      onValueChange={nextValue => onChange(nextValue || null)}
    />
    <p className="text-xs text-default-500">
      Zones with no expiry stay active until an LGU admin marks them resolved.
    </p>
  </div>
);

const DangerZonesPage = () => {
  const userData = useAuth(state => state.userData);
  const mapCenter = getClientMapCenter(userData);
  const mapZoom = getClientMapZoomSettings(userData);
  const maxBounds = getClientConfiguredMapBounds(userData);

  const { zones, reports, isLoading, isMutating, error, fetchReports, fetchZones, createOfficialZone, verifyReport, rejectReport, updateZone, resolveZone } =
    useDangerZoneStore();

  const [statusFilter, setStatusFilter] = useState<DangerZoneStatus | 'all'>('all');
  const [selectedZone, setSelectedZone] = useState<DangerZoneRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(defaultCreateForm);
  const [editingZone, setEditingZone] = useState<DangerZoneRecord | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [verifyExpiresAt, setVerifyExpiresAt] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
    fetchZones();
  }, [fetchReports, fetchZones]);

  useEffect(() => {
    if (!selectedZone || selectedZone.status !== 'pending') {
      setVerifyExpiresAt(null);
    }
  }, [selectedZone]);

  const filteredZones = useMemo(
    () => zones.filter(zone => statusFilter === 'all' || zone.status === statusFilter),
    [statusFilter, zones]
  );

  const pendingCount = reports.filter(report => report.status === 'pending').length;

  const resetCreateForm = () => {
    setCreateForm(defaultCreateForm);
    setEditingZone(null);
    setCreateError(null);
  };

  const handleCreateModalOpenChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) resetCreateForm();
  };

  const updateCreateForm = <K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) => {
    setCreateForm(prev => ({ ...prev, [key]: value }));
  };

  const handleGeometryTypeChange = (geometryType: DangerZoneGeometryType) => {
    setCreateForm(prev => ({
      ...prev,
      geometryType,
      center: geometryType === 'line' || geometryType === 'polygon' ? null : prev.center,
      radiusMeters: geometryType === 'circle' ? prev.radiusMeters || 100 : 100,
      geojson: prev.geojson?.type === 'LineString' && geometryType === 'line'
        ? prev.geojson
        : prev.geojson?.type === 'Polygon' && geometryType === 'polygon'
          ? prev.geojson
          : null,
      affectedWidthMeters: geometryType === 'line' ? prev.affectedWidthMeters || 30 : 30,
    }));
  };

  const handleSaveOfficial = async () => {
    setCreateError(null);

    if ((createForm.geometryType === 'point' || createForm.geometryType === 'circle') && !createForm.center) {
      setCreateError('Draw a marker/circle on the map or enter coordinates.');
      return;
    }
    if (!createForm.description.trim()) {
      setCreateError('Description is required.');
      return;
    }
    if (createForm.geometryType === 'circle' && (!createForm.radiusMeters || createForm.radiusMeters <= 0)) {
      setCreateError('Circle radius must be greater than 0.');
      return;
    }
    if ((createForm.geometryType === 'line' || createForm.geometryType === 'polygon') && !createForm.geojson) {
      setCreateError(`Draw a ${createForm.geometryType === 'line' ? 'road segment' : 'polygon'} on the map.`);
      return;
    }

    const payload: DangerZoneCreateOfficialPayload = {
      type: createForm.type,
      severity: createForm.severity,
      description: createForm.description.trim(),
      geometryType: createForm.geometryType,
      center: createForm.center ?? null,
      radiusMeters: createForm.geometryType === 'circle' ? createForm.radiusMeters : undefined,
      geojson: createForm.geometryType === 'line' || createForm.geometryType === 'polygon' ? createForm.geojson : null,
      affectedWidthMeters: createForm.geometryType === 'line' ? createForm.affectedWidthMeters : null,
      expiresAt: createForm.expiresAt,
    };

    if (editingZone) {
      await updateZone(editingZone.id, payload);
      setActionMessage('Danger zone updated.');
    } else {
      await createOfficialZone(payload);
      setActionMessage('Official danger zone created.');
    }

    setIsCreateOpen(false);
    resetCreateForm();
  };

  const runAction = async (action: () => Promise<DangerZoneRecord>, message: string) => {
    await action();
    setActionMessage(message);
    setSelectedZone(null);
    setRejectionReason('');
    setVerifyExpiresAt(null);
  };

  const openEditModal = (zone: DangerZoneRecord) => {
    setCreateError(null);
    setEditingZone(zone);
    setCreateForm(zoneToCreateForm(zone));
    setSelectedZone(null);
    setIsCreateOpen(true);
  };

  return (
    <div className="flex h-full w-full flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Danger Zones</h1>
          <p className="mt-1 text-sm text-default-500">
            Review resident reports and create official Point, Circle, Line, or Polygon danger zones.
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={18} />}
          onPress={() => {
            resetCreateForm();
            setIsCreateOpen(true);
          }}
        >
          Create Official
        </Button>
      </div>

      {(error || actionMessage) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            error
              ? 'border-danger-200 bg-danger-50 text-danger-700'
              : 'border-success-200 bg-success-50 text-success-700'
          }`}
        >
          {error || actionMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-default-200 bg-content1 p-4">
          <div className="text-sm text-default-500">Pending reports</div>
          <div className="mt-2 text-3xl font-semibold">{pendingCount}</div>
        </div>
        <div className="rounded-md border border-default-200 bg-content1 p-4">
          <div className="text-sm text-default-500">Verified active</div>
          <div className="mt-2 text-3xl font-semibold">
            {zones.filter(zone => zone.status === 'verified' && zone.isActive).length}
          </div>
        </div>
        <div className="rounded-md border border-default-200 bg-content1 p-4">
          <div className="text-sm text-default-500">All records</div>
          <div className="mt-2 text-3xl font-semibold">{zones.length}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map(option => (
          <Button
            key={option.key}
            size="sm"
            variant={statusFilter === option.key ? 'solid' : 'flat'}
            color={statusFilter === option.key ? 'primary' : 'default'}
            onPress={() => setStatusFilter(option.key)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="min-h-[360px] overflow-hidden rounded-md border border-default-200 bg-content1">
        <div className="grid grid-cols-[1.1fr_0.9fr_0.7fr_0.7fr_0.9fr_0.9fr_0.5fr] gap-3 border-b border-default-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-default-500">
          <span>Type</span>
          <span>Source</span>
          <span>Status</span>
          <span>Severity</span>
          <span>Created</span>
          <span>Expiry</span>
          <span className="text-right">Action</span>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner label="Loading danger zones..." />
          </div>
        ) : filteredZones.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-default-500">
            <CircleAlert size={32} />
            <p>No danger zones found for this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-default-100">
            {filteredZones.map(zone => (
              <div
                key={zone.id}
                className="grid grid-cols-[1.1fr_0.9fr_0.7fr_0.7fr_0.9fr_0.9fr_0.5fr] items-center gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{formatLabel(zone.type)}</div>
                  <div className="truncate text-xs text-default-500">{getGeometrySummary(zone)}</div>
                </div>
                <span className="text-default-600">
                  {zone.source === 'resident_report' ? zone.reporterName || 'Resident report' : 'LGU official'}
                </span>
                <Chip size="sm" color={statusColor(zone.status)} variant="flat">
                  {zone.status}
                </Chip>
                <Chip size="sm" color={severityColor(zone.severity)} variant="flat">
                  {zone.severity}
                </Chip>
                <span className="text-default-500">{formatDate(zone.createdAt)}</span>
                <span className="text-default-500">{formatExpiry(zone)}</span>
                <div className="flex justify-end">
                  <Button isIconOnly size="sm" variant="light" onPress={() => setSelectedZone(zone)}>
                    <Eye size={17} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={Boolean(selectedZone)} onOpenChange={open => !open && setSelectedZone(null)} size="4xl" scrollBehavior="inside">
        <ModalContent>
          {onClose =>
            selectedZone ? (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {formatLabel(selectedZone.type)}
                  <span className="text-sm font-normal text-default-500">
                    {selectedZone.source === 'resident_report' ? 'Resident report' : 'LGU official'}
                  </span>
                </ModalHeader>
                <ModalBody>
                  <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-default-500">Status</div>
                          <Chip size="sm" color={statusColor(selectedZone.status)} variant="flat">
                            {selectedZone.status}
                          </Chip>
                        </div>
                        <div>
                          <div className="text-default-500">Severity</div>
                          <Chip size="sm" color={severityColor(selectedZone.severity)} variant="flat">
                            {selectedZone.severity}
                          </Chip>
                        </div>
                        <div>
                          <div className="text-default-500">Geometry</div>
                          <div>{getGeometrySummary(selectedZone)}</div>
                        </div>
                        <div>
                          <div className="text-default-500">Created</div>
                          <div>{formatDate(selectedZone.createdAt)}</div>
                        </div>
                        <div>
                          <div className="text-default-500">Expiry</div>
                          <div>{formatExpiry(selectedZone)}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-default-500">Description</div>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{selectedZone.description}</p>
                      </div>

                      {selectedZone.rejectionReason && (
                        <div className="rounded-md border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
                          {selectedZone.rejectionReason}
                        </div>
                      )}

                      {selectedZone.photoUrls?.[0] && (
                        <div>
                          <div className="mb-2 text-sm text-default-500">Evidence photo</div>
                          <img
                            src={selectedZone.photoUrls[0]}
                            alt="Danger-zone evidence"
                            className="max-h-64 w-full rounded-md object-cover"
                          />
                        </div>
                      )}

                      {selectedZone.source === 'resident_report' && selectedZone.status === 'pending' && (
                        <>
                          <ExpiryControls
                            label="Expiry after verification"
                            value={verifyExpiresAt}
                            onChange={setVerifyExpiresAt}
                          />
                          <Textarea
                            label="Rejection reason"
                            labelPlacement="outside"
                            placeholder="Required only when rejecting this report"
                            value={rejectionReason}
                            onValueChange={setRejectionReason}
                          />
                        </>
                      )}

                      {selectedZone.auditTrail && selectedZone.auditTrail.length > 0 && (
                        <div className="rounded-md border border-default-200 p-3">
                          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-default-700">
                            <History size={16} />
                            Audit trail
                          </div>
                          <div className="space-y-3">
                            {selectedZone.auditTrail
                              .slice()
                              .reverse()
                              .map((entry, index) => (
                                <div key={`${entry.action}-${index}`} className="border-l-2 border-default-200 pl-3 text-sm">
                                  <div className="font-medium text-foreground">{formatAuditAction(entry.action)}</div>
                                  <div className="text-xs text-default-500">
                                    {formatDate(entry.at)} by {entry.actorRole.replace('_', ' ')}
                                  </div>
                                  {entry.note && <div className="mt-1 text-xs text-default-600">{entry.note}</div>}
                                  {formatAuditChanges(entry.changes) && (
                                    <div className="mt-1 text-xs text-default-500">{formatAuditChanges(entry.changes)}</div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <AdminDangerZoneMap
                      selectedZone={selectedZone}
                      center={mapCenter}
                      zoom={mapZoom.zoom}
                      minZoom={mapZoom.minZoom}
                      maxZoom={mapZoom.maxZoom}
                      maxBounds={maxBounds}
                      height="420px"
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    Close
                  </Button>
                  {selectedZone.source === 'resident_report' && selectedZone.status === 'pending' && (
                    <>
                      <Button
                        color="danger"
                        variant="flat"
                        startContent={<X size={16} />}
                        isLoading={isMutating}
                        onPress={() => runAction(() => rejectReport(selectedZone.id, rejectionReason), 'Report rejected.')}
                      >
                        Reject
                      </Button>
                      <Button
                        color="success"
                        startContent={<Check size={16} />}
                        isLoading={isMutating}
                        onPress={() => runAction(() => verifyReport(selectedZone.id, verifyExpiresAt), 'Report verified.')}
                      >
                        Verify
                      </Button>
                    </>
                  )}
                  {selectedZone.status === 'verified' && selectedZone.isActive && (
                    <>
                      <Button
                        color="warning"
                        variant="flat"
                        startContent={<Pencil size={16} />}
                        onPress={() => openEditModal(selectedZone)}
                      >
                        Edit
                      </Button>
                      <Button
                        color="primary"
                        variant="flat"
                        isLoading={isMutating}
                        onPress={() => runAction(() => resolveZone(selectedZone.id), 'Danger zone resolved.')}
                      >
                        Mark Resolved
                      </Button>
                    </>
                  )}
                </ModalFooter>
              </>
            ) : null
          }
        </ModalContent>
      </Modal>

      <Modal isOpen={isCreateOpen} onOpenChange={handleCreateModalOpenChange} size="4xl" scrollBehavior="inside">
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {editingZone ? 'Edit Danger Zone' : 'Create Official Danger Zone'}
              </ModalHeader>
              <ModalBody>
                {createError && (
                  <div className="rounded-md border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                    {createError}
                  </div>
                )}
                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-4">
                    <Select
                      label="Danger type"
                      labelPlacement="outside"
                      selectedKeys={[createForm.type]}
                      onChange={event => updateCreateForm('type', event.target.value)}
                    >
                      {DANGER_TYPES.map(type => (
                        <SelectItem key={type.key}>{type.label}</SelectItem>
                      ))}
                    </Select>
                    <Select
                      label="Severity"
                      labelPlacement="outside"
                      selectedKeys={[createForm.severity]}
                      onChange={event => updateCreateForm('severity', event.target.value as DangerZoneSeverity)}
                    >
                      {SEVERITIES.map(severity => (
                        <SelectItem key={severity.key}>{severity.label}</SelectItem>
                      ))}
                    </Select>
                    <Select
                      label="Geometry"
                      labelPlacement="outside"
                      selectedKeys={[createForm.geometryType]}
                      onChange={event => handleGeometryTypeChange(event.target.value as DangerZoneGeometryType)}
                    >
                      <SelectItem key="point">Point</SelectItem>
                      <SelectItem key="circle">Circle</SelectItem>
                      <SelectItem key="line">Line / Road Segment</SelectItem>
                      <SelectItem key="polygon">Polygon / Custom Area</SelectItem>
                    </Select>
                    {createForm.geometryType === 'circle' && (
                      <Input
                        label="Radius in meters"
                        labelPlacement="outside"
                        type="number"
                        min={1}
                        value={String(createForm.radiusMeters)}
                        onValueChange={value => updateCreateForm('radiusMeters', Number(value) || 0)}
                      />
                    )}
                    {createForm.geometryType === 'line' && (
                      <Input
                        label="Affected width in meters"
                        labelPlacement="outside"
                        type="number"
                        min={5}
                        max={100}
                        value={String(createForm.affectedWidthMeters)}
                        onValueChange={value => updateCreateForm('affectedWidthMeters', Number(value) || 30)}
                      />
                    )}
                    {(createForm.geometryType === 'point' || createForm.geometryType === 'circle') && (
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Latitude"
                          labelPlacement="outside"
                          type="number"
                          value={createForm.center ? String(createForm.center.lat) : ''}
                          onValueChange={value =>
                            updateCreateForm('center', {
                              lat: Number(value),
                              lng: createForm.center?.lng ?? mapCenter[1],
                            })
                          }
                        />
                        <Input
                          label="Longitude"
                          labelPlacement="outside"
                          type="number"
                          value={createForm.center ? String(createForm.center.lng) : ''}
                          onValueChange={value =>
                            updateCreateForm('center', {
                              lat: createForm.center?.lat ?? mapCenter[0],
                              lng: Number(value),
                            })
                          }
                        />
                      </div>
                    )}
                    <Textarea
                      label="Description"
                      labelPlacement="outside"
                      placeholder="Describe the affected area"
                      value={createForm.description}
                      onValueChange={value => updateCreateForm('description', value)}
                    />
                    <ExpiryControls
                      label={editingZone ? 'Expiry' : 'Optional expiry'}
                      value={createForm.expiresAt}
                      onChange={value => updateCreateForm('expiresAt', value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-default-500">
                      <MapPin size={16} />
                      Use the map drawing toolbar for {createForm.geometryType === 'line' ? 'a road segment' : createForm.geometryType === 'polygon' ? 'a custom area' : 'the selected shape'}.
                    </div>
                    <AdminDangerZoneMap
                      center={mapCenter}
                      zoom={mapZoom.zoom}
                      minZoom={mapZoom.minZoom}
                      maxZoom={mapZoom.maxZoom}
                      maxBounds={maxBounds}
                      pickedCenter={createForm.center}
                      pickedGeometryType={createForm.geometryType}
                      pickedRadiusMeters={createForm.geometryType === 'circle' ? createForm.radiusMeters : 0}
                      pickedGeojson={createForm.geojson}
                      affectedWidthMeters={createForm.affectedWidthMeters}
                      enableDrawing
                      onDrawGeometry={geometry =>
                        setCreateForm(prev => ({
                          ...prev,
                          ...geometry,
                          center: geometry.center ?? null,
                          geojson: geometry.geojson ?? null,
                          radiusMeters: geometry.radiusMeters ?? prev.radiusMeters,
                          affectedWidthMeters: geometry.affectedWidthMeters ?? prev.affectedWidthMeters,
                        }))
                      }
                      height="430px"
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" isLoading={isMutating} onPress={handleSaveOfficial}>
                  {editingZone ? 'Save Changes' : 'Create Official'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DangerZonesPage;
