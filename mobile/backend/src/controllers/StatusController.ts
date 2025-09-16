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

    static async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        const uid = req.params.uid;

        try {
            const status = await StatusModel.getStatusByUid(uid);
            
            // ✅ Fix: Always send a response
            if (status) {
                res.status(200).json({ message: 'Status fetched successfully', data: status });
            } else {
                // ✅ Fix: Return proper response when no status found
                res.status(200).json({ message: 'No status found for user', data: null });
            }
            
        } catch (error: any) {
            res.status(500).json({ message: 'Failed to fetch status', error: error.message });
            console.error('Status fetching error:', error);
        }
    }
}