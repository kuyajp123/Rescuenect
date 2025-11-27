import { EvacuationModel } from '@/models/admin/EvacuationModel';
import { Request, Response } from 'express';

export class EvacuationController {
  static async addCenter(req: Request, res: Response): Promise<void> {
    const centerData = req.body;
    try {
      const centerId = await EvacuationModel.addCenter(centerData);
      res.status(200).json({ message: 'Evacuation center added successfully', centerId });
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
