import { EvacuationCenter, StatusCardProps, StatusDataCard } from '@/types/types';
import { create } from 'zustand';

export type PanelSelection =
  | { type: 'status'; data: StatusCardProps }
  | { type: 'evacuation'; data: EvacuationCenter }
  | { type: 'residentProfile'; data: StatusDataCard }
  | null;

interface PanelState {
  isOpen: boolean;
  selectedUser: PanelSelection;
  openStatusPanel: (data: StatusCardProps) => void;
  openEvacuationPanel: (data: EvacuationCenter) => void;
  closePanel: () => void;
  togglePanel: () => void;
  setSelectedUser: (userData: PanelSelection) => void;
}

export const usePanelStore = create<PanelState>(set => ({
  isOpen: false,
  selectedUser: null,

  openStatusPanel: data =>
    set({
      isOpen: true,
      selectedUser: { type: 'status', data },
    }),

  openEvacuationPanel: data =>
    set({
      isOpen: true,
      selectedUser: { type: 'evacuation', data },
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
