import { StatusModel } from '@/models/StatusModel';
import { Request, Response, NextFunction } from 'express';

export class StatusController {
  static async createStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    const data = req.body;
    const file = req.file;

    try {
      // Extract uid from the request body (frontend sends 'uid', not 'userId')
      const { uid, ...rawStatusData } = data;

      // Validate uid exists
      if (!uid) {
        res.status(400).json({ message: 'uid is required in request body' });
        return;
      }

      // Parse FormData string values back to proper types
      const statusData = {
        ...rawStatusData,
        // Parse boolean fields
        shareLocation: rawStatusData.shareLocation === 'true' || rawStatusData.shareLocation === true,
        shareContact: rawStatusData.shareContact === 'true' || rawStatusData.shareContact === true,
        // Parse number fields
        expirationDuration: rawStatusData.expirationDuration
          ? parseInt(rawStatusData.expirationDuration.toString()) || 24
          : 24,
        lat: rawStatusData.lat ? parseFloat(rawStatusData.lat.toString()) : null,
        lng: rawStatusData.lng ? parseFloat(rawStatusData.lng.toString()) : null,
      };

      const result = await StatusModel.createOrUpdateStatus(uid, file, statusData);

      // Check if no changes were detected
      if (result && typeof result === 'object' && 'updated' in result && result.updated === false) {
        res.status(200).json({
          message: 'No changes detected',
          data: result,
          reason: result.reason || 'Status remains the same',
        });
        return;
      }

      res.status(201).json({ message: 'Status created/updated successfully', data: result });
      return;
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to create status', error: error.message });
      console.error('Status creation error:', error);
      // next(error);
    }
  }

  static async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    const uid = req.params.uid;

    try {
      const status = await StatusModel.getActiveStatus(uid);

      // ✅ Fix: Always send a response
      if (status) {
        res.status(200).json({ message: 'Status fetched successfully', data: status });
      } else {
        // ✅ Fix: Return proper response when no status found
        res.status(200).json({ message: 'No status found for user', data: null });
      }
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch status', error: error.message });
      console.error('Status fetching error:', error);
    }
  }

  static async deleteStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    console.log('req.body: ', req.body);
    console.log('req.params: ', req.params);
    const uid = req.params.uid;
    const { parentId } = req.body;

    try {
      const result = await StatusModel.deleteStatus(uid, parentId);
      res.status(200).json({ message: 'Status deleted successfully', data: result });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to delete status', error: error.message });
      console.error('Status deletion error:', error);
    }
  }
}
