import { AdminAuthModel } from '@/models/admin/AdminAuthModel';
import { ClientModel } from '@/models/admin/ClientModel';
import { canAccessClientScope, canLguAdminUseClient, isClientWritableByLguAdmin } from '@/utils/accessControl';
import { NextFunction, Request, Response } from 'express';

export class AdminMiddleware {
  static async requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    try {
      const adminUser = await AdminAuthModel.getAdminByUid(uid);
      if (!adminUser) {
        res.status(403).json({ message: 'Admin access required' });
        return;
      }

      if (adminUser.status !== 'active') {
        res.status(403).json({ message: 'Admin account is inactive' });
        return;
      }

      req.adminUser = adminUser;
      next();
    } catch (error) {
      console.error('Admin authorization failed:', error);
      res.status(500).json({ message: 'Failed to authorize admin user' });
    }
  }

  static requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
    if (req.adminUser?.role !== 'super_admin') {
      res.status(403).json({ message: 'Super admin access required' });
      return;
    }
    next();
  }

  static requireActiveLguAdmin(req: Request, res: Response, next: NextFunction): void {
    if (req.adminUser?.role !== 'lgu_admin' || !req.adminUser.clientId) {
      res.status(403).json({ message: 'LGU admin access required' });
      return;
    }
    next();
  }

  static async requireClientAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestedClientId =
      (typeof req.params.clientId === 'string' && req.params.clientId) ||
      (typeof req.query.clientId === 'string' && req.query.clientId) ||
      (typeof req.body?.clientId === 'string' && req.body.clientId);

    if (!canAccessClientScope(req.adminUser, requestedClientId || null)) {
      res.status(403).json({ message: 'Client access denied' });
      return;
    }

    if (req.adminUser?.role === 'super_admin') {
      next();
      return;
    }

    try {
      const client = req.adminUser?.clientId ? await ClientModel.getClientById(req.adminUser.clientId) : null;
      if (!client || !canLguAdminUseClient(client.status)) {
        res.status(403).json({ message: 'LGU client is not active' });
        return;
      }
    } catch (error) {
      console.error('Client authorization failed:', error);
      res.status(500).json({ message: 'Failed to authorize client access' });
      return;
    }

    next();
  }

  static async blockLguWritesWhenClientDeletionScheduled(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (req.adminUser?.role !== 'lgu_admin') {
      next();
      return;
    }

    try {
      const client = req.adminUser.clientId ? await ClientModel.getClientById(req.adminUser.clientId) : null;
      if (!client || !isClientWritableByLguAdmin(client.status)) {
        res.status(423).json({
          message:
            client?.status === 'deletion_scheduled'
              ? 'LGU write operations are locked because this client is scheduled for deletion'
              : 'LGU client is not writable',
          clientStatus: client?.status ?? null,
          deletionEffectiveAt: client?.deletionEffectiveAt ?? null,
        });
        return;
      }
    } catch (error) {
      console.error('Client write authorization failed:', error);
      res.status(500).json({ message: 'Failed to authorize client write access' });
      return;
    }

    next();
  }
}
