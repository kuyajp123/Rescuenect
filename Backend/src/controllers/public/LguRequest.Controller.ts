import { LguRequestModel } from '@/models/admin/LguRequestModel';
import { Request, Response } from 'express';

export class PublicLguRequestController {
  static async createRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestId = await LguRequestModel.createRequest(req.body);
      res.status(201).json({ message: 'LGU request submitted', requestId });
    } catch (error) {
      const fieldErrors = (error as Error & { fieldErrors?: Record<string, string> }).fieldErrors;
      if (fieldErrors) {
        res.status(400).json({
          message: 'Validation failed',
          fieldErrors,
          errors: Object.values(fieldErrors),
        });
        return;
      }

      console.error('Failed to create LGU request:', error);
      res.status(500).json({
        message: 'Failed to submit LGU request',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
