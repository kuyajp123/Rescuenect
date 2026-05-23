import { UnifiedModel } from '@/models/unified/index';
import { Request, Response } from 'express';

const getAuthenticatedUid = (req: Request, res: Response): string | null => {
  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ message: 'Missing user identification' });
    return null;
  }

  return uid;
};

export class UnifiedController {
  static async getCenters(req: Request, res: Response): Promise<void> {
    try {
      const centers = await UnifiedModel.getCenters(
        typeof req.query.clientId === 'string' ? req.query.clientId : undefined
      );
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
      const uid = getAuthenticatedUid(req, res);
      if (!uid) {
        return;
      }

      const { notificationId } = req.body;
      if (!notificationId) {
        res.status(400).json({ message: 'Notification ID is required' });
        return;
      }

      await UnifiedModel.markNotificationAsRead(notificationId, uid);
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
      const uid = getAuthenticatedUid(req, res);
      if (!uid) {
        return;
      }

      const { notificationId } = req.body;
      if (!notificationId) {
        res.status(400).json({ message: 'Notification ID is required' });
        return;
      }

      await UnifiedModel.markNotificationAsHidden(notificationId, uid);
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
      const uid = getAuthenticatedUid(req, res);
      if (!uid) {
        return;
      }

      const residentId = (req.query.residentId as string) || uid;
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
      const uid = getAuthenticatedUid(req, res);
      if (!uid) {
        return;
      }

      const { notificationIds } = req.body;
      if (!notificationIds || !Array.isArray(notificationIds)) {
        res.status(400).json({ message: 'Notification IDs array is required' });
        return;
      }

      await UnifiedModel.markAllNotificationsAsRead(uid, notificationIds);
      res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('❌ Failed to mark all as read:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to mark all as read',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async markAllNotificationsAsHidden(req: Request, res: Response): Promise<void> {
    try {
      const uid = getAuthenticatedUid(req, res);
      if (!uid) {
        return;
      }

      const { notificationIds } = req.body;
      if (!notificationIds || !Array.isArray(notificationIds)) {
        res.status(400).json({ message: 'Notification IDs array is required' });
        return;
      }

      await UnifiedModel.markAllNotificationsAsHidden(uid, notificationIds);
      res.status(200).json({ message: 'All notifications marked as hidden' });
    } catch (error) {
      console.error('❌ Failed to mark all as hidden:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to mark all as hidden',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async getAllAnnouncements(req: Request, res: Response): Promise<void> {
    try {
      const announcements = await UnifiedModel.getAllAnnouncements(
        typeof req.query.clientId === 'string' ? req.query.clientId : undefined
      );
      res.status(200).json(announcements);
    } catch (error) {
      console.error('❌ Failed to get all announcements:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to get announcements',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async getAnnouncementDetails(req: Request, res: Response): Promise<void> {
    try {
      const announcementId = req.query.id as string;
      if (!announcementId) {
        res.status(400).json({ message: 'Announcement ID is required' });
        return;
      }
      const announcement = await UnifiedModel.getAnnouncementById(
        announcementId,
        typeof req.query.clientId === 'string' ? req.query.clientId : undefined
      );
      if (!announcement) {
        res.status(404).json({ message: 'Announcement not found' });
        return;
      }
      res.status(200).json(announcement);
    } catch (error) {
      console.error('❌ Failed to get announcement details:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to get announcement details',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }
}
