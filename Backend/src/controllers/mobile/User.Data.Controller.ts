import { UserDataModel } from '@/models/mobile/User.Data.Model';
import { Request, Response } from 'express';

export class UserDataController {
  static async saveLocationController(req: Request, res: Response): Promise<void> {
    const { uid, label, location, coordinates } = req.body;

    if (!label || !location || !coordinates) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    if (!uid) {
      res.status(401).json({ message: 'Missing user identification' });
      return;
    }

    try {
      const userLocationData = {
        uid,
        label,
        location,
        coordinates,
      };

      const result = await UserDataModel.saveLocationData(userLocationData);

      res.status(200).json({ message: 'Location saved successfully', data: result });
    } catch (error: any) {
      console.error('Error saving location:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
