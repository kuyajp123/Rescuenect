import { sendDangerZoneError } from '@/controllers/dangerZoneError';
import { DangerZoneModel } from '@/models/DangerZoneModel';
import { AdminUser } from '@/types/admin';
import { Request, Response } from 'express';

const getAdminUser = (req: Request, res: Response): AdminUser | null => {
  if (!req.adminUser) {
    res.status(401).json({ message: 'Missing admin context' });
    return null;
  }

  return req.adminUser;
};

export class DangerZoneController {
  static async getReports(req: Request, res: Response): Promise<void> {
    const adminUser = getAdminUser(req, res);
    if (!adminUser) return;

    try {
      const reports = await DangerZoneModel.listResidentReports(adminUser, {
        clientId: typeof req.query.clientId === 'string' ? req.query.clientId : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
      });
      res.status(200).json({ reports });
    } catch (error) {
      sendDangerZoneError(res, error, 'Failed to get danger-zone reports');
    }
  }

  static async getZones(req: Request, res: Response): Promise<void> {
    const adminUser = getAdminUser(req, res);
    if (!adminUser) return;

    try {
      const zones = await DangerZoneModel.listZones(adminUser, {
        clientId: typeof req.query.clientId === 'string' ? req.query.clientId : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
      });
      res.status(200).json({ zones });
    } catch (error) {
      sendDangerZoneError(res, error, 'Failed to get danger zones');
    }
  }

  static async createOfficial(req: Request, res: Response): Promise<void> {
    const adminUser = getAdminUser(req, res);
    if (!adminUser) return;

    try {
      const zone = await DangerZoneModel.createOfficialZone(adminUser, req.body);
      res.status(201).json({ message: 'Official danger zone created', data: zone });
    } catch (error) {
      sendDangerZoneError(res, error, 'Failed to create official danger zone');
    }
  }

  static async verifyReport(req: Request, res: Response): Promise<void> {
    const adminUser = getAdminUser(req, res);
    if (!adminUser) return;

    try {
      const zone = await DangerZoneModel.verifyReport(adminUser, req.body?.id, req.body);
      res.status(200).json({ message: 'Danger-zone report verified', data: zone });
    } catch (error) {
      sendDangerZoneError(res, error, 'Failed to verify danger-zone report');
    }
  }

  static async rejectReport(req: Request, res: Response): Promise<void> {
    const adminUser = getAdminUser(req, res);
    if (!adminUser) return;

    try {
      const zone = await DangerZoneModel.rejectReport(adminUser, req.body?.id, req.body?.rejectionReason);
      res.status(200).json({ message: 'Danger-zone report rejected', data: zone });
    } catch (error) {
      sendDangerZoneError(res, error, 'Failed to reject danger-zone report');
    }
  }

  static async updateZone(req: Request, res: Response): Promise<void> {
    const adminUser = getAdminUser(req, res);
    if (!adminUser) return;

    try {
      const zone = await DangerZoneModel.updateZone(adminUser, req.body?.id, req.body);
      res.status(200).json({ message: 'Danger zone updated', data: zone });
    } catch (error) {
      sendDangerZoneError(res, error, 'Failed to update danger zone');
    }
  }

  static async resolveZone(req: Request, res: Response): Promise<void> {
    const adminUser = getAdminUser(req, res);
    if (!adminUser) return;

    try {
      const zone = await DangerZoneModel.resolveZone(adminUser, req.body?.id);
      res.status(200).json({ message: 'Danger zone resolved', data: zone });
    } catch (error) {
      sendDangerZoneError(res, error, 'Failed to resolve danger zone');
    }
  }
}
