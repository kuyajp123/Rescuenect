import { EvacuationModel } from '@/models/admin/EvacuationModel';
import { Request, Response } from 'express';

export class EvacuationController {
  static async addCenter(req: Request, res: Response): Promise<void> {
    const raw = req.body.data;
    const parsedData = JSON.parse(raw);
    const files = req.files as Express.Multer.File[] | undefined;

    try {
      await EvacuationModel.addCenter(parsedData, files ?? []);
      res.status(200).json({ message: 'Evacuation center added successfully' });
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

  static async getCenters(req: Request, res: Response): Promise<void> {
    try {
      const centers = await EvacuationModel.getCenters();
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
