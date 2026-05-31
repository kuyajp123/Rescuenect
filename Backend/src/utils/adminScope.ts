import { Request } from 'express';

export const getClientScopeFromRequest = (req: Request): string | undefined => {
  if (req.adminUser?.role === 'lgu_admin') {
    return req.adminUser.clientId || undefined;
  }

  const queryClientId = typeof req.query.clientId === 'string' ? req.query.clientId.trim() : '';
  const bodyClientId = typeof req.body?.clientId === 'string' ? req.body.clientId.trim() : '';
  return queryClientId || bodyClientId || undefined;
};

export const getEffectiveClientId = (data: Record<string, unknown>): string | undefined =>
  typeof data.clientId === 'string' && data.clientId.trim() ? data.clientId.trim() : undefined;
