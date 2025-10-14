import { WeatherModel } from '@/models/WeatherModel';
import { Request, Response, NextFunction } from 'express';

export class WeatherController {
  public async getWeatherData(req: Request, res: Response) {
    try {
      const realTimeData = await WeatherModel.selectRealtimeData();
      const dailyData = await WeatherModel.selectDailyData();
      const hourlyData = await WeatherModel.selectHourlyData();

      return res.status(200).json({ realTimeData, dailyData, hourlyData });
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return res.status(500).send('Internal Server Error');
    }
  }
}
