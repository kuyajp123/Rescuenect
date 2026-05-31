import { db } from '@/db/firestoreConfig';
import { ClientModel } from '@/models/admin/ClientModel';
import { NextFunction, Request, Response } from 'express';

export class ResidentClientMiddleware {
  static async blockWritesWhenClientUnavailable(req: Request, res: Response, next: NextFunction): Promise<void> {
    const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ message: 'Missing user identification' });
      return;
    }

    try {
      const userSnap = await db.collection('users').doc(uid).get();
      const userData = userSnap.exists ? userSnap.data() ?? {} : {};
      const clientId = typeof userData.clientId === 'string' && userData.clientId.trim() ? userData.clientId.trim() : null;

      if (!clientId) {
        next();
        return;
      }

      const client = await ClientModel.getClientById(clientId);
      if (!client || client.status !== 'active') {
        res.status(client?.status === 'deletion_scheduled' ? 423 : 403).json({
          message:
            client?.status === 'deletion_scheduled'
              ? 'Client is scheduled for deletion and resident updates are locked'
              : 'Resident client is not active',
          clientStatus: client?.status ?? null,
          deletionEffectiveAt: client?.deletionEffectiveAt ?? null,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Failed to check resident client write access:', error);
      res.status(500).json({ message: 'Failed to verify resident client access' });
    }
  }
}
