import { ResidentsModel } from '@/models/admin/ResidentsModel';
import { getClientScopeFromRequest } from '@/utils/adminScope';
import { Request, Response } from 'express';

export class ResidentController {
  public static async getResidents(req: Request, res: Response): Promise<void> {
    try {
      const residents = await ResidentsModel.getResidents(getClientScopeFromRequest(req));
      res.status(200).json({ residents });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching residents', error });
      console.error('❌ Error in ResidentController.getResidents:', error);
    }
  }
}
