import { barangays } from '@/config/constant';
import { sortBarangays } from '@/helper/commonHelpers';
import type { UserData } from '@/stores/useAuth';

export type BarangayOption = {
  label: string;
  value: string;
};

export const getAdminBarangayOptions = (userData: UserData | null): BarangayOption[] => {
  if (userData?.role === 'lgu_admin') {
    return sortBarangays(
      (userData.clientBarangays ?? [])
        .filter(barangay => barangay.isActive !== false)
        .map(barangay => ({
          label: barangay.barangayLabel,
          value: barangay.value,
        }))
    );
  }

  return sortBarangays(barangays);
};
