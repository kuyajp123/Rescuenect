import { UserDataModel } from '@/models/mobile/UserDataModel';
import { Request, Response } from 'express';

const getAuthenticatedUid = (req: Request, res: Response): string | null => {
  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ message: 'Missing user identification' });
    return null;
  }

  return uid;
};

export class UserDataController {
  static async getProfileController(req: Request, res: Response): Promise<void> {
    const uid = getAuthenticatedUid(req, res);
    if (!uid) {
      return;
    }

    try {
      const profile = await UserDataModel.getUserProfile(uid);

      if (!profile) {
        res.status(404).json({ message: 'User profile not found' });
        return;
      }

      res.status(200).json({ user: profile });
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async saveLocationController(req: Request, res: Response): Promise<void> {
    const uid = getAuthenticatedUid(req, res);
    if (!uid) {
      return;
    }

    const { id, label, location, lat, lng } = req.body;

    if (!label || !location || lat === undefined || lng === undefined) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const idCreation = (lat: number, lng: number, label: string) => {
      return `${label}-${lat.toFixed(6)}-${lng.toFixed(6)}-${Math.random().toString(36).substring(2, 8)}`;
    };

    try {
      let idToUse = id;
      if (!idToUse) {
        idToUse = idCreation(lat, lng, label);
      }

      const result = await UserDataModel.saveLocationData(uid, idToUse, label, location, lat, lng);

      const message =
        result.operationType === 'updated' ? 'Location updated successfully' : 'Location saved successfully';

      res.status(200).json({
        message,
        id: idToUse,
        operationType: result.operationType,
        data: result,
      });
    } catch (error: any) {
      console.error('Error saving location:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getLocationsController(req: Request, res: Response): Promise<void> {
    const uid = getAuthenticatedUid(req, res);
    if (!uid) {
      return;
    }

    try {
      const locations = await UserDataModel.getLocationData(uid);
      res.status(200).json({ savedLocations: locations });
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async deleteLocationController(req: Request, res: Response): Promise<void> {
    const uid = getAuthenticatedUid(req, res);
    if (!uid) {
      return;
    }

    const { id } = req.body;

    if (!id) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    try {
      const result = await UserDataModel.deleteLocationData(uid, id);
      res.status(200).json({
        message: 'Location deleted successfully',
        id: result.id,
        operationType: result.operationType,
      });
    } catch (error: any) {
      console.error('Error deleting location:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async markNotificationAsReadInStatusResolvedController(req: Request, res: Response): Promise<void> {
    const uid = getAuthenticatedUid(req, res);
    if (!uid) {
      return;
    }

    const { notificationId } = req.body;

    if (!notificationId) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    try {
      const result = await UserDataModel.markNotificationAsReadInStatusResolved(uid, notificationId);
      res.status(200).json({
        message: 'Notification marked as read successfully',
        notificationId: result.notificationId,
        operationType: result.operationType,
      });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async markNotificationAsDeletedController(req: Request, res: Response): Promise<void> {
    const uid = getAuthenticatedUid(req, res);
    if (!uid) {
      return;
    }

    const { notificationId } = req.body;

    if (!notificationId) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    try {
      const result = await UserDataModel.markNotificationAsDeleted(uid, notificationId);
      res.status(200).json({
        message: 'Notification marked as deleted successfully',
        notificationId: result.notificationId,
        operationType: result.operationType,
      });
    } catch (error: any) {
      console.error('Error marking notification as deleted:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async updateFcmTokenController(req: Request, res: Response): Promise<void> {
    const uid = getAuthenticatedUid(req, res);
    if (!uid) {
      return;
    }

    const { fcmToken } = req.body;

    if (!fcmToken) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    try {
      const result = await UserDataModel.updateFcmToken(uid, fcmToken);
      res.status(200).json({
        message: 'FCM token updated successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Error updating FCM token:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async removeFcmTokenController(req: Request, res: Response): Promise<void> {
    const uid = getAuthenticatedUid(req, res);
    if (!uid) {
      return;
    }

    const { fcmToken } = req.body;

    if (!fcmToken) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    try {
      const result = await UserDataModel.removeFcmToken(uid, fcmToken);
      res.status(200).json({
        message: 'FCM token removed successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Error removing FCM token:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getFcmTokensController(req: Request, res: Response): Promise<void> {
    const uid = getAuthenticatedUid(req, res);
    if (!uid) {
      return;
    }

    try {
      const tokens = await UserDataModel.getFcmTokens(uid);
      res.status(200).json({ fcmTokens: tokens });
    } catch (error: any) {
      console.error('Error fetching FCM tokens:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
