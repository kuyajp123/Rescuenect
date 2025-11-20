import { ConfigModels } from '@/models/admin/ConfigModels';
import { Request, Response } from 'express';

export class ConfigController {
  static async FCMTokenUpdate(req: Request, res: Response): Promise<void> {
    const { uid, fcmToken } = req.body;

    try {
      if (!uid) {
        console.error('❌ Missing uid in request body');
        res.status(400).json({ message: 'Missing uid in request body' });
        return;
      }

      const result = await ConfigModels.updateFcmToken(uid, fcmToken);
      res.status(200).json({ message: 'FCM Token updated successfully', result });
    } catch (error) {
      console.error('❌ FCM Token update failed:', {
        uid,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to update FCM Token',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }
}
