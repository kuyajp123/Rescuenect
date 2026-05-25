import { verifyFirebaseConnection } from '@/db/firestoreConfig';
import { AdminAuthModel } from '@/models/admin/AdminAuthModel';
import { ClientModel } from '@/models/admin/ClientModel';
import { LegacyNaicMigrationModel } from '@/models/admin/LegacyNaicMigrationModel';
import { LguRequestModel } from '@/models/admin/LguRequestModel';
import { PsgcService } from '@/services/PsgcService';
import { Request, Response } from 'express';

export class SuperAdminController {
  static async backfillLegacyNaicData(req: Request, res: Response): Promise<void> {
    try {
      const dryRun = req.query.dryRun === 'true' || req.body?.dryRun === true;
      const summary = await LegacyNaicMigrationModel.backfillNaicClientId({ dryRun });
      res.status(200).json({ summary });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to backfill legacy Naic data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

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

  static async getClientDetails(req: Request, res: Response): Promise<void> {
    try {
      const client = await ClientModel.getClientById(req.params.clientId);
      if (!client) {
        res.status(404).json({ message: 'Client not found' });
        return;
      }

      const [request, admins] = await Promise.all([
        LguRequestModel.getRequestForClient(client.id, client.requestId),
        AdminAuthModel.listAdminsByClient(client.id),
      ]);

      res.status(200).json({ client, request, admins });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch client details' });
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

  static async deleteClient(req: Request, res: Response): Promise<void> {
    try {
      if (req.params.clientId === 'naic') {
        res.status(400).json({ message: 'Default Naic client cannot be deleted' });
        return;
      }

      const client = await ClientModel.getClientById(req.params.clientId);
      if (!client) {
        res.status(404).json({ message: 'Client not found' });
        return;
      }

      if (client.status === 'active') {
        res.status(400).json({ success: false, message: 'Deactivate the client before deleting it' });
        return;
      }

      const affectedAdmins = await AdminAuthModel.deactivateAdminsForClient(client.id, req.adminUser?.uid || 'system');
      await ClientModel.deleteClient(client.id);
      res.status(200).json({ client, affectedAdmins });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete client' });
    }
  }

  static async getAdmins(_req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ admins: await AdminAuthModel.listLguAdmins() });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch LGU admin users' });
    }
  }

  static async inviteAdmin(req: Request, res: Response): Promise<void> {
    try {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const role = req.body?.role === 'super_admin' ? 'super_admin' : 'lgu_admin';
      const clientId = typeof req.body?.clientId === 'string' ? req.body.clientId.trim() : null;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ message: 'Valid email is required' });
        return;
      }

      if (role === 'super_admin') {
        res.status(400).json({ message: 'Super admins must be configured with SUPER_ADMIN_EMAILS' });
        return;
      }

      const client = clientId ? await ClientModel.getClientById(clientId) : null;
      if (!client) {
        res.status(400).json({ message: 'Valid clientId is required for LGU admin invites' });
        return;
      }

      const invitation = await AdminAuthModel.createInvitation({
        email,
        role: 'lgu_admin',
        clientId,
        clientName: client.name,
        invitedBy: req.adminUser?.uid || 'system',
      });

      res.status(201).json({ invitation });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create admin invitation' });
    }
  }

  static async updateAdmin(req: Request, res: Response): Promise<void> {
    try {
      const status = req.body?.status === 'inactive' ? 'inactive' : req.body?.status === 'active' ? 'active' : null;
      if (!status) {
        res.status(400).json({ message: 'Valid status is required' });
        return;
      }

      if (req.params.uid === req.adminUser?.uid && status === 'inactive') {
        res.status(400).json({ message: 'You cannot deactivate your own super admin account' });
        return;
      }

      const admin = await AdminAuthModel.updateAdminStatus(req.params.uid, status);
      res.status(200).json({ admin });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update admin user' });
    }
  }

  static async deleteAdmin(req: Request, res: Response): Promise<void> {
    try {
      if (req.params.uid === req.adminUser?.uid) {
        res.status(400).json({ message: 'You cannot delete your own admin account' });
        return;
      }

      const admin = await AdminAuthModel.deleteLguAdmin(req.params.uid, req.adminUser?.uid || 'system');
      res.status(200).json({ admin });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete admin user' });
    }
  }

  static async getSystemStatus(_req: Request, res: Response): Promise<void> {
    try {
      const firebaseConnected = await verifyFirebaseConnection();
      const psgc = PsgcService.getStatus();
      const weatherConfigured = Boolean(process.env.WEATHER_API_KEY || process.env.TOMORROW_IO_API_KEY);

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
