import { UserDataModel } from '@/models/mobile/User.Data.Model';
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
}
