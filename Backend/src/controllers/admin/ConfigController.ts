import { ConfigModels } from '@/models/admin/ConfigModels';
import { Request, Response } from 'express';

export class ConfigController {
  static async FCMTokenUpdate(req: Request, res: Response): Promise<void> {
    const { uid, fcmToken } = req.body;

    try {
      const result = await ConfigModels.updateFcmToken(uid, fcmToken);
      res.status(200).json({ message: 'FCM Token updated successfully', result });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to update FCM Token',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }
}
