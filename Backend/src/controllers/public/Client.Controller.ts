import { ClientModel } from '@/models/admin/ClientModel';
import { Request, Response } from 'express';

const activeBarangayCount = (barangays: Array<{ isActive?: boolean }>): number =>
  barangays.filter(barangay => barangay.isActive !== false).length;

export class PublicClientController {
  static async getActiveClients(_req: Request, res: Response): Promise<void> {
    try {
      const clients = await ClientModel.getActiveClients();

      res.status(200).json({
        clients: clients.map(client => ({
          id: client.id,
          name: client.name,
          type: client.type,
          provinceName: client.provinceName,
          municipalityName: client.municipalityName,
          municipalityType: client.municipalityType,
          activeBarangayCount: activeBarangayCount(client.barangays),
        })),
      });
    } catch (error) {
      console.error('Failed to fetch public clients:', error);
      res.status(500).json({ message: 'Failed to fetch active LGU clients' });
    }
  }
}
