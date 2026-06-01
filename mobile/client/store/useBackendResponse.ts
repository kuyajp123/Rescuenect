import { create } from 'zustand';
import type { ClientMapSettings } from '@/config/locationConfig';

type ResidentUserData = {
  firstName: string;
  lastName: string;
  barangay: string;
  phoneNumber: string;
  fcmToken: string | null;
  clientId?: string;
  clientName?: string;
  clientStatus?: 'draft' | 'active' | 'inactive' | 'deletion_scheduled' | 'deleting' | 'deleted' | null;
  clientDeletionEffectiveAt?: unknown;
  clientDeletionStatus?: string | null;
  provinceCode?: string;
  provinceName?: string;
  municipalityCode?: string;
  municipalityName?: string;
  municipalityType?: 'municipality' | 'city';
  barangayCode?: string | null;
  barangayLabel?: string;
  weatherLocationKey?: string;
  weatherLatitude?: number | null;
  weatherLongitude?: number | null;
  mapSettings?: ClientMapSettings | null;
};

type AuthUser = {
  isNewUser?: boolean | null;
  userData: ResidentUserData;
};

type UserDataUpdate = AuthUser | Partial<ResidentUserData> | ((state: UserData) => AuthUser | Partial<ResidentUserData>);

type UserData = {
  isNewUser: boolean | null;
  userData: ResidentUserData;
  setUserData: (response: UserDataUpdate) => void;
  resetResponse: () => void;
};

const defaultUserData: ResidentUserData = {
  firstName: '',
  lastName: '',
  barangay: '',
  phoneNumber: '',
  fcmToken: null,
};

export const useUserData = create<UserData>()(set => ({
  isNewUser: null,
  userData: defaultUserData,
  setUserData: response =>
    set(state => {
      const nextResponse = typeof response === 'function' ? response(state) : response;

      if ('userData' in nextResponse) {
        return {
          isNewUser: nextResponse.isNewUser ?? state.isNewUser,
          userData: {
            ...state.userData,
            ...nextResponse.userData,
          },
        };
      }

      return {
        userData: {
          ...state.userData,
          ...nextResponse,
        },
      };
    }),
  resetResponse: () => set({ isNewUser: null, userData: { ...defaultUserData } }),
}));
