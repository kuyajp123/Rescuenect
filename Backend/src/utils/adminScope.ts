import { Request } from 'express';
import { canonicalizeClientId } from '@/config/locationConfig';

export const getClientScopeFromRequest = (req: Request): string | undefined => {
  if (req.adminUser?.role === 'lgu_admin') {
    return canonicalizeClientId(req.adminUser.clientId) || undefined;
  }

  const queryClientId = typeof req.query.clientId === 'string' ? req.query.clientId.trim() : '';
  const bodyClientId = typeof req.body?.clientId === 'string' ? req.body.clientId.trim() : '';
  return canonicalizeClientId(queryClientId || bodyClientId) || undefined;
};

export const getEffectiveClientId = (data: Record<string, unknown>): string | undefined =>
  canonicalizeClientId(data.clientId, data.municipalityCode) || undefined;
