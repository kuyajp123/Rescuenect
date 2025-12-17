import { create } from 'zustand';

interface OnboardingState {
  barangay: string;
  address: string;
  setAddressData: (barangay: string, address: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>(set => ({
  barangay: '',
  address: '',
  setAddressData: (barangay, address) => set({ barangay, address }),
  reset: () => set({ barangay: '', address: '' }),
}));
