import type { AdminUser, ClientLguStatus } from '@/types/admin';

export const canAccessClientScope = (adminUser: AdminUser | undefined, requestedClientId?: string | null): boolean => {
  if (!adminUser) return false;
  if (adminUser.role === 'super_admin') return true;
  if (adminUser.role !== 'lgu_admin' || !adminUser.clientId) return false;

  return !requestedClientId || requestedClientId === adminUser.clientId;
};

export const canLguAdminUseClient = (status: ClientLguStatus | undefined): boolean => status === 'active';

export const canLguAdminCompleteOnboarding = (status: ClientLguStatus | undefined): boolean =>
  status === 'draft' || status === 'active';

export const isClientVisibleInResidentSignup = (status: ClientLguStatus | undefined): boolean => status === 'active';

export const hasUsableWeatherCoordinates = (
  latitude: number | null | undefined,
  longitude: number | null | undefined
): boolean =>
  typeof latitude === 'number' &&
  Number.isFinite(latitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  typeof longitude === 'number' &&
  Number.isFinite(longitude) &&
  longitude >= -180 &&
  longitude <= 180;

export const shouldAllowLegacyAdminEmails = (rawValue: string | undefined): boolean => {
  const value = rawValue?.trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes' || value === 'on';
};

export const isValidClientMapZoom = (settings: {
  minZoom?: number;
  zoom?: number;
  maxZoom?: number;
}): boolean => {
  const minZoom = settings.minZoom ?? 13;
  const zoom = settings.zoom ?? 15;
  const maxZoom = settings.maxZoom ?? 18;

  return (
    Number.isFinite(minZoom) &&
    Number.isFinite(zoom) &&
    Number.isFinite(maxZoom) &&
    minZoom >= 12 &&
    minZoom <= 13 &&
    zoom >= minZoom &&
    zoom <= 17 &&
    maxZoom >= zoom &&
    maxZoom <= 18
  );
};

export const canAdminReceiveNotification = (
  adminUser: Pick<AdminUser, 'role' | 'clientId'> | undefined,
  notification: {
    type?: string;
    clientId?: string | null;
    audience?: string;
    targetRole?: string | null;
    data?: Record<string, unknown>;
  }
): boolean => {
  if (!adminUser) return false;

  if (adminUser.role === 'super_admin') {
    if (notification.type === 'weather') return false;
    const actionableTypes = new Set(['client_request', 'client_change_request', 'earthquake', 'system_health']);
    if (!actionableTypes.has(notification.type || '')) return false;
    if (notification.audience === 'users' && notification.type !== 'earthquake') return false;
    const status = typeof notification.data?.status === 'string' ? notification.data.status : null;
    if (
      (notification.type === 'client_request' || notification.type === 'client_change_request') &&
      status &&
      status !== 'pending'
    ) {
      return false;
    }
    return !notification.targetRole || notification.targetRole === 'super_admin' || notification.targetRole === 'all_admins';
  }

  if (adminUser.role !== 'lgu_admin' || !adminUser.clientId) return false;
  if (notification.targetRole === 'super_admin') return false;
  if (notification.type === 'weather') return notification.clientId === adminUser.clientId;
  if (notification.audience === 'users') return false;
  return !notification.clientId || notification.clientId === adminUser.clientId;
};
