import { WeatherModel } from '@/models/WeatherModel';
import { Request, Response, NextFunction } from 'express';

export class WeatherController {

    public async getWeatherData(req: Request, res: Response, next: NextFunction) {
        try {
            const realTimeData = await WeatherModel.selectRealtimeData();
            const forecastData = await WeatherModel.selectForecastData();
            const hourlyData = await WeatherModel.selectHourlyForecastData();
            return res.status(200).json({ realTimeData, forecastData, hourlyData });
        } catch (error) {
            next(error);
        }
    }
}

