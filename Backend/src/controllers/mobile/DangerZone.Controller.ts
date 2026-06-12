import { sendDangerZoneError } from '@/controllers/dangerZoneError';
import { DangerZoneModel } from '@/models/DangerZoneModel';
import { Request, Response } from 'express';

const getAuthenticatedUid = (req: Request, res: Response): string | null => {
  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ message: 'Missing user identification' });
    return null;
  }

  return uid;
};

export class DangerZoneController {
  static async createReport(req: Request, res: Response): Promise<void> {
    const uid = getAuthenticatedUid(req, res);
    if (!uid) return;

    try {
      const report = await DangerZoneModel.createResidentReport(uid, req.body, req.file);
      res.status(201).json({ message: 'Danger-zone report submitted for LGU verification', data: report });
    } catch (error) {
      sendDangerZoneError(res, error, 'Failed to create danger-zone report');
    }
  }

  static async getMyReports(req: Request, res: Response): Promise<void> {
    const uid = getAuthenticatedUid(req, res);
    if (!uid) return;

    try {
      const reports = await DangerZoneModel.getResidentReports(uid);
      res.status(200).json({ reports });
    } catch (error) {
      sendDangerZoneError(res, error, 'Failed to get danger-zone reports');
    }
  }
}
