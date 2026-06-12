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
  DangerZoneGeometryType,
  DangerZoneRecord,
  DangerZoneSeverity,
  DangerZoneStatus,
} from '@/types/dangerZone';
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
import { Check, CircleAlert, Eye, MapPin, Plus, X } from 'lucide-react';
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

type CreateFormState = {
  type: string;
  severity: DangerZoneSeverity;
  description: string;
  geometryType: DangerZoneGeometryType;
  center: { lat: number; lng: number } | null;
  radiusMeters: number;
};

const defaultCreateForm: CreateFormState = {
  type: 'flooded_road',
  severity: 'medium',
  description: '',
  geometryType: 'point',
  center: null,
  radiusMeters: 100,
};

const DangerZonesPage = () => {
  const userData = useAuth(state => state.userData);
  const mapCenter = getClientMapCenter(userData);
  const mapZoom = getClientMapZoomSettings(userData);
  const maxBounds = getClientConfiguredMapBounds(userData);

  const { zones, reports, isLoading, isMutating, error, fetchReports, fetchZones, createOfficialZone, verifyReport, rejectReport, resolveZone } =
    useDangerZoneStore();

  const [statusFilter, setStatusFilter] = useState<DangerZoneStatus | 'all'>('all');
  const [selectedZone, setSelectedZone] = useState<DangerZoneRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(defaultCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
    fetchZones();
  }, [fetchReports, fetchZones]);

  const filteredZones = useMemo(
    () => zones.filter(zone => statusFilter === 'all' || zone.status === statusFilter),
    [statusFilter, zones]
  );

  const pendingCount = reports.filter(report => report.status === 'pending').length;

  const resetCreateForm = () => {
    setCreateForm(defaultCreateForm);
    setCreateError(null);
  };

  const updateCreateForm = <K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) => {
    setCreateForm(prev => ({ ...prev, [key]: value }));
  };

  const handleCreateOfficial = async () => {
    setCreateError(null);

    if (!createForm.center) {
      setCreateError('Select a location on the map or enter coordinates.');
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

    const payload: DangerZoneCreateOfficialPayload = {
      type: createForm.type,
      severity: createForm.severity,
      description: createForm.description.trim(),
      geometryType: createForm.geometryType,
      center: createForm.center,
      radiusMeters: createForm.geometryType === 'circle' ? createForm.radiusMeters : undefined,
    };

    await createOfficialZone(payload);
    setActionMessage('Official danger zone created.');
    setIsCreateOpen(false);
    resetCreateForm();
  };

  const runAction = async (action: () => Promise<DangerZoneRecord>, message: string) => {
    await action();
    setActionMessage(message);
    setSelectedZone(null);
    setRejectionReason('');
  };

  return (
    <div className="flex h-full w-full flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Danger Zones</h1>
          <p className="mt-1 text-sm text-default-500">
            Review resident reports and create official Point or Circle danger zones.
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
        <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.9fr_0.5fr] gap-3 border-b border-default-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-default-500">
          <span>Type</span>
          <span>Source</span>
          <span>Status</span>
          <span>Severity</span>
          <span>Created</span>
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
                className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.9fr_0.5fr] items-center gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{formatLabel(zone.type)}</div>
                  <div className="truncate text-xs text-default-500">
                    {zone.geometryType === 'circle' ? `Circle, ${zone.radiusMeters ?? 0}m` : 'Point'}
                  </div>
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
                          <div>{selectedZone.geometryType === 'circle' ? `Circle (${selectedZone.radiusMeters ?? 0}m)` : 'Point'}</div>
                        </div>
                        <div>
                          <div className="text-default-500">Created</div>
                          <div>{formatDate(selectedZone.createdAt)}</div>
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
                        <Textarea
                          label="Rejection reason"
                          labelPlacement="outside"
                          placeholder="Required only when rejecting this report"
                          value={rejectionReason}
                          onValueChange={setRejectionReason}
                        />
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
                        onPress={() => runAction(() => verifyReport(selectedZone.id), 'Report verified.')}
                      >
                        Verify
                      </Button>
                    </>
                  )}
                  {selectedZone.status === 'verified' && selectedZone.isActive && (
                    <Button
                      color="primary"
                      variant="flat"
                      isLoading={isMutating}
                      onPress={() => runAction(() => resolveZone(selectedZone.id), 'Danger zone resolved.')}
                    >
                      Mark Resolved
                    </Button>
                  )}
                </ModalFooter>
              </>
            ) : null
          }
        </ModalContent>
      </Modal>

      <Modal isOpen={isCreateOpen} onOpenChange={open => (!open ? setIsCreateOpen(false) : setIsCreateOpen(true))} size="4xl" scrollBehavior="inside">
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">Create Official Danger Zone</ModalHeader>
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
                      onChange={event => updateCreateForm('geometryType', event.target.value as DangerZoneGeometryType)}
                    >
                      <SelectItem key="point">Point</SelectItem>
                      <SelectItem key="circle">Circle</SelectItem>
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
                    <Textarea
                      label="Description"
                      labelPlacement="outside"
                      placeholder="Describe the affected area"
                      value={createForm.description}
                      onValueChange={value => updateCreateForm('description', value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-default-500">
                      <MapPin size={16} />
                      Click the map to set the danger-zone center.
                    </div>
                    <AdminDangerZoneMap
                      center={mapCenter}
                      zoom={mapZoom.zoom}
                      minZoom={mapZoom.minZoom}
                      maxZoom={mapZoom.maxZoom}
                      maxBounds={maxBounds}
                      pickedCenter={createForm.center}
                      pickedRadiusMeters={createForm.geometryType === 'circle' ? createForm.radiusMeters : 0}
                      onPickCenter={center => updateCreateForm('center', center)}
                      height="430px"
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" isLoading={isMutating} onPress={handleCreateOfficial}>
                  Create Official
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
