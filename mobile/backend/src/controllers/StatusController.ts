import { StatusModel } from '@/models/StatusModel';
import { Request, Response, NextFunction } from 'express';

export class StatusController {
    static async createStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        const data = req.body;

        try {
            // Extract uid from the request body (frontend sends 'uid', not 'userId')
            const { uid, ...statusData } = data;
            
            // Validate uid exists
            if (!uid) {
                res.status(400).json({ message: 'uid is required in request body' });
                return;
            }

            const result = await StatusModel.createOrUpdateStatus(uid, statusData);
            res.status(201).json({ message: 'Status created successfully', data: result });
            return;
        } catch (error: any) {
            res.status(500).json({ message: 'Failed to create status', error: error.message });
            console.error('Status creation error:', error);
            // next(error);
        }
    }

    static async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        const uid = req.params.uid;

        // try {
        //     const status = await StatusModel.getCurrentStatus(uid, statusData.parentId);
            
        //     // ✅ Fix: Always send a response
        //     if (status) {
        //         res.status(200).json({ message: 'Status fetched successfully', data: status });
        //     } else {
        //         // ✅ Fix: Return proper response when no status found
        //         res.status(200).json({ message: 'No status found for user', data: null });
        //     }
            
        // } catch (error: any) {
        //     res.status(500).json({ message: 'Failed to fetch status', error: error.message });
        //     console.error('Status fetching error:', error);
        // }
    }
}