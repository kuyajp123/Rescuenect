import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();

import { WeatherController } from '@/controllers/WeatherController';
const weatherController = new WeatherController();
router.get('/api/weather', async (req: Request, res: Response, next: NextFunction) => {
    await weatherController.getWeatherData(req, res, next);
});

export default router;