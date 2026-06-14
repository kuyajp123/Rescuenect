import { sendDangerZoneError } from '@/controllers/dangerZoneError';
import { DangerZoneModel } from '@/models/DangerZoneModel';
import { RouteTelemetryService } from '@/services/RouteTelemetryService';
import { AdminUser } from '@/types/admin';
import { canonicalizeClientId } from '@/config/locationConfig';
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
        severity: typeof req.query.severity === 'string' ? req.query.severity : undefined,
        geometryType: typeof req.query.geometryType === 'string' ? req.query.geometryType : undefined,
        source: typeof req.query.source === 'string' ? req.query.source : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        pageSize: typeof req.query.pageSize === 'string' ? req.query.pageSize : undefined,
        cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
      });
      res.status(200).json({ reports: reports.items, pagination: reports.pagination });
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
        severity: typeof req.query.severity === 'string' ? req.query.severity : undefined,
        geometryType: typeof req.query.geometryType === 'string' ? req.query.geometryType : undefined,
        source: typeof req.query.source === 'string' ? req.query.source : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        pageSize: typeof req.query.pageSize === 'string' ? req.query.pageSize : undefined,
        cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
      });
      res.status(200).json({ zones: zones.items, pagination: zones.pagination });
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

  static async getAnalytics(req: Request, res: Response): Promise<void> {
    const adminUser = getAdminUser(req, res);
    if (!adminUser) return;

    try {
      const analytics = await DangerZoneModel.getAnalytics(adminUser, {
        clientId: typeof req.query.clientId === 'string' ? req.query.clientId : undefined,
      });
      res.status(200).json({ analytics });
    } catch (error) {
      sendDangerZoneError(res, error, 'Failed to get danger-zone analytics');
    }
  }

  static async getRoutingOperations(req: Request, res: Response): Promise<void> {
    const adminUser = getAdminUser(req, res);
    if (!adminUser) return;

    try {
      const clientId = adminUser.role === 'lgu_admin'
        ? canonicalizeClientId(adminUser.clientId)
        : canonicalizeClientId(typeof req.query.clientId === 'string' ? req.query.clientId : undefined);
      if (!clientId) {
        res.status(400).json({ message: 'clientId is required' });
        return;
      }

      const windowHours = typeof req.query.windowHours === 'string' ? Number(req.query.windowHours) : 24;
      const operations = await RouteTelemetryService.getOperationsSummary(clientId, Number.isFinite(windowHours) ? windowHours : 24);
      res.status(200).json({ operations });
    } catch (error) {
      sendDangerZoneError(res, error, 'Failed to get evacuation routing operations');
    }
  }
}
