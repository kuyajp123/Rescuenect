import { UserDataModel } from '@/models/mobile/UserDataModel';
import { Request, Response } from 'express';

export class UserDataController {
  static async saveLocationController(req: Request, res: Response): Promise<void> {
    const { uid, id, label, location, lat, lng } = req.body;

    if (!label || !location || lat === undefined || lng === undefined) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    if (!uid) {
      res.status(401).json({ message: 'Missing user identification' });
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
    const uid = req.query.uid as string;

    if (!uid) {
      res.status(401).json({ message: 'Missing user identification' });
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
    const { uid, id } = req.body;

    if (!uid || !id) {
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
    const { uid, notificationId } = req.body;

    if (!uid || !notificationId) {
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
    const { uid, notificationId } = req.body;

    if (!uid || !notificationId) {
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
}
