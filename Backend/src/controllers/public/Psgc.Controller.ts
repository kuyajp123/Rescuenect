import { PsgcService } from '@/services/PsgcService';
import { Request, Response } from 'express';

const handlePsgcError = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : 'Failed to fetch PSGC data';
  const status = message.includes('PSGC_API_TOKEN') ? 503 : 500;
  res.status(status).json({ message });
};

export class PsgcController {
  static async getRegions(_req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ regions: await PsgcService.getRegions() });
    } catch (error) {
      handlePsgcError(res, error);
    }
  }

  static async getProvinces(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ provinces: await PsgcService.getProvinces(req.params.regionCode) });
    } catch (error) {
      handlePsgcError(res, error);
    }
  }

  static async getMunicipalities(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ municipalities: await PsgcService.getMunicipalities(req.params.provinceCode) });
    } catch (error) {
      handlePsgcError(res, error);
    }
  }

  static async getMunicipalitiesForRegion(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ municipalities: await PsgcService.getMunicipalitiesForRegion(req.params.regionCode) });
    } catch (error) {
      handlePsgcError(res, error);
    }
  }

  static async getBarangays(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ barangays: await PsgcService.getBarangays(req.params.municipalityCode) });
    } catch (error) {
      handlePsgcError(res, error);
    }
  }
}
