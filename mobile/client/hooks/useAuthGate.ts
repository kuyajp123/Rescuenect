import { useAuth } from '@/store/useAuth';
import { useUserData } from '@/store/useBackendResponse';

export type SessionStatus = 'booting' | 'signedOut' | 'guest' | 'authenticated';
export type ProfileStatus = 'unknown' | 'missingBarangay' | 'missingContact' | 'complete';

const hasText = (value?: string | null) => typeof value === 'string' && value.trim().length > 0;

export const useAuthGate = () => {
  const authUser = useAuth(state => state.authUser);
  const authLoading = useAuth(state => state.isLoading);
  const hasSignedOut = useAuth(state => state.hasSignedOut);
  const isProfileHydrated = useAuth(state => state.isProfileHydrated);
  const isGuestIntent = useAuth(state => state.isGuestIntent);
  const isShowingSetupComplete = useAuth(state => state.isShowingSetupComplete);
  const userData = useUserData(state => state.userData);

  const isBooting = authLoading || hasSignedOut === null || !isProfileHydrated;

  const profileStatus: ProfileStatus = !isProfileHydrated
    ? 'unknown'
    : !hasText(userData?.barangay)
      ? 'missingBarangay'
      : !hasText(userData?.firstName) || !hasText(userData?.lastName) || !hasText(userData?.phoneNumber)
        ? 'missingContact'
        : 'complete';

  const sessionStatus: SessionStatus = isBooting
    ? 'booting'
    : authUser
      ? 'authenticated'
      : hasSignedOut === false || isGuestIntent
        ? 'guest'
        : 'signedOut';

  const isSignedInOrGuest = sessionStatus === 'authenticated' || sessionStatus === 'guest';
  const canAccessPublic = sessionStatus === 'signedOut' || (!authUser && profileStatus !== 'complete');
  const canAccessSetup = isSignedInOrGuest && (profileStatus !== 'complete' || isShowingSetupComplete);
  const canAccessApp = isSignedInOrGuest && profileStatus === 'complete';

  const initialHref =
    sessionStatus === 'booting'
      ? null
      : isShowingSetupComplete
        ? '/auth/setupComplete'
        : canAccessApp
          ? '/(app)/(tabs)'
          : canAccessSetup
          ? profileStatus === 'missingContact'
            ? '/auth/nameAndContactForm'
            : '/auth/barangayForm'
          : '/auth/signIn';

  return {
    authUser,
    sessionStatus,
    profileStatus,
    isBooting,
    canAccessPublic,
    canAccessSetup,
    canAccessApp,
    initialHref,
  };
};
