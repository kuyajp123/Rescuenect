import { sendDangerZoneError } from '@/controllers/dangerZoneError';
import { DangerZoneModel } from '@/models/DangerZoneModel';
import { Request, Response } from 'express';

export class DangerZoneController {
  static async getPublic(req: Request, res: Response): Promise<void> {
    try {
      const zones = await DangerZoneModel.listPublicVerifiedActive(req.query.clientId, {
        bbox: typeof req.query.bbox === 'string' ? req.query.bbox : undefined,
        limit: typeof req.query.limit === 'string' ? req.query.limit : undefined,
      });
      res.status(200).json({ zones });
    } catch (error) {
      sendDangerZoneError(res, error, 'Failed to get public danger zones');
    }
  }
}
