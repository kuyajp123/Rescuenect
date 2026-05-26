import { AdminAuthModel } from '@/models/admin/AdminAuthModel';
import { ClientChangeRequestModel } from '@/models/admin/ClientChangeRequestModel';
import { ClientModel } from '@/models/admin/ClientModel';
import { Request, Response } from 'express';

export class LguAdminController {
  static async getClient(req: Request, res: Response): Promise<void> {
    try {
      const clientId = req.adminUser?.clientId;
      if (!clientId) {
        res.status(403).json({ message: 'LGU admin client scope is required' });
        return;
      }

      const client = await ClientModel.getClientById(clientId);
      if (!client) {
        res.status(404).json({ message: 'Client not found' });
        return;
      }

      const admins = await AdminAuthModel.listAdminsByClient(client.id);
      res.status(200).json({ client, admins });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch LGU client' });
    }
  }

  static async getChangeRequests(req: Request, res: Response): Promise<void> {
    try {
      const clientId = req.adminUser?.clientId;
      if (!clientId) {
        res.status(403).json({ message: 'LGU admin client scope is required' });
        return;
      }

      res.status(200).json({ requests: await ClientChangeRequestModel.listByClient(clientId) });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch change requests' });
    }
  }

  static async createChangeRequest(req: Request, res: Response): Promise<void> {
    try {
      const clientId = req.adminUser?.clientId;
      if (!clientId) {
        res.status(403).json({ message: 'LGU admin client scope is required' });
        return;
      }

      const request = await ClientChangeRequestModel.create({
        clientId,
        type: req.body?.type,
        proposedChanges:
          req.body?.proposedChanges && typeof req.body.proposedChanges === 'object' ? req.body.proposedChanges : {},
        requestedBy: req.adminUser?.uid || 'system',
        requestedByEmail: req.adminUser?.email ?? null,
      });

      res.status(201).json({ request });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to create change request',
      });
    }
  }

  static async cancelChangeRequest(req: Request, res: Response): Promise<void> {
    try {
      const clientId = req.adminUser?.clientId;
      if (!clientId) {
        res.status(403).json({ message: 'LGU admin client scope is required' });
        return;
      }

      const request = await ClientChangeRequestModel.cancel(req.params.id, clientId);
      res.status(200).json({ request });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to cancel change request',
      });
    }
  }
}
