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

  static async getStatusHistory(req: Request, res: Response): Promise<void> {
    try {
      const statuses = await StatusModel.getStatusHistory();
      res.status(200).json({ statuses, totalCount: statuses.length });
    } catch (error) {
      console.error('❌ Failed to get status history:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to get status history',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async resolveStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    const uid = req.body.uid as string;
    const versionId = req.body.versionId as string;
    const resolvedNote = req.body.resolvedNote as string;

    // Validate required parameters
    if (!uid || !versionId) {
      console.error('❌ Missing required parameters:', { uid, versionId, resolvedNote });
      res.status(400).json({
        message: 'Missing required parameters: uid, versionId, and resolvedNote are required',
        received: { uid, versionId, resolvedNote },
      });
      return;
    }

    try {
      await StatusModel.resolveStatus(uid, versionId, resolvedNote);
      res.json({
        success: true,
        message: 'Status resolved successfully',
      });
      return;
    } catch (error) {
      console.error('❌ Error in resolveStatus:', error);
      res.status(500).json({
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error)?.stack : undefined,
      });
      return;
    }
  }
}
