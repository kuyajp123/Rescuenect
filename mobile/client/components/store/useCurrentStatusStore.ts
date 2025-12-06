import { StatusData } from '@/types/components';
import { create } from 'zustand';

type StatusCounts = {
  safe: number;
  evacuated: number;
  affected: number;
  missing: number;
};

type StatusesByCondition = {
  safe: StatusData[];
  evacuated: StatusData[];
  affected: StatusData[];
  missing: StatusData[];
};

type Status = {
  statusData: Array<StatusData>;
  setData: (data: Array<StatusData>) => void;
  // Computed values
  statusCounts: StatusCounts;
  statusesByCondition: StatusesByCondition;
  totalCount: number;
};

export const useStatusStore = create<Status>((set, get) => ({
  statusData: [],
  setData: statusData => {
    // Calculate counts
    const counts = statusData.reduce(
      (acc, status) => {
        const condition = status.condition?.toLowerCase();
        if (condition === 'safe') acc.safe++;
        else if (condition === 'evacuated') acc.evacuated++;
        else if (condition === 'affected') acc.affected++;
        else if (condition === 'missing') acc.missing++;
        return acc;
      },
      { safe: 0, evacuated: 0, affected: 0, missing: 0 }
    );

    // Filter by condition
    const byCondition = {
      safe: statusData.filter(s => s.condition?.toLowerCase() === 'safe'),
      evacuated: statusData.filter(s => s.condition?.toLowerCase() === 'evacuated'),
      affected: statusData.filter(s => s.condition?.toLowerCase() === 'affected'),
      missing: statusData.filter(s => s.condition?.toLowerCase() === 'missing'),
    };

    set({
      statusData,
      statusCounts: counts,
      statusesByCondition: byCondition,
      totalCount: statusData.length,
    });
  },
  // Initial computed values
  statusCounts: { safe: 0, evacuated: 0, affected: 0, missing: 0 },
  statusesByCondition: { safe: [], evacuated: [], affected: [], missing: [] },
  totalCount: 0,
}));
