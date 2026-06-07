import { MobileAppReleaseModel } from '@/models/public/MobileAppReleaseModel';
import { MobileAppReleaseUploadService, type EasBuildWebhookPayload } from '@/services/mobileAppReleaseUpload';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request, Response } from 'express';

const normalizeSignature = (value: string | undefined): string => {
  const signature = value?.trim() ?? '';
  if (!signature) return '';
  return signature.startsWith('sha1=') ? signature : `sha1=${signature}`;
};

const signaturesMatch = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

const verifyEasSignature = (req: Request, secret: string): boolean => {
  const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
  const expectedSignature = `sha1=${createHmac('sha1', secret).update(rawBody).digest('hex')}`;
  const receivedSignature = normalizeSignature(req.header('expo-signature'));

  return signaturesMatch(expectedSignature, receivedSignature);
};

export class PublicMobileAppController {
  static async getLatestRelease(_req: Request, res: Response): Promise<void> {
    try {
      const release = await MobileAppReleaseModel.getLatestAndroidRelease();
      res.status(200).json({ release });
    } catch (error) {
      console.error('Failed to fetch latest mobile app release:', error);
      res.status(500).json({ message: 'Failed to fetch latest mobile app release' });
    }
  }

  static async handleEasWebhook(req: Request, res: Response): Promise<void> {
    try {
      const webhookSecret = process.env.EAS_WEBHOOK_SECRET?.trim();
      if (!webhookSecret) {
        console.error('EAS_WEBHOOK_SECRET is not configured.');
        res.status(503).json({ message: 'EAS webhook is not configured' });
        return;
      }

      if (!verifyEasSignature(req, webhookSecret)) {
        res.status(401).json({ message: 'Invalid EAS webhook signature' });
        return;
      }

      const result = await MobileAppReleaseUploadService.processEasWebhook(req.body as EasBuildWebhookPayload);
      res.status(200).json(result);
    } catch (error) {
      console.error('Failed to process EAS mobile app webhook:', error);
      res.status(500).json({ message: 'Failed to process EAS mobile app webhook' });
    }
  }
}
