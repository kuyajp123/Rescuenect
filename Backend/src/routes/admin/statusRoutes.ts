import { StatusController } from '@/controllers/admin/Status.Controller';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const statusRoutes = Router();

statusRoutes.use(AuthMiddleware.verifyToken);

statusRoutes.get('/getVersions', StatusController.getVersions);

statusRoutes.get('/getAllLatestStatuses', StatusController.getAllLatestStatuses);

statusRoutes.put('/resolvedStatus', StatusController.resolveStatus);

export default statusRoutes;
