import { UnifiedModel } from '@/models/unified/index';
import { Request, Response } from 'express';

export class UnifiedController {
  static async getCenters(req: Request, res: Response): Promise<void> {
    try {
      const centers = await UnifiedModel.getCenters();
      res.status(200).json(centers);
    } catch (error) {
      console.error('❌ Failed to add evacuation center:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to add evacuation center',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }
}
