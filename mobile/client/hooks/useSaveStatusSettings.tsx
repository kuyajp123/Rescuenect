import { storageHelpers } from '@/components/helper/storage';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { StatusStateData } from '@/types/components';
import { useEffect } from 'react';

export const useSaveStatusSettings = (data: StatusStateData | null) => {
  useEffect(() => {
    const setStorage = async () => {
      try {
        await storageHelpers.setField(STORAGE_KEYS.USER_SETTINGS, 'shareLocation', data?.shareLocation || true);
        await storageHelpers.setField(STORAGE_KEYS.USER_SETTINGS, 'shareContact', data?.shareContact || true);
        await storageHelpers.setField(STORAGE_KEYS.USER_SETTINGS, 'expirationDuration', data?.expirationDuration || 24);
        console.log('Status settings saved to storage', {
          shareLocation: data?.shareLocation,
          shareContact: data?.shareContact,
          expirationDuration: data?.expirationDuration,
        });
      } catch (error) {
        console.error('Error saving to storage:', error);
      }
    };

    if (data) {
      setStorage();
    }
  }, [data]);
};
