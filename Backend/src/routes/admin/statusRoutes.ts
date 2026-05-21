import { StatusController } from '@/controllers/admin/Status.Controller';
import { AdminMiddleware } from '@/middlewares/AdminMiddleware';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const statusRoutes = Router();

statusRoutes.use(AuthMiddleware.verifyToken, AdminMiddleware.requireAdmin);

statusRoutes.get('/getVersions', StatusController.getVersions);

statusRoutes.get('/getAllLatestStatuses', StatusController.getAllLatestStatuses);

statusRoutes.get('/getStatusHistory', StatusController.getStatusHistory);

statusRoutes.put('/resolvedStatus', StatusController.resolveStatus);

export default statusRoutes;
