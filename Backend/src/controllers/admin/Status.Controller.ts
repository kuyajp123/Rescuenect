import { StatusModel } from '@/models/admin/StatusModel';
import { getClientScopeFromRequest } from '@/utils/adminScope';
import { NextFunction, Request, Response } from 'express';

export class StatusController {
  private static setNoStoreHeaders(res: Response): void {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store',
    });
  }

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
      const versions = await StatusModel.getVersions(uid, parentId, getClientScopeFromRequest(req));

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

  static async getResidentStatuses(req: Request, res: Response): Promise<void> {
    const residentId = req.query.residentId as string;

    if (!residentId) {
      res.status(400).json({ message: 'Resident ID is required' });
      return;
    }

    try {
      const statuses = await StatusModel.getResidentStatuses(residentId, getClientScopeFromRequest(req));
      StatusController.setNoStoreHeaders(res);
      res.status(200).json({ statuses });
    } catch (error) {
      console.error('âŒ Failed to get resident statuses:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to get resident statuses',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async getAllLatestStatuses(req: Request, res: Response): Promise<void> {
    try {
      const statuses = await StatusModel.getAllLatestStatuses(getClientScopeFromRequest(req));
      StatusController.setNoStoreHeaders(res);
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
      const statuses = await StatusModel.getStatusHistory(getClientScopeFromRequest(req));
      StatusController.setNoStoreHeaders(res);
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
    const resolvedBy = req.body.resolvedBy as { name: string };

    // Validate required parameters
    if (!uid || !versionId || !resolvedBy) {
      console.error('❌ Missing required parameters:', { uid, versionId, resolvedNote, resolvedBy });
      res.status(400).json({
        message: 'Missing required parameters: uid, versionId, resolvedNote, and resolvedBy are required',
        received: { uid, versionId, resolvedNote, resolvedBy },
      });
      return;
    }

    try {
      await StatusModel.resolveStatus(uid, versionId, resolvedNote, resolvedBy, getClientScopeFromRequest(req));
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
