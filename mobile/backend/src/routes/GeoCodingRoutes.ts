import { Router } from 'express';
import { GeoCodingController } from '@/controllers/GeoCodingController';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';

const geoCodingRoutes = Router();

geoCodingRoutes.get('/geoCoding', AuthMiddleware.verifyToken, GeoCodingController.getCoordinates);

export default geoCodingRoutes;