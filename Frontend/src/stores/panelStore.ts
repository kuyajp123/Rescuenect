import { create } from 'zustand';

interface SelectedUserData {
  id: string;
  vid: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  condition: 'safe' | 'evacuated' | 'affected' | 'missing';
  phoneNumber?: string;
  location: string;
  lat: number;
  lng: number;
  status: 'current' | 'history' | 'deleted';
  createdAt: string;
  expirationDuration: string;
  parentId?: string;
  originalStatus?: any;
  category: [];
  people: number;
}

interface PanelState {
  isOpen: boolean;
  selectedUser: SelectedUserData | null;
  openPanel: (userData?: SelectedUserData) => void;
  closePanel: () => void;
  togglePanel: () => void;
  setSelectedUser: (userData: SelectedUserData | null) => void;
}

export const usePanelStore = create<PanelState>(set => ({
  isOpen: false,
  selectedUser: null,

  openPanel: userData =>
    set({
      isOpen: true,
      selectedUser: userData || null,
    }),

  closePanel: () =>
    set({
      isOpen: false,
      selectedUser: null,
    }),

  togglePanel: () =>
    set(state => ({
      isOpen: !state.isOpen,
    })),

  setSelectedUser: userData =>
    set({
      selectedUser: userData,
    }),
}));
