import { StatusModel } from '@/models/admin/StatusModel';
import { NextFunction, Request, Response } from 'express';

export class StatusController {
  static async getVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    const uid = req.query.uid as string;
    const parentId = req.query.parentId as string;

    // Validate required parameters
    if (!uid || !parentId) {
      console.error('❌ Missing required parameters:', { uid, parentId });
      res.status(400).json({
        message: 'Missing required parameters: uid and parentId are required',
        received: { uid, parentId },
      });
      return;
    }

    try {
      const versions = await StatusModel.getVersions(uid, parentId);

      res.json({
        success: true,
        versions,
        count: versions.length,
      });
      return;
    } catch (error) {
      console.error('❌ Error in getVersions:', error);
      res.status(500).json({
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error)?.stack : undefined,
      });
      return;
    }
  }

  static async getAllLatestStatuses(req: Request, res: Response): Promise<void> {
    try {
      const statuses = await StatusModel.getAllLatestStatuses();
      res.status(200).json({ statuses });
    } catch (error) {
      console.error('❌ Failed to get all latest statuses:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to get all latest statuses',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }
}
