import { STORAGE_KEYS } from '@/config/asyncStorage';
import { API_ROUTES } from '@/config/endpoints';
import { storageHelpers } from '@/helper/storage';
import { useUserData } from '@/store/useBackendResponse';
import axios from 'axios';
import type { User } from 'firebase/auth';

export const syncAuthenticatedUserProfile = async (authUser: User) => {
  const token = await authUser.getIdToken();
  const response = await axios.get(API_ROUTES.DATA.GET_PROFILE, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: 10000,
  });

  const responseUser = response.data?.user ?? {};
  const currentUserData = useUserData.getState().userData;
  const nextUserData = {
    ...currentUserData,
    firstName: responseUser.firstName ?? currentUserData.firstName,
    lastName: responseUser.lastName ?? currentUserData.lastName,
    barangay: responseUser.barangay ?? currentUserData.barangay,
    phoneNumber: responseUser.phoneNumber ?? currentUserData.phoneNumber,
    fcmToken: responseUser.fcmToken ?? currentUserData.fcmToken ?? null,
    clientId: responseUser.clientId ?? currentUserData.clientId,
    clientName: responseUser.clientName ?? currentUserData.clientName,
    clientStatus: responseUser.clientStatus ?? null,
    clientDeletionEffectiveAt: responseUser.clientDeletionEffectiveAt ?? null,
    clientDeletionStatus: responseUser.clientDeletionStatus ?? null,
    provinceCode: responseUser.provinceCode ?? currentUserData.provinceCode,
    provinceName: responseUser.provinceName ?? currentUserData.provinceName,
    municipalityCode: responseUser.municipalityCode ?? currentUserData.municipalityCode,
    municipalityName: responseUser.municipalityName ?? currentUserData.municipalityName,
    municipalityType: responseUser.municipalityType ?? currentUserData.municipalityType,
    barangayCode: responseUser.barangayCode ?? currentUserData.barangayCode,
    barangayLabel: responseUser.barangayLabel ?? currentUserData.barangayLabel,
    weatherLocationKey: responseUser.weatherLocationKey ?? currentUserData.weatherLocationKey,
    weatherLatitude: responseUser.weatherLatitude ?? currentUserData.weatherLatitude,
    weatherLongitude: responseUser.weatherLongitude ?? currentUserData.weatherLongitude,
    mapSettings: responseUser.mapSettings ?? currentUserData.mapSettings ?? null,
  };

  useUserData.getState().setUserData({ userData: nextUserData });
  await storageHelpers.setData(STORAGE_KEYS.USER, nextUserData);

  return nextUserData;
};
