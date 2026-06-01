import { Router } from 'express';
import { GeoCodingController } from '@/controllers/mobile/GeoCoding.Controller';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { ResidentClientMiddleware } from '@/middlewares/ResidentClientMiddleware';

const geoCodingRoutes = Router();

geoCodingRoutes.get(
  '/geoCoding',
  AuthMiddleware.verifyToken,
  ResidentClientMiddleware.blockWritesWhenClientUnavailable,
  GeoCodingController.getCoordinates
);

export default geoCodingRoutes;
