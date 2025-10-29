import { create } from 'zustand';

interface VersionHistoryItem {
  versionId: string;
  parentId: string;
  // Add other version fields you might need
  createdAt?: string;
  description?: string;
  lat: number;
  lng: number;
  [key: string]: any; // For additional fields from API
}

export interface VersionHistoryState {
  // Current parent ID for fetching versions
  currentParentId: string | null;
  // List of version history items
  versions: VersionHistoryItem[];
  // Loading state
  isLoading: boolean;
  // Error state
  error: string | null;
}

interface VersionHistoryActions {
  // Set the parent ID to fetch versions for
  setParentId: (parentId: string) => void;
  // Set the versions data
  setVersions: (versions: VersionHistoryItem[]) => void;
  // Set loading state
  setLoading: (isLoading: boolean) => void;
  // Set error state
  setError: (error: string | null) => void;
  // Reset all data
  resetData: () => void;
}

type VersionHistoryStore = VersionHistoryState & VersionHistoryActions;

export const useVersionHistoryStore = create<VersionHistoryStore>(set => ({
  // Initial state
  currentParentId: null,
  versions: [],
  isLoading: false,
  error: null,

  // Actions
  setParentId: (parentId: string) => set({ currentParentId: parentId }),
  setVersions: (versions: VersionHistoryItem[]) => set({ versions }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  resetData: () =>
    set({
      currentParentId: null,
      versions: [],
      isLoading: false,
      error: null,
    }),
}));
