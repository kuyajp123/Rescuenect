import { StatusController } from '@/controllers/admin/StatusController';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const statusRoutes = Router();

statusRoutes.use(AuthMiddleware.verifyToken);

statusRoutes.get('/getVersions', StatusController.getVersions);

export default statusRoutes;