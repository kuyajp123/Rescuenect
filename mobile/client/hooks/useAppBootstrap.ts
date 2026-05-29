import { initializeAuth } from '@/auth/firebaseAuth';
import { inititallizeAppStorage, STORAGE_KEYS, type User as StoredUser } from '@/config/asyncStorage';
import { API_ROUTES } from '@/config/endpoints';
import {
  getResidentLocationSelectionForBarangay,
  toResidentLocationSelectionFromCoverageClient,
  type LocationCoverageResponse,
  type ResidentLocationSelection,
} from '@/config/locationConfig';
import { storageHelpers } from '@/helper/storage';
import { useAuth } from '@/store/useAuth';
import { useUserData } from '@/store/useBackendResponse';
import axios from 'axios';
import { useEffect } from 'react';

const getLatestLocationSelection = async (
  savedUser: Partial<StoredUser>
): Promise<ResidentLocationSelection | null> => {
  if (!savedUser.clientId || !savedUser.barangay) {
    return null;
  }

  try {
    const response = await axios.get<LocationCoverageResponse>(API_ROUTES.DATA.GET_LOCATION_COVERAGE, {
      timeout: 10000,
    });
    const client = response.data.provinces
      .flatMap(province => province.clients)
      .find(item => item.clientId === savedUser.clientId);

    return toResidentLocationSelectionFromCoverageClient(client, savedUser.barangay);
  } catch (error) {
    console.warn('Unable to refresh client map settings during bootstrap:', error);
    return null;
  }
};

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
          storageHelpers.getData<Partial<StoredUser>>(STORAGE_KEYS.USER),
          storageHelpers.getField<boolean>(STORAGE_KEYS.APP_STATE, 'hasSignedOut'),
        ]);

        if (!isActive) return;

        if (savedUser) {
          const locationSelection =
            (await getLatestLocationSelection(savedUser)) ??
            (savedUser.clientId && savedUser.weatherLocationKey
              ? null
              : getResidentLocationSelectionForBarangay(savedUser.barangay));

          setUserData({
            userData: {
              firstName: savedUser.firstName || '',
              lastName: savedUser.lastName || '',
              barangay: savedUser.barangay || '',
              phoneNumber: savedUser.phoneNumber || '',
              fcmToken: savedUser.fcmToken ?? null,
              clientId: savedUser.clientId ?? locationSelection?.clientId,
              clientName: savedUser.clientName ?? locationSelection?.clientName,
              provinceCode: savedUser.provinceCode ?? locationSelection?.provinceCode,
              provinceName: savedUser.provinceName ?? locationSelection?.provinceName,
              municipalityCode: savedUser.municipalityCode ?? locationSelection?.municipalityCode,
              municipalityName: savedUser.municipalityName ?? locationSelection?.municipalityName,
              municipalityType: savedUser.municipalityType ?? locationSelection?.municipalityType,
              barangayCode: savedUser.barangayCode ?? locationSelection?.barangayCode,
              barangayLabel: savedUser.barangayLabel ?? locationSelection?.barangayLabel,
              weatherLocationKey: locationSelection?.weatherLocationKey ?? savedUser.weatherLocationKey,
              weatherLatitude: locationSelection?.weatherLatitude ?? savedUser.weatherLatitude,
              weatherLongitude: locationSelection?.weatherLongitude ?? savedUser.weatherLongitude,
              mapSettings: locationSelection?.mapSettings ?? savedUser.mapSettings ?? null,
            },
          });

          if (locationSelection) {
            void (async () => {
              const currentUserData = await storageHelpers.getData<Partial<StoredUser>>(STORAGE_KEYS.USER);
              await storageHelpers.setData(STORAGE_KEYS.USER, {
                ...(currentUserData ?? {}),
                ...locationSelection,
              });
            })();
          }
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
