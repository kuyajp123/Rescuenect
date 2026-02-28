import { Request, Response } from 'express';
import { ContactModel } from '@/models/admin/ContactModel';

export class ContactController {
  static async getContacts(req: Request, res: Response): Promise<void> {
    try {
      const data = await ContactModel.getContacts();
      res.status(200).json({ data });
    } catch (error) {
      console.error('❌ Failed to fetch contacts:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to fetch contacts',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async saveContacts(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      if (!payload || !Array.isArray(payload.categories) || !Array.isArray(payload.contacts)) {
        res.status(400).json({ message: 'Invalid contacts payload' });
        return;
      }

      const userId = (req as any).user?.uid || 'system';
      await ContactModel.saveContacts(payload, userId);
      res.status(200).json({ message: 'Contacts saved successfully' });
    } catch (error) {
      console.error('❌ Failed to save contacts:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to save contacts',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }
}
