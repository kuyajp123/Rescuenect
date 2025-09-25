import axios from 'axios';
import { Request, Response } from 'express';

interface OpenCageResult {
  formatted: string;
  components: any;
}

interface OpenCageResponse {
  results: OpenCageResult[];
}

export class GeoCodingController {
  static async getCoordinates(req: Request, res: Response) {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
        return res.status(400).json({ error: "lat and lng are required" });
    }

    try {
        const API_KEY = process.env.OPEN_CAGE_API_KEY;
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${API_KEY}`;
        const response = await axios.get<OpenCageResponse>(url);

        const data = response.data;

        if (data.results.length > 0) {
        return res.json({
            address: data.results[0].formatted,
            components: data.results[0].components,
        });
        }

        res.status(404).json({ error: "No results found" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
  }
}