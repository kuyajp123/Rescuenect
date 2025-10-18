import express, { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { WeatherController } from '@/controllers/WeatherController';
import { LoginController } from '@/controllers/LoginController';

const router = express.Router();

// suspected of not being used
// const weatherController = new WeatherController();
// router.get('/api/weather', async (req: Request, res: Response, next: NextFunction) => {
//     await weatherController.getWeatherData(req, res);
// });

router.post('/auth/signin', AuthMiddleware.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    await LoginController.handleLogin(req, res);
});

export default router;