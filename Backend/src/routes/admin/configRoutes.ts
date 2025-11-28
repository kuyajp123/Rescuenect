import { ConfigController } from '@/controllers/admin/Config.Controller';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const configRoutes = Router();

configRoutes.use(AuthMiddleware.verifyToken);

configRoutes.put('/update-fcm-token', ConfigController.FCMTokenUpdate);

export default configRoutes;
