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

  static async deleteCenter(req: Request, res: Response): Promise<void> {
    const { id } = req.body;
    try {
      await EvacuationModel.deleteCenter(id);
      res.status(200).json({ message: 'Evacuation center deleted successfully' });
    } catch (error) {
      console.error('❌ Failed to delete evacuation center:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to delete evacuation center',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async updateCenter(req: Request, res: Response): Promise<void> {
    const raw = req.body.data;
    const parsedData = JSON.parse(raw);
    const { id, ...data } = parsedData;
    const keptImages = parsedData.keptImages || [];
    const files = req.files as Express.Multer.File[] | undefined;

    try {
      await EvacuationModel.updateCenter(id, data, files ?? [], keptImages);
      res.status(200).json({ message: 'Evacuation center updated successfully' });
    } catch (error) {
      console.error('❌ Failed to update evacuation center:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to update evacuation center',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }
}
