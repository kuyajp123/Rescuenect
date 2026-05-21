import { verifyFirebaseConnection } from '@/db/firestoreConfig';
import { AdminAuthModel } from '@/models/admin/AdminAuthModel';
import { ClientModel } from '@/models/admin/ClientModel';
import { LguRequestModel } from '@/models/admin/LguRequestModel';
import { PsgcService } from '@/services/PsgcService';
import { Request, Response } from 'express';

export class SuperAdminController {
  static async getLguRequests(_req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ requests: await LguRequestModel.listRequests() });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch LGU requests' });
    }
  }

  static async approveLguRequest(req: Request, res: Response): Promise<void> {
    try {
      const request = await LguRequestModel.approveRequest(
        req.params.id,
        req.adminUser?.uid || 'system',
        typeof req.body?.reviewNote === 'string' ? req.body.reviewNote : undefined
      );
      res.status(200).json({ request });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to approve request' });
    }
  }

  static async rejectLguRequest(req: Request, res: Response): Promise<void> {
    try {
      const request = await LguRequestModel.rejectRequest(
        req.params.id,
        req.adminUser?.uid || 'system',
        typeof req.body?.reviewNote === 'string' ? req.body.reviewNote : undefined
      );
      res.status(200).json({ request });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to reject request' });
    }
  }

  static async getClients(_req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ clients: await ClientModel.listClients() });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch clients' });
    }
  }

  static async updateClient(req: Request, res: Response): Promise<void> {
    try {
      const client = await ClientModel.updateClient(req.params.clientId, req.body || {});
      res.status(200).json({ client });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update client' });
    }
  }

  static async activateClient(req: Request, res: Response): Promise<void> {
    try {
      const client = await ClientModel.setClientStatus(req.params.clientId, 'active');
      res.status(200).json({ client });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to activate client' });
    }
  }

  static async deactivateClient(req: Request, res: Response): Promise<void> {
    try {
      const client = await ClientModel.setClientStatus(req.params.clientId, 'inactive');
      res.status(200).json({ client });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to deactivate client' });
    }
  }

  static async getAdmins(_req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ admins: await AdminAuthModel.listAdmins() });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch admin users' });
    }
  }

  static async getSystemStatus(_req: Request, res: Response): Promise<void> {
    try {
      const firebaseConnected = await verifyFirebaseConnection();
      const psgc = PsgcService.getStatus();
      const weatherConfigured = Boolean(process.env.TOMORROW_API_KEY || process.env.TOMORROW_IO_API_KEY);

      res.status(firebaseConnected ? 200 : 503).json({
        status: firebaseConnected ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        backend: {
          status: 'ok',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
        firebase: {
          connected: firebaseConnected,
        },
        psgc,
        weather: {
          configured: weatherConfigured,
          status: weatherConfigured ? 'configured' : 'missing_key',
        },
        earthquake: {
          status: 'configured',
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to compute system status' });
    }
  }
}
