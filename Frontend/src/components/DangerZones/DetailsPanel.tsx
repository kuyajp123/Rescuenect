import { DangerZoneConfidence, DangerZoneGeoJson, DangerZoneGeometryType, DangerZoneRecord, DangerZoneSeverity } from '@/types/dangerZone';
import { Button, Chip, Input, Select, SelectItem, Textarea } from '@heroui/react';
import { CalendarClock, ChevronLeft, ChevronRight, Eye, EyeOff, MapPin, Pencil, X } from 'lucide-react';

// Panel modes
export type DetailsPanelMode = 'default' | 'details' | 'create';

// Create form state type (from design.md)
export type CreateFormState = {
  type: string;
  severity: DangerZoneSeverity;
  description: string;
  geometryType: DangerZoneGeometryType;
  center: { lat: number; lng: number } | null;
  radiusMeters: number;
  geojson: DangerZoneGeoJson | null;
  affectedWidthMeters: number;
  expiresAt: string | null;
  confidence: DangerZoneConfidence;
  verificationNotes: string;
  affectedBarangaysText: string;
};

interface DetailsPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  mode: DetailsPanelMode;
  selectedZone?: DangerZoneRecord | null;
  createForm?: CreateFormState;
  editingZone?: DangerZoneRecord | null;
  isMutating: boolean;
  createError?: string | null;
  hideMapZones: boolean;
  totalZonesLoaded?: number;
  hasMoreZones?: boolean;
  onToggleMapZones: () => void;
  onUpdateCreateForm: <K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onClearSelection: () => void;
  onOpenFullReport: () => void;
  onEdit: () => void;
}

// Danger type options
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

const GEOMETRY_OPTIONS: Array<{ key: DangerZoneGeometryType; label: string }> = [
  { key: 'point', label: 'Point' },
  { key: 'circle', label: 'Circle' },
  { key: 'line', label: 'Line (Polyline)' },
  { key: 'polygon', label: 'Polygon' },
];

// Expiry preset options (in milliseconds)
const EXPIRY_PRESETS = [
  { label: '6 hours', hours: 6 },
  { label: '12 hours', hours: 12 },
  { label: '24 hours', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '7 days', hours: 168 },
];

// Utility functions
const formatLabel = (text: string): string => {
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatDate = (value: unknown): string => {
  if (!value) return 'Not set';
  
  try {
    // Handle Firestore Timestamp or Date
    const date = value && typeof value === 'object' && 'toDate' in value 
      ? (value as { toDate: () => Date }).toDate() 
      : new Date(value as string);
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return 'Invalid date';
  }
};

const getGeometrySummary = (zone: DangerZoneRecord): string => {
  switch (zone.geometryType) {
    case 'point':
      return `Point (${zone.center?.lat.toFixed(5)}, ${zone.center?.lng.toFixed(5)})`;
    case 'circle':
      return `Circle (${zone.radiusMeters}m radius)`;
    case 'line':
      return `Line (${zone.geojson?.type === 'LineString' ? zone.geojson.coordinates.length : 0} points)`;
    case 'polygon':
      return `Polygon (${zone.geojson?.type === 'Polygon' ? zone.geojson.coordinates[0].length : 0} vertices)`;
    default:
      return formatLabel(zone.geometryType);
  }
};

const getSeverityColor = (severity: DangerZoneSeverity): 'success' | 'warning' | 'danger' => {
  switch (severity) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
    case 'critical':
      return 'danger';
    default:
      return 'warning';
  }
};

const getStatusColor = (status: string): 'warning' | 'success' | 'danger' | 'primary' | 'default' => {
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

/**
 * DetailsPanel Component
 * 
 * Implements the left sidebar panel for displaying zone details or create/edit form.
 * Supports three modes: default (no selection), details (zone selected), create (create/edit mode).
 * 
 * Panel Modes:
 * - default: Shows severity legend and pagination warning
 * - details: Shows selected zone metadata with action buttons
 * - create: Shows create/edit form for danger zones
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**
 */
export const DetailsPanel = ({
  isCollapsed,
  onToggle,
  mode,
  selectedZone,
  createForm,
  editingZone,
  isMutating,
  createError,
  hideMapZones,
  totalZonesLoaded = 0,
  hasMoreZones = false,
  onToggleMapZones,
  onUpdateCreateForm,
  onSave,
  onCancel,
  onClearSelection,
  onOpenFullReport,
  onEdit,
}: DetailsPanelProps) => {
  // Collapsed state UI
  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center bg-content1 border-r border-default-200 rounded-lg">
        <Button
          isIconOnly
          variant="light"
          onPress={onToggle}
          className="h-12 w-12"
          aria-label="Expand details panel"
          aria-expanded="false"
        >
          <ChevronRight size={20} />
        </Button>
      </div>
    );
  }

  // Expanded state UI
  return (
    <div className="flex flex-col bg-content1 border border-default-200 rounded-lg transition-all duration-300 overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-default-200">
        <h2 className="text-lg font-semibold">
          {mode === 'default' && 'Map Overview'}
          {mode === 'details' && selectedZone && formatLabel(selectedZone.type)}
          {mode === 'create' && (editingZone ? 'Edit Danger Zone' : 'Create Official Zone')}
        </h2>
        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={onToggle}
          aria-label="Collapse details panel"
          aria-expanded="true"
        >
          <ChevronLeft size={20} />
        </Button>
      </div>

      {/* Panel Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="region" aria-label={
        mode === 'default' ? 'Map overview panel' : 
        mode === 'details' ? 'Danger zone details panel' : 
        'Create danger zone form'
      }>
        {/* DEFAULT MODE - No zone selected */}
        {mode === 'default' && (
          <>
            <div>
              <p className="text-sm text-default-500 mb-3">
                {totalZonesLoaded} filtered danger zone{totalZonesLoaded !== 1 ? 's' : ''} loaded
              </p>

              {/* Severity Legend */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-default-700 uppercase">Severity Legend</p>
                <div className="space-y-1">
                  {SEVERITIES.map(sev => (
                    <div key={sev.key} className="flex items-center gap-2">
                      <Chip size="sm" color={getSeverityColor(sev.key)} variant="flat">
                        {sev.label}
                      </Chip>
                      <span className="text-xs text-default-500">
                        {sev.key === 'low' && 'Minor inconvenience'}
                        {sev.key === 'medium' && 'Moderate risk'}
                        {sev.key === 'high' && 'High risk'}
                        {sev.key === 'critical' && 'Immediate danger'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pagination Warning */}
            {hasMoreZones && (
              <div className="rounded-md border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-700">
                More zones available. Use "Load more zones" button on the map to view additional results.
              </div>
            )}
          </>
        )}

        {/* DETAILS MODE - Zone selected */}
        {mode === 'details' && selectedZone && (
          <>
            {/* Source subtitle */}
            <div>
              <p className="text-sm text-default-500">
                {selectedZone.source === 'resident_report' ? 'Resident report' : 'LGU official'}
              </p>
            </div>

            {/* Two-column metadata grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-default-500">Status</p>
                <Chip size="sm" color={getStatusColor(selectedZone.status)} variant="flat" className="mt-1">
                  {formatLabel(selectedZone.status)}
                </Chip>
              </div>

              <div>
                <p className="text-xs text-default-500">Severity</p>
                <Chip size="sm" color={getSeverityColor(selectedZone.severity)} variant="flat" className="mt-1">
                  {formatLabel(selectedZone.severity)}
                </Chip>
              </div>

              <div>
                <p className="text-xs text-default-500">Geometry</p>
                <p className="text-sm font-medium text-default-700 mt-1">{formatLabel(selectedZone.geometryType)}</p>
              </div>

              <div>
                <p className="text-xs text-default-500">Expiry</p>
                <p className="text-sm font-medium text-default-700 mt-1">{formatDate(selectedZone.expiresAt)}</p>
              </div>

              <div>
                <p className="text-xs text-default-500">Created</p>
                <p className="text-sm font-medium text-default-700 mt-1">{formatDate(selectedZone.createdAt)}</p>
              </div>

              <div>
                <p className="text-xs text-default-500">Confidence</p>
                <p className="text-sm font-medium text-default-700 mt-1">
                  {selectedZone.confidence ? formatLabel(selectedZone.confidence) : 'Not set'}
                </p>
              </div>
            </div>

            {/* Geometry summary */}
            <div>
              <p className="text-xs text-default-500 mb-1">Geometry Details</p>
              <p className="text-sm text-default-700">{getGeometrySummary(selectedZone)}</p>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs text-default-500 mb-1">Description</p>
              <div className="rounded-md bg-default-100 p-3">
                <p className="text-sm text-default-700 whitespace-pre-wrap">
                  {selectedZone.description || 'No description provided'}
                </p>
              </div>
            </div>

            {/* Affected barangays */}
            {selectedZone.affectedBarangays && selectedZone.affectedBarangays.length > 0 && (
              <div>
                <p className="text-xs text-default-500 mb-1">Affected Barangays</p>
                <div className="flex flex-wrap gap-1">
                  {selectedZone.affectedBarangays.map((barangay, index) => (
                    <Chip key={index} size="sm" variant="flat">
                      {barangay}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                color="primary"
                variant="flat"
                onPress={onOpenFullReport}
                startContent={<MapPin size={18} aria-hidden="true" />}
                fullWidth
                aria-label="Open full danger zone details"
              >
                Open details
              </Button>

              {selectedZone.status === 'verified' && selectedZone.isActive && (
                <Button
                  color="default"
                  variant="flat"
                  onPress={onEdit}
                  startContent={<Pencil size={18} aria-hidden="true" />}
                  fullWidth
                  aria-label="Edit danger zone"
                >
                  Edit
                </Button>
              )}

              <Button
                color="default"
                variant="light"
                onPress={onClearSelection}
                startContent={<X size={18} aria-hidden="true" />}
                fullWidth
                aria-label="Clear selection"
              >
                Clear
              </Button>
            </div>
          </>
        )}

        {/* CREATE MODE - Create/edit form */}
        {mode === 'create' && createForm && (
          <>
            {/* Error message */}
            {createError && (
              <div 
                id="create-form-error" 
                className="rounded-md border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700"
                role="alert"
              >
                {createError}
              </div>
            )}

            {/* Form fields */}
            <Select
              label="Danger type"
              placeholder="Select danger type"
              selectedKeys={createForm.type ? [createForm.type] : []}
              onChange={(e) => onUpdateCreateForm('type', e.target.value)}
              isRequired
              size="sm"
              aria-invalid={createError && !createForm.type ? 'true' : 'false'}
              aria-describedby={createError ? 'create-form-error' : undefined}
            >
              {DANGER_TYPES.map(type => (
                <SelectItem key={type.key}>
                  {type.label}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Severity"
              placeholder="Select severity"
              selectedKeys={[createForm.severity]}
              onChange={(e) => onUpdateCreateForm('severity', e.target.value as DangerZoneSeverity)}
              isRequired
              size="sm"
            >
              {SEVERITIES.map(sev => (
                <SelectItem key={sev.key}>
                  {sev.label}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Geometry type"
              placeholder="Select geometry type"
              selectedKeys={[createForm.geometryType]}
              onChange={(e) => onUpdateCreateForm('geometryType', e.target.value as DangerZoneGeometryType)}
              isRequired
              size="sm"
            >
              {GEOMETRY_OPTIONS.map(geom => (
                <SelectItem key={geom.key}>
                  {geom.label}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Confidence level"
              placeholder="Select confidence"
              selectedKeys={[createForm.confidence]}
              onChange={(e) => onUpdateCreateForm('confidence', e.target.value as DangerZoneConfidence)}
              size="sm"
            >
              {CONFIDENCE_OPTIONS.map(conf => (
                <SelectItem key={conf.key}>
                  {conf.label}
                </SelectItem>
              ))}
            </Select>

            {/* Conditional fields based on geometry type */}
            {createForm.geometryType === 'circle' && (
              <Input
                type="number"
                label="Radius (meters)"
                placeholder="Enter radius"
                value={String(createForm.radiusMeters)}
                onValueChange={(value) => onUpdateCreateForm('radiusMeters', Number(value))}
                min="1"
                isRequired
                size="sm"
              />
            )}

            {createForm.geometryType === 'line' && (
              <Input
                type="number"
                label="Affected width (meters)"
                placeholder="Enter width"
                value={String(createForm.affectedWidthMeters)}
                onValueChange={(value) => onUpdateCreateForm('affectedWidthMeters', Number(value))}
                min="1"
                size="sm"
              />
            )}

            {(createForm.geometryType === 'point' || createForm.geometryType === 'circle') && (
              <>
                <Input
                  type="number"
                  label="Latitude"
                  placeholder="Enter latitude"
                  value={createForm.center?.lat ? String(createForm.center.lat) : ''}
                  onValueChange={(value) => 
                    onUpdateCreateForm('center', { 
                      lat: Number(value), 
                      lng: createForm.center?.lng || 0 
                    })
                  }
                  step="0.000001"
                  isRequired
                  size="sm"
                />
                <Input
                  type="number"
                  label="Longitude"
                  placeholder="Enter longitude"
                  value={createForm.center?.lng ? String(createForm.center.lng) : ''}
                  onValueChange={(value) => 
                    onUpdateCreateForm('center', { 
                      lat: createForm.center?.lat || 0, 
                      lng: Number(value) 
                    })
                  }
                  step="0.000001"
                  isRequired
                  size="sm"
                />
              </>
            )}

            <Textarea
              label="Description"
              placeholder="Enter description"
              value={createForm.description}
              onValueChange={(value) => onUpdateCreateForm('description', value)}
              minRows={3}
              isRequired
              size="sm"
              aria-invalid={createError && !createForm.description.trim() ? 'true' : 'false'}
              aria-describedby={createError ? 'create-form-error' : undefined}
            />

            <Textarea
              label="Affected barangays"
              placeholder="Enter barangay names, comma-separated"
              value={createForm.affectedBarangaysText}
              onValueChange={(value) => onUpdateCreateForm('affectedBarangaysText', value)}
              minRows={2}
              size="sm"
            />

            <Textarea
              label="Verification notes"
              placeholder="Enter verification notes (optional)"
              value={createForm.verificationNotes}
              onValueChange={(value) => onUpdateCreateForm('verificationNotes', value)}
              minRows={2}
              size="sm"
            />

            {/* Expiry controls */}
            <div>
              <p className="text-sm font-medium text-default-700 mb-2">Expiry</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {EXPIRY_PRESETS.map(preset => (
                  <Button
                    key={preset.label}
                    size="sm"
                    variant="flat"
                    onPress={() => {
                      const expiry = new Date(Date.now() + preset.hours * 60 * 60 * 1000);
                      onUpdateCreateForm('expiresAt', expiry.toISOString().slice(0, 16));
                    }}
                    startContent={<CalendarClock size={14} />}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <Input
                type="datetime-local"
                label="Custom expiry date/time"
                value={createForm.expiresAt || ''}
                onValueChange={(value) => onUpdateCreateForm('expiresAt', value)}
                size="sm"
              />
            </div>

            {/* Clear map toggle */}
            <Button
              variant="flat"
              onPress={onToggleMapZones}
              startContent={hideMapZones ? <Eye size={18} aria-hidden="true" /> : <EyeOff size={18} aria-hidden="true" />}
              fullWidth
              aria-label={hideMapZones ? 'Show map zones' : 'Hide map zones'}
            >
              {hideMapZones ? 'Show map zones' : 'Hide map zones'}
            </Button>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                color="default"
                variant="light"
                onPress={onCancel}
                fullWidth
                isDisabled={isMutating}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={onSave}
                fullWidth
                isLoading={isMutating}
              >
                Save Zone
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
