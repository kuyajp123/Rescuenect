import { StatusModel } from '@/models/StatusModel';
import { Request, Response, NextFunction } from 'express';

export class StatusController {
    static async createStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        const data = req.body;

        try {
            await StatusModel.saveStatus(data);
            res.status(201).json({ message: 'Status created successfully', data: data });
            return;
        } catch (error: any) {
            res.status(500).json({ message: 'Failed to create status', error: error.message });
            console.error('Status creation error:', error);
            // next(error);
        }
    }
}