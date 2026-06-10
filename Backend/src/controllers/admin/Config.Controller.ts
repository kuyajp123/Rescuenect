import { ConfigModels } from '@/models/admin/ConfigModels';
import { Request, Response } from 'express';

export class ConfigController {
  static async FCMTokenUpdate(req: Request, res: Response): Promise<void> {
    const { uid, fcmToken } = req.body;

    try {
      if (typeof uid !== 'string' || !uid.trim()) {
        console.error('❌ Missing uid in request body');
        res.status(400).json({ message: 'Missing uid in request body' });
        return;
      }

      const normalizedUid = uid.trim();

      if (req.user?.uid !== normalizedUid) {
        res.status(403).json({ message: 'You can only update your own FCM token' });
        return;
      }

      if (fcmToken !== null && fcmToken !== undefined && typeof fcmToken !== 'string') {
        res.status(400).json({ message: 'FCM token must be a string or null' });
        return;
      }

      const normalizedToken = typeof fcmToken === 'string' && fcmToken.trim() ? fcmToken.trim() : null;
      if (normalizedToken && normalizedToken.length > 4096) {
        res.status(400).json({ message: 'FCM token is too long' });
        return;
      }

      const result = await ConfigModels.updateFcmToken(normalizedUid, normalizedToken);
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
