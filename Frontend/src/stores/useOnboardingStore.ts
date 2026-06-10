import { create } from 'zustand';

interface OnboardingState {
  barangay: string;
  address: string;
  logoUrl: string;
  logoPath: string;
  setAddressData: (barangay: string, address: string) => void;
  setLogoData: (logoUrl: string, logoPath: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>(set => ({
  barangay: '',
  address: '',
  logoUrl: '',
  logoPath: '',
  setAddressData: (barangay, address) => set({ barangay, address }),
  setLogoData: (logoUrl, logoPath) => set({ logoUrl, logoPath }),
  reset: () => set({ barangay: '', address: '', logoUrl: '', logoPath: '' }),
}));
