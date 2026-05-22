import type { ClientCoverageBarangay } from '@/pages/contents/SuperAdmin/types';
import { barangayKey } from '@/pages/contents/SuperAdmin/utils';
import { Button, Checkbox } from '@heroui/react';

type ClientCoverageEditorProps = {
  coverage: ClientCoverageBarangay[];
  onCoverageChange: (coverage: ClientCoverageBarangay[]) => void;
};

export const ClientCoverageEditor = ({ coverage, onCoverageChange }: ClientCoverageEditorProps) => {
  const activeBarangayCount = coverage.filter(barangay => barangay.isActive !== false).length;

  const setBarangayActive = (key: string, isActive: boolean) => {
    onCoverageChange(
      coverage.map(barangay => (barangayKey(barangay) === key ? { ...barangay, isActive } : barangay))
    );
  };

  const setAllBarangaysActive = (isActive: boolean) => {
    onCoverageChange(coverage.map(barangay => ({ ...barangay, isActive })));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">Barangay Coverage</p>
          <p className="text-sm text-default-500">
            {activeBarangayCount} of {coverage.length} barangays enabled
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="flat" onPress={() => setAllBarangaysActive(true)}>
            Enable all
          </Button>
          <Button size="sm" variant="flat" onPress={() => setAllBarangaysActive(false)}>
            Disable all
          </Button>
        </div>
      </div>
      <div className="grid max-h-72 grid-cols-1 gap-2 overflow-auto rounded-lg border border-default-200 p-3 md:grid-cols-2 xl:grid-cols-3">
        {coverage.map(barangay => (
          <Checkbox
            key={barangayKey(barangay)}
            isSelected={barangay.isActive !== false}
            onValueChange={isSelected => setBarangayActive(barangayKey(barangay), isSelected)}
          >
            {barangay.barangayLabel}
          </Checkbox>
        ))}
      </div>
    </div>
  );
};
