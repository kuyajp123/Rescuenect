import { initializeAuth } from '@/auth/firebaseAuth';
import { inititallizeAppStorage, STORAGE_KEYS } from '@/config/asyncStorage';
import { storageHelpers } from '@/helper/storage';
import { useAuth } from '@/store/useAuth';
import { useUserData } from '@/store/useBackendResponse';
import { useEffect } from 'react';

export const useAppBootstrap = () => {
  const setHasSignedOut = useAuth(state => state.setHasSignedOut);
  const setProfileHydrated = useAuth(state => state.setProfileHydrated);
  const setUserData = useUserData(state => state.setUserData);

  useEffect(() => {
    let isActive = true;
    let cleanupAuth: (() => void) | undefined;

    const bootstrap = async () => {
      try {
        await inititallizeAppStorage();

        const [savedUser, hasSignedOut] = await Promise.all([
          storageHelpers.getData<{
            firstName?: string;
            lastName?: string;
            barangay?: string;
            phoneNumber?: string;
            fcmToken?: string | null;
          }>(STORAGE_KEYS.USER),
          storageHelpers.getField<boolean>(STORAGE_KEYS.APP_STATE, 'hasSignedOut'),
        ]);

        if (!isActive) return;

        if (savedUser) {
          setUserData({
            userData: {
              firstName: savedUser.firstName || '',
              lastName: savedUser.lastName || '',
              barangay: savedUser.barangay || '',
              phoneNumber: savedUser.phoneNumber || '',
              fcmToken: savedUser.fcmToken ?? null,
            },
          });
        }

        setHasSignedOut(Boolean(hasSignedOut));
        setProfileHydrated(true);
        cleanupAuth = initializeAuth();
      } catch (error) {
        console.error('Error during app bootstrap:', error);
        if (!isActive) return;
        setHasSignedOut(true);
        setProfileHydrated(true);
        cleanupAuth = initializeAuth();
      }
    };

    void bootstrap();

    return () => {
      isActive = false;
      cleanupAuth?.();
    };
  }, [setHasSignedOut, setProfileHydrated, setUserData]);
};
