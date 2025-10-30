import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VersionHistoryItem {
  versionId: string;
  parentId: string;
  uid: string;
  // Add other version fields you might need
  createdAt: string;
  profileImage: string;
  firstName: string;
  lastName: string;
  note?: string;
  location: string;
  lat: number;
  lng: number;
  condition: string;
}

export interface VersionHistoryState {
  // Current parent ID for fetching versions
  currentParentId: string | null;

  uid: string;
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
  // Set the user ID
  setUid: (uid: string) => void;
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

export const useVersionHistoryStore = create<VersionHistoryStore>()(
  persist(
    set => ({
      // Initial state
      currentParentId: null,
      uid: '',
      versions: [],
      isLoading: false,
      error: null,

      // Actions
      setParentId: (parentId: string) => set({ currentParentId: parentId }),
      setUid: (uid: string) => set({ uid }),
      setVersions: (versions: VersionHistoryItem[]) => set({ versions }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      resetData: () =>
        set({
          currentParentId: null,
          uid: '',
          versions: [],
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: 'version-history-storage', // unique name for localStorage key
      partialize: state => ({
        // Only persist these specific fields
        currentParentId: state.currentParentId,
        uid: state.uid,
        versions: state.versions,
        // Don't persist loading states and errors - they should reset on reload
      }),
      // Optional: Add version for migration if store structure changes
      version: 1,
    }
  )
);
