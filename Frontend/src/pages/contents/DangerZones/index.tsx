import { CompactSummaryCards } from '@/components/DangerZones/CompactSummaryCards';
import { DetailsPanel, type CreateFormState, type DetailsPanelMode } from '@/components/DangerZones/DetailsPanel';
import { FiltersPanel, type ZoneFilterState } from '@/components/DangerZones/FiltersPanel';
import { MapErrorFallback } from '@/components/DangerZones/MapErrorFallback';
import { ThreeColumnLayout } from '@/components/DangerZones/ThreeColumnLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdminDangerZoneMap } from '@/components/ui/Map/AdminDangerZoneMap';
import {
  getClientConfiguredMapBounds,
  getClientMapCenter,
  getClientMapZoomSettings,
} from '@/helper/clientMapScope';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { usePanelState } from '@/hooks/usePanelState';
import { useAuth } from '@/stores/useAuth';
import { useDangerZoneStore } from '@/stores/useDangerZoneStore';
import {
  DangerZoneCreateOfficialPayload,
  DangerZoneConfidence,
  DangerZoneGeometryType,
  DangerZoneListFilters,
  DangerZoneRecord,
  DangerZoneSeverity,
  DangerZoneStatus,
} from '@/types/dangerZone';
import { getDangerZoneCoordinateCount, normalizeDangerZoneGeoJson } from '@/utils/dangerZoneGeometry';
import {
  Button,
  Chip,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
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
import { CalendarClock, Check, CircleAlert, Eye, Filter, History, List, Map as MapIcon, MapPin, Pencil, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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

const CONFIDENCE_OPTIONS: Array<{ key: DangerZoneConfidence; label: string }> = [
  { key: 'low', label: 'Low confidence' },
  { key: 'medium', label: 'Medium confidence' },
  { key: 'high', label: 'High confidence' },
];

const DEFAULT_ZONE_PAGE_SIZE = 500;

type DangerZoneViewMode = 'map' | 'table';

const DEFAULT_ZONE_FILTERS: ZoneFilterState = {
  status: 'all',
  severity: 'all',
  geometryType: 'all',
  source: 'all',
  search: '',
};

const toZoneListFilters = (
  filters: ZoneFilterState,
  extra: Pick<DangerZoneListFilters, 'cursor' | 'pageSize'> = {}
): DangerZoneListFilters => ({
  status: filters.status,
  severity: filters.severity,
  geometryType: filters.geometryType,
  source: filters.source,
  search: filters.search.trim(),
  pageSize: extra.pageSize ?? DEFAULT_ZONE_PAGE_SIZE,
  cursor: extra.cursor,
});

const areZoneFiltersEqual = (left: ZoneFilterState, right: ZoneFilterState): boolean =>
  left.status === right.status &&
  left.severity === right.severity &&
  left.geometryType === right.geometryType &&
  left.source === right.source &&
  left.search.trim() === right.search.trim();

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
  confidence: 'high',
  verificationNotes: '',
  affectedBarangaysText: '',
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

const parseBarangays = (value: string): string[] =>
  value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

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
  confidence: zone.confidence ?? 'medium',
  verificationNotes: zone.verificationNotes ?? '',
  affectedBarangaysText: zone.affectedBarangays?.join(', ') ?? '',
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

  const {
    zones,
    reports,
    zonePagination,
    analytics,
    routingOperations,
    isLoading,
    isMutating,
    error,
    fetchReports,
    fetchZones,
    fetchAnalytics,
    fetchRoutingOperations,
    createOfficialZone,
    verifyReport,
    rejectReport,
    updateZone,
    resolveZone,
  } =
    useDangerZoneStore();

  // Panel collapse state management with sessionStorage persistence
  const [isDetailsPanelCollapsed, toggleDetailsPanel] = usePanelState('danger-zones-details-panel-collapsed', false);
  const [isFiltersPanelCollapsed, toggleFiltersPanel] = usePanelState('danger-zones-filters-panel-collapsed', false);

  // Mobile detection
  const isMobile = useIsMobile();

  // Mobile overlay state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);

  // Map resize trigger - changes when panels collapse/expand to trigger Leaflet invalidateSize()
  const [mapResizeTrigger, setMapResizeTrigger] = useState<number>(0);

  const [draftFilters, setDraftFilters] = useState<ZoneFilterState>(DEFAULT_ZONE_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ZoneFilterState>(DEFAULT_ZONE_FILTERS);
  const [viewMode, setViewMode] = useState<DangerZoneViewMode>('map');
  const [mapSelectedZone, setMapSelectedZone] = useState<DangerZoneRecord | null>(null);
  const [isMapCreateMode, setIsMapCreateMode] = useState(false);
  const [hideMapZonesForCreate, setHideMapZonesForCreate] = useState(false);
  const [selectedZone, setSelectedZone] = useState<DangerZoneRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(defaultCreateForm);
  const [editingZone, setEditingZone] = useState<DangerZoneRecord | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [verifyExpiresAt, setVerifyExpiresAt] = useState<string | null>(null);
  const [verifyConfidence, setVerifyConfidence] = useState<DangerZoneConfidence>('medium');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyBarangays, setVerifyBarangays] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const hasFilterChanges = !areZoneFiltersEqual(draftFilters, appliedFilters);
  const hasCustomFilters =
    !areZoneFiltersEqual(draftFilters, DEFAULT_ZONE_FILTERS) ||
    !areZoneFiltersEqual(appliedFilters, DEFAULT_ZONE_FILTERS);

  const fetchAppliedZones = useCallback(
    (extra?: Pick<DangerZoneListFilters, 'cursor' | 'pageSize'>) =>
      fetchZones(toZoneListFilters(appliedFilters, extra)),
    [appliedFilters, fetchZones]
  );

  const refreshPageData = useCallback(
    async (includeReports = false) => {
      await Promise.all([
        includeReports ? fetchReports() : Promise.resolve(),
        fetchAppliedZones(),
        fetchAnalytics(),
        fetchRoutingOperations(),
      ]);
    },
    [fetchAnalytics, fetchAppliedZones, fetchReports, fetchRoutingOperations]
  );

  useEffect(() => {
    fetchReports();
    fetchAnalytics();
    fetchRoutingOperations();
  }, [fetchAnalytics, fetchReports, fetchRoutingOperations]);

  useEffect(() => {
    fetchAppliedZones();
  }, [fetchAppliedZones]);

  useEffect(() => {
    if (mapSelectedZone && !zones.some(zone => zone.id === mapSelectedZone.id)) {
      setMapSelectedZone(null);
    }
  }, [mapSelectedZone, zones]);

  // Auto-expand DetailsPanel when zone is selected and panel is collapsed
  useEffect(() => {
    if (mapSelectedZone && isDetailsPanelCollapsed) {
      toggleDetailsPanel();
    }
  }, [mapSelectedZone]); // Only depend on mapSelectedZone to avoid toggle loop

  // On mobile, open details overlay when zone is selected
  useEffect(() => {
    if (isMobile && mapSelectedZone) {
      setIsMobileDetailsOpen(true);
    }
  }, [isMobile, mapSelectedZone]);

  // On mobile, open details overlay when entering create mode
  useEffect(() => {
    if (isMobile && isMapCreateMode) {
      setIsMobileDetailsOpen(true);
    }
  }, [isMobile, isMapCreateMode]);

  // Keyboard navigation: Escape key to close mobile overlays
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isMobileFiltersOpen) {
          setIsMobileFiltersOpen(false);
        }
        if (isMobileDetailsOpen && !isMapCreateMode) {
          setIsMobileDetailsOpen(false);
          setMapSelectedZone(null);
        }
      }
    };

    if (isMobile && (isMobileFiltersOpen || isMobileDetailsOpen)) {
      window.addEventListener('keydown', handleEscapeKey);
      return () => window.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isMobile, isMobileFiltersOpen, isMobileDetailsOpen, isMapCreateMode]);

  // Trigger map resize when panels collapse/expand (debounced via MapResizeHandler component)
  useEffect(() => {
    // Increment trigger to notify map component of layout change
    setMapResizeTrigger(prev => prev + 1);
  }, [isDetailsPanelCollapsed, isFiltersPanelCollapsed]);

  useEffect(() => {
    if (!selectedZone || selectedZone.status !== 'pending') {
      setVerifyExpiresAt(null);
      setVerifyConfidence('medium');
      setVerifyNotes('');
      setVerifyBarangays('');
    } else {
      setVerifyConfidence(selectedZone.confidence ?? 'medium');
      setVerifyNotes(selectedZone.verificationNotes ?? '');
      setVerifyBarangays(selectedZone.affectedBarangays?.join(', ') ?? '');
    }
  }, [selectedZone]);

  const pendingCount = analytics?.pending ?? reports.filter(report => report.status === 'pending').length;

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

  const updateDraftFilter = <K extends keyof ZoneFilterState>(key: K, value: ZoneFilterState[K]) => {
    setDraftFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      ...draftFilters,
      search: draftFilters.search.trim(),
    });
  };

  const handleResetFilters = () => {
    setDraftFilters(DEFAULT_ZONE_FILTERS);
    setAppliedFilters(DEFAULT_ZONE_FILTERS);
  };

  const handleStartMapCreate = () => {
    resetCreateForm();
    setViewMode('map');
    setMapSelectedZone(null);
    setIsMapCreateMode(true);
    setHideMapZonesForCreate(false);
  };

  const handleCancelMapCreate = () => {
    setIsMapCreateMode(false);
    setHideMapZonesForCreate(false);
    resetCreateForm();
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
      confidence: createForm.confidence,
      verificationNotes: createForm.verificationNotes.trim() || null,
      affectedBarangays: parseBarangays(createForm.affectedBarangaysText),
    };

    const isEditing = Boolean(editingZone);
    let savedZone: DangerZoneRecord | null = null;

    if (editingZone) {
      savedZone = await updateZone(editingZone.id, payload);
      setActionMessage('Danger zone updated.');
    } else {
      savedZone = await createOfficialZone(payload);
      setActionMessage('Official danger zone created.');
    }

    await refreshPageData();
    if (!isEditing) {
      setIsMapCreateMode(false);
      setHideMapZonesForCreate(false);
      setMapSelectedZone(savedZone);
    }
    setIsCreateOpen(false);
    resetCreateForm();
  };

  const runAction = async (action: () => Promise<DangerZoneRecord>, message: string) => {
    await action();
    await refreshPageData(true);
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

  // Determine DetailsPanel mode based on state
  const detailsPanelMode: DetailsPanelMode = isMapCreateMode
    ? 'create'
    : mapSelectedZone
      ? 'details'
      : 'default';

  // DetailsPanel handlers
  const handleDetailsPanelSave = async () => {
    await handleSaveOfficial();
  };

  const handleDetailsPanelEdit = () => {
    if (mapSelectedZone) {
      openEditModal(mapSelectedZone);
    }
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
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-default-200 bg-content1 p-1">
            <Button
              size="sm"
              variant={viewMode === 'map' ? 'solid' : 'light'}
              color={viewMode === 'map' ? 'primary' : 'default'}
              startContent={<MapIcon size={16} aria-hidden="true" />}
              onPress={() => setViewMode('map')}
              aria-label="Switch to map view"
            >
              Map view
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'solid' : 'light'}
              color={viewMode === 'table' ? 'primary' : 'default'}
              startContent={<List size={16} aria-hidden="true" />}
              onPress={() => setViewMode('table')}
              aria-label="Switch to table view"
            >
              Table view
            </Button>
          </div>
          {/* Mobile Filters Button - only visible on mobile when in map view */}
          {isMobile && viewMode === 'map' && (
            <Button
              color="default"
              variant="flat"
              startContent={<Filter size={18} aria-hidden="true" />}
              onPress={() => setIsMobileFiltersOpen(true)}
              aria-label="Open filters panel"
            >
              Filters
            </Button>
          )}
          <Button 
            color="primary" 
            startContent={<Plus size={18} aria-hidden="true" />} 
            onPress={handleStartMapCreate}
            aria-label="Create new official danger zone"
          >
            Create Official
          </Button>
        </div>
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

      <CompactSummaryCards
        pendingCount={pendingCount}
        verifiedActiveCount={analytics?.verifiedActive ?? zones.filter(zone => zone.status === 'verified' && zone.isActive).length}
        highCriticalCount={analytics?.highOrCritical ?? zones.filter(zone => zone.severity === 'high' || zone.severity === 'critical').length}
        routeFallbackCount={routingOperations?.fallbackCount ?? 0}
        routeCount={routingOperations?.routeCount ?? 0}
        isLoading={isLoading}
      />


      {viewMode === 'map' && (
        <ThreeColumnLayout
          isDetailsPanelCollapsed={isDetailsPanelCollapsed}
          isFiltersPanelCollapsed={isFiltersPanelCollapsed}
        >
          {{
            detailsPanel: (
              <DetailsPanel
                isCollapsed={isDetailsPanelCollapsed}
                onToggle={toggleDetailsPanel}
                mode={detailsPanelMode}
                selectedZone={mapSelectedZone}
                createForm={createForm}
                editingZone={editingZone}
                isMutating={isMutating}
                createError={createError}
                hideMapZones={hideMapZonesForCreate}
                totalZonesLoaded={zones.length}
                hasMoreZones={zonePagination?.hasMore}
                onToggleMapZones={() => setHideMapZonesForCreate(value => !value)}
                onUpdateCreateForm={updateCreateForm}
                onSave={handleDetailsPanelSave}
                onCancel={handleCancelMapCreate}
                onClearSelection={() => setMapSelectedZone(null)}
                onOpenFullReport={() => setSelectedZone(mapSelectedZone)}
                onEdit={handleDetailsPanelEdit}
              />
            ),
            mapContainer: (
              <div className="relative min-h-[640px] rounded-lg overflow-hidden border border-default-200 bg-content1">
                <ErrorBoundary
                  fallback={(error, errorInfo) => (
                    <MapErrorFallback
                      error={error}
                      errorInfo={errorInfo}
                      onRetry={() => window.location.reload()}
                    />
                  )}
                >
                  <AdminDangerZoneMap
                    zones={zones}
                    selectedZone={mapSelectedZone}
                    showOnlySelectedZone={false}
                    hideZones={isMapCreateMode && hideMapZonesForCreate}
                    center={mapCenter}
                    zoom={mapZoom.zoom}
                    minZoom={mapZoom.minZoom}
                    maxZoom={mapZoom.maxZoom}
                    maxBounds={maxBounds}
                    pickedCenter={isMapCreateMode ? createForm.center : null}
                    pickedGeometryType={createForm.geometryType}
                    pickedRadiusMeters={isMapCreateMode && createForm.geometryType === 'circle' ? createForm.radiusMeters : 0}
                    pickedGeojson={isMapCreateMode ? createForm.geojson : null}
                    affectedWidthMeters={createForm.affectedWidthMeters}
                    enableDrawing={isMapCreateMode}
                    resizeTrigger={mapResizeTrigger}
                    onZoneSelect={zone => {
                      if (!isMapCreateMode) setMapSelectedZone(zone);
                    }}
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
                    height="640px"
                  />
                </ErrorBoundary>
                {isLoading && (
                  <div 
                    className="absolute inset-0 z-500 flex items-center justify-center bg-background/55 backdrop-blur-[1px]"
                    aria-busy="true"
                    aria-live="polite"
                  >
                    <Spinner label="Loading danger zones..." />
                  </div>
                )}
                {zonePagination?.hasMore && !isMapCreateMode && (
                  <div className="absolute bottom-4 left-1/2 z-500 -translate-x-1/2">
                    <Button
                      color="primary"
                      variant="shadow"
                      isLoading={isLoading}
                      onPress={() =>
                        fetchAppliedZones({
                          pageSize: zonePagination.pageSize,
                          cursor: zonePagination.nextCursor,
                        })
                      }
                    >
                      Load more zones
                    </Button>
                  </div>
                )}
              </div>
            ),
            filtersPanel: (
              <FiltersPanel
                isCollapsed={isFiltersPanelCollapsed}
                onToggle={toggleFiltersPanel}
                draftFilters={draftFilters}
                onUpdateFilter={updateDraftFilter}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                hasChanges={hasFilterChanges}
                hasCustomFilters={hasCustomFilters}
                analytics={analytics}
                isLoadingAnalytics={isLoading}
              />
            ),
          }}
        </ThreeColumnLayout>
      )}

      {/* Mobile Filters Overlay - Right-side Drawer */}
      {isMobile && viewMode === 'map' && (
        <Drawer
          isOpen={isMobileFiltersOpen}
          onOpenChange={setIsMobileFiltersOpen}
          placement="right"
          size="full"
        >
          <DrawerContent>
            {(onClose) => (
              <>
                <DrawerHeader className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold">Filters</h2>
                </DrawerHeader>
                <DrawerBody>
                  <FiltersPanel
                    isCollapsed={false}
                    onToggle={() => setIsMobileFiltersOpen(false)}
                    draftFilters={draftFilters}
                    onUpdateFilter={updateDraftFilter}
                    onApply={() => {
                      handleApplyFilters();
                      onClose();
                    }}
                    onReset={handleResetFilters}
                    hasChanges={hasFilterChanges}
                    hasCustomFilters={hasCustomFilters}
                    analytics={analytics}
                    isLoadingAnalytics={isLoading}
                  />
                </DrawerBody>
              </>
            )}
          </DrawerContent>
        </Drawer>
      )}

      {/* Mobile Details Overlay - Bottom Modal */}
      {isMobile && viewMode === 'map' && (
        <Modal
          isOpen={isMobileDetailsOpen}
          onOpenChange={setIsMobileDetailsOpen}
          size="full"
          placement="bottom"
          scrollBehavior="inside"
          classNames={{
            base: 'max-h-[85vh]',
            wrapper: 'items-end',
          }}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold">
                    {detailsPanelMode === 'default' && 'Map Overview'}
                    {detailsPanelMode === 'details' && mapSelectedZone && formatLabel(mapSelectedZone.type)}
                    {detailsPanelMode === 'create' && (editingZone ? 'Edit Danger Zone' : 'Create Official Zone')}
                  </h2>
                </ModalHeader>
                <ModalBody>
                  <DetailsPanel
                    isCollapsed={false}
                    onToggle={() => setIsMobileDetailsOpen(false)}
                    mode={detailsPanelMode}
                    selectedZone={mapSelectedZone}
                    createForm={createForm}
                    editingZone={editingZone}
                    isMutating={isMutating}
                    createError={createError}
                    hideMapZones={hideMapZonesForCreate}
                    totalZonesLoaded={zones.length}
                    hasMoreZones={zonePagination?.hasMore}
                    onToggleMapZones={() => setHideMapZonesForCreate(value => !value)}
                    onUpdateCreateForm={updateCreateForm}
                    onSave={async () => {
                      await handleDetailsPanelSave();
                      onClose();
                    }}
                    onCancel={() => {
                      handleCancelMapCreate();
                      onClose();
                    }}
                    onClearSelection={() => {
                      setMapSelectedZone(null);
                      onClose();
                    }}
                    onOpenFullReport={() => {
                      setSelectedZone(mapSelectedZone);
                      onClose();
                    }}
                    onEdit={() => {
                      handleDetailsPanelEdit();
                      onClose();
                    }}
                  />
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      )}

      {viewMode === 'table' && (
        <>
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
            ) : zones.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-default-500">
                <CircleAlert size={32} />
                <p>No danger zones found for this filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-default-100">
                {zones.map(zone => (
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

          {zonePagination?.hasMore && (
            <div className="flex justify-center">
              <Button
                variant="flat"
                isLoading={isLoading}
                onPress={() =>
                  fetchAppliedZones({
                    pageSize: zonePagination.pageSize,
                    cursor: zonePagination.nextCursor,
                  })
                }
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}

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
                        <div>
                          <div className="text-default-500">Confidence</div>
                          <div>{selectedZone.confidence ?? 'medium'}</div>
                        </div>
                        <div>
                          <div className="text-default-500">Affected barangays</div>
                          <div>{selectedZone.affectedBarangays?.length ? selectedZone.affectedBarangays.join(', ') : 'Not set'}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-default-500">Description</div>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{selectedZone.description}</p>
                      </div>

                      {selectedZone.verificationNotes && (
                        <div>
                          <div className="text-sm text-default-500">Verification notes</div>
                          <p className="mt-1 whitespace-pre-wrap text-sm">{selectedZone.verificationNotes}</p>
                        </div>
                      )}

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
                          <Select
                            label="Verification confidence"
                            labelPlacement="outside"
                            selectedKeys={[verifyConfidence]}
                            onChange={event => setVerifyConfidence(event.target.value as DangerZoneConfidence)}
                          >
                            {CONFIDENCE_OPTIONS.map(option => (
                              <SelectItem key={option.key}>{option.label}</SelectItem>
                            ))}
                          </Select>
                          <Input
                            label="Affected barangays"
                            labelPlacement="outside"
                            placeholder="Comma-separated barangay names"
                            value={verifyBarangays}
                            onValueChange={setVerifyBarangays}
                          />
                          <Textarea
                            label="Verification notes"
                            labelPlacement="outside"
                            placeholder="Optional LGU notes for audit and operations"
                            value={verifyNotes}
                            onValueChange={setVerifyNotes}
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
                        onPress={() =>
                          runAction(
                            () =>
                              verifyReport(selectedZone.id, verifyExpiresAt, {
                                confidence: verifyConfidence,
                                verificationNotes: verifyNotes.trim() || null,
                                affectedBarangays: parseBarangays(verifyBarangays),
                              }),
                            'Report verified.'
                          )
                        }
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
                    <Select
                      label="Confidence"
                      labelPlacement="outside"
                      selectedKeys={[createForm.confidence]}
                      onChange={event => updateCreateForm('confidence', event.target.value as DangerZoneConfidence)}
                    >
                      {CONFIDENCE_OPTIONS.map(option => (
                        <SelectItem key={option.key}>{option.label}</SelectItem>
                      ))}
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
                    <Input
                      label="Affected barangays"
                      labelPlacement="outside"
                      placeholder="Comma-separated barangay names"
                      value={createForm.affectedBarangaysText}
                      onValueChange={value => updateCreateForm('affectedBarangaysText', value)}
                    />
                    <Textarea
                      label="Verification notes"
                      labelPlacement="outside"
                      placeholder="Optional notes for operational handoff"
                      value={createForm.verificationNotes}
                      onValueChange={value => updateCreateForm('verificationNotes', value)}
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
