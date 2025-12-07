import { UnifiedModel } from '@/models/unified/index';
import { Request, Response } from 'express';

export class UnifiedController {
  static async getCenters(req: Request, res: Response): Promise<void> {
    try {
      const centers = await UnifiedModel.getCenters();
      res.status(200).json(centers);
    } catch (error) {
      console.error('❌ Failed to add evacuation center:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to add evacuation center',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async getNotificationDetails(req: Request, res: Response): Promise<void> {
    try {
      const notificationId = req.query.id as string;
      if (!notificationId) {
        res.status(400).json({ message: 'Notification ID is required' });
        return;
      }

      const notificationDetails = await UnifiedModel.getNotificationDetails(notificationId);
      res.status(200).json(notificationDetails);
    } catch (error) {
      console.error('❌ Failed to get notification details:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to get notification details',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId, userId } = req.body;
      if (!notificationId || !userId) {
        res.status(400).json({ message: 'Notification ID and User ID are required' });
        return;
      }

      await UnifiedModel.markNotificationAsRead(notificationId, userId);
      res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('❌ Failed to get notification details:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to get notification details',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async markNotificationAsHidden(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId, userId } = req.body;
      if (!notificationId || !userId) {
        res.status(400).json({ message: 'Notification ID and User ID are required' });
        return;
      }

      await UnifiedModel.markNotificationAsHidden(notificationId, userId);
      res.status(200).json({ message: 'Notification marked as hidden' });
    } catch (error) {
      console.error('❌ Failed to get notification details:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to get notification details',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async getResidentStatuses(req: Request, res: Response): Promise<void> {
    try {
      const residentId = req.query.residentId as string;
      if (!residentId) {
        res.status(400).json({ message: 'Resident ID is required' });
        return;
      }

      const statuses = await UnifiedModel.getResidentStatuses(residentId);
      res.status(200).json({ statuses });
    } catch (error) {
      console.error('❌ Failed to get resident statuses:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to get resident statuses',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { userId, notificationId } = req.body;
      if (!userId || !notificationId) {
        res.status(400).json({ message: 'User ID and Notification IDs are required' });
        return;
      }
      for (const notif of notificationId) {
        await UnifiedModel.markNotificationAsRead(notif.notificationId, userId);
      }
      res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('❌ Failed to get resident statuses:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to get resident statuses',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }
}
