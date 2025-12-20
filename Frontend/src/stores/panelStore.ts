import { EvacuationCenter, StatusCardProps, StatusDataCard } from '@/types/types';
import { create } from 'zustand';

export type PanelSelection =
  | { type: 'status'; data: StatusCardProps }
  | { type: 'evacuation'; data: EvacuationCenter; onUpdate?: () => void }
  | { type: 'residentProfile'; data: StatusDataCard }
  | { type: 'statusHistory'; data: StatusDataCard }
  | null;

interface PanelState {
  isOpen: boolean;
  selectedUser: PanelSelection;
  openModal: boolean;
  openStatusPanel: (data: StatusCardProps) => void;
  openEvacuationPanel: (data: EvacuationCenter, onUpdate?: () => void) => void;
  openResidentProfilePanel: (data: StatusDataCard) => void;
  openStatusHistoryPanel: (data: StatusDataCard) => void;
  onOpenModal?: () => void;
  onCloseModal?: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  setSelectedUser: (userData: PanelSelection) => void;
}

export const usePanelStore = create<PanelState>(set => ({
  isOpen: false,
  selectedUser: null,
  openModal: false,

  openStatusPanel: data =>
    set({
      isOpen: true,
      selectedUser: { type: 'status', data },
    }),

  openEvacuationPanel: (data, onUpdate) =>
    set({
      isOpen: true,
      selectedUser: { type: 'evacuation', data, onUpdate },
    }),

  openResidentProfilePanel: data =>
    set({
      isOpen: true,
      selectedUser: { type: 'residentProfile', data },
    }),

  openStatusHistoryPanel: data =>
    set({
      isOpen: true,
      selectedUser: { type: 'statusHistory', data },
    }),

  onOpenModal: () =>
    set({
      openModal: true,
    }),

  onCloseModal: () =>
    set({
      openModal: false,
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
