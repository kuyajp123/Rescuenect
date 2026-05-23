import type { AdminUser, ClientLguStatus } from '@/types/admin';

export const canAccessClientScope = (adminUser: AdminUser | undefined, requestedClientId?: string | null): boolean => {
  if (!adminUser) return false;
  if (adminUser.role === 'super_admin') return true;
  if (adminUser.role !== 'lgu_admin' || !adminUser.clientId) return false;

  return !requestedClientId || requestedClientId === adminUser.clientId;
};

export const canLguAdminUseClient = (status: ClientLguStatus | undefined): boolean => status === 'active';

export const isClientVisibleInResidentSignup = (status: ClientLguStatus | undefined): boolean => status === 'active';

export const shouldAllowLegacyAdminEmails = (rawValue: string | undefined): boolean => {
  const value = rawValue?.trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes' || value === 'on';
};
