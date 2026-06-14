import { DangerZoneAnalytics, DangerZoneGeometryType, DangerZoneSeverity, DangerZoneStatus } from '@/types/dangerZone';
import { Button, Input, Select, SelectItem, Spinner } from '@heroui/react';
import { Activity, ChevronLeft, ChevronRight, RotateCcw, Search } from 'lucide-react';

// Filter state type
export type ZoneFilterState = {
  status: DangerZoneStatus | 'all';
  severity: DangerZoneSeverity | 'all';
  geometryType: DangerZoneGeometryType | 'all';
  source: 'all' | 'resident_report' | 'lgu_official';
  search: string;
};

interface FiltersPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  draftFilters: ZoneFilterState;
  onUpdateFilter: <K extends keyof ZoneFilterState>(key: K, value: ZoneFilterState[K]) => void;
  onApply: () => void;
  onReset: () => void;
  hasChanges: boolean;
  hasCustomFilters: boolean;
  analytics: DangerZoneAnalytics | null;
  isLoadingAnalytics: boolean;
}

// Filter options
const STATUS_OPTIONS: Array<{ key: DangerZoneStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All statuses' },
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'expired', label: 'Expired' },
];

const SEVERITY_FILTER_OPTIONS: Array<{ key: DangerZoneSeverity | 'all'; label: string }> = [
  { key: 'all', label: 'All severities' },
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
  { key: 'critical', label: 'Critical' },
];

const GEOMETRY_FILTER_OPTIONS: Array<{ key: DangerZoneGeometryType | 'all'; label: string }> = [
  { key: 'all', label: 'All geometries' },
  { key: 'point', label: 'Point' },
  { key: 'circle', label: 'Circle' },
  { key: 'line', label: 'Line' },
  { key: 'polygon', label: 'Polygon' },
];

const SOURCE_FILTER_OPTIONS = [
  { key: 'all', label: 'All sources' },
  { key: 'resident_report', label: 'Resident reports' },
  { key: 'lgu_official', label: 'LGU official' },
];

/**
 * FiltersPanel Component
 * 
 * Implements the right sidebar panel for filtering danger zones and displaying analytics.
 * Collapsible with sessionStorage persistence.
 * 
 * Features:
 * - Search input for text filtering
 * - Status, Severity, Geometry, and Source select dropdowns
 * - Apply filters button (disabled if no changes pending)
 * - Reset button (disabled if no custom filters active)
 * - Analytics metrics section at bottom
 * - Collapsed state (48px width with vertical expand button)
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**
 */
export const FiltersPanel = ({
  isCollapsed,
  onToggle,
  draftFilters,
  onUpdateFilter,
  onApply,
  onReset,
  hasChanges,
  hasCustomFilters,
  analytics,
  isLoadingAnalytics,
}: FiltersPanelProps) => {
  // Collapsed state UI
  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center bg-content1 border-l border-default-200 rounded-lg">
        <Button
          isIconOnly
          variant="light"
          onPress={onToggle}
          className="h-12 w-12"
          aria-label="Expand filters panel"
          aria-expanded="false"
        >
          <ChevronLeft size={20} />
        </Button>
      </div>
    );
  }

  // Calculate analytics metrics
  const avgVerificationHours = analytics?.averageVerificationHours ?? null;
  const avgVerificationDisplay = avgVerificationHours !== null 
    ? avgVerificationHours < 1 
      ? `${Math.round(avgVerificationHours * 60)} min`
      : `${avgVerificationHours.toFixed(1)} hr`
    : 'N/A';

  const expiringCount = analytics?.expiringSoon ?? 0;

  // Expanded state UI
  return (
    <div className="flex flex-col bg-content1 border border-default-200 rounded-lg transition-all duration-300 overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-default-200">
        <h2 className="text-lg font-semibold">Filters</h2>
        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={onToggle}
          aria-label="Collapse filters panel"
          aria-expanded="true"
        >
          <ChevronRight size={20} />
        </Button>
      </div>

      {/* Panel Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Search Input */}
        <Input
          label="Search"
          placeholder="Search zones..."
          value={draftFilters.search}
          onValueChange={(value) => onUpdateFilter('search', value)}
          startContent={<Search size={18} className="text-default-400" />}
          isClearable
          onClear={() => onUpdateFilter('search', '')}
          size="sm"
        />

        {/* Status Select */}
        <Select
          label="Status"
          placeholder="Select status"
          selectedKeys={[draftFilters.status]}
          onChange={(e) => onUpdateFilter('status', e.target.value as DangerZoneStatus | 'all')}
          size="sm"
        >
          {STATUS_OPTIONS.map(option => (
            <SelectItem key={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </Select>

        {/* Severity Select */}
        <Select
          label="Severity"
          placeholder="Select severity"
          selectedKeys={[draftFilters.severity]}
          onChange={(e) => onUpdateFilter('severity', e.target.value as DangerZoneSeverity | 'all')}
          size="sm"
        >
          {SEVERITY_FILTER_OPTIONS.map(option => (
            <SelectItem key={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </Select>

        {/* Geometry Select */}
        <Select
          label="Geometry"
          placeholder="Select geometry"
          selectedKeys={[draftFilters.geometryType]}
          onChange={(e) => onUpdateFilter('geometryType', e.target.value as DangerZoneGeometryType | 'all')}
          size="sm"
        >
          {GEOMETRY_FILTER_OPTIONS.map(option => (
            <SelectItem key={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </Select>

        {/* Source Select */}
        <Select
          label="Source"
          placeholder="Select source"
          selectedKeys={[draftFilters.source]}
          onChange={(e) => onUpdateFilter('source', e.target.value as 'all' | 'resident_report' | 'lgu_official')}
          size="sm"
        >
          {SOURCE_FILTER_OPTIONS.map(option => (
            <SelectItem key={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </Select>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            color="primary"
            onPress={onApply}
            isDisabled={!hasChanges}
            fullWidth
            aria-label="Apply filters to danger zones"
          >
            Apply filters
          </Button>
          <Button
            variant="flat"
            onPress={onReset}
            isDisabled={!hasCustomFilters}
            startContent={<RotateCcw size={16} aria-hidden="true" />}
            aria-label="Reset filters to default"
          >
            Reset
          </Button>
        </div>

        {/* Divider */}
        <div className="border-t border-default-200" />

        {/* Analytics Metrics Section */}
        <div className="space-y-3" role="region" aria-label="Analytics metrics">
          <div className="flex items-center gap-2 text-sm font-semibold text-default-700">
            <Activity size={16} aria-hidden="true" />
            Analytics
          </div>

          {isLoadingAnalytics ? (
            <div className="flex items-center justify-center py-4" aria-busy="true" aria-live="polite">
              <Spinner size="sm" />
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {/* Average verification time */}
              <div className="flex items-center justify-between">
                <span className="text-default-500">Avg. verification time</span>
                <span className="font-medium text-default-700" aria-label={`Average verification time: ${avgVerificationDisplay}`}>
                  {avgVerificationDisplay}
                </span>
              </div>

              {/* Expiring soon count */}
              <div className="flex items-center justify-between">
                <span className="text-default-500">Expiring soon</span>
                <span className="font-medium text-default-700" aria-label={`${expiringCount} zones expiring soon`}>
                  {expiringCount}
                </span>
              </div>

              {/* Note about analytics */}
              <p className="text-xs text-default-400 pt-2">
                Analytics reflect all zones, not just filtered results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
