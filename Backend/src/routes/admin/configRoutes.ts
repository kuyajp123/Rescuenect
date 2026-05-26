import { ConfigController } from '@/controllers/admin/Config.Controller';
import { AdminMiddleware } from '@/middlewares/AdminMiddleware';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const configRoutes = Router();

configRoutes.use(AuthMiddleware.verifyToken, AdminMiddleware.requireAdmin, AdminMiddleware.requireClientAccess);

configRoutes.put('/update-fcm-token', ConfigController.FCMTokenUpdate);

export default configRoutes;
