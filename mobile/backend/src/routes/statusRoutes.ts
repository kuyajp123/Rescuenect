import { Router } from 'express';
import { StatusController } from '@/controllers/StatusController';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';

const statusRoutes = Router();

// Apply authentication middleware to all status routes starts here
statusRoutes.use(AuthMiddleware.verifyToken);

statusRoutes.post('/createStatus', StatusController.createStatus);

export default statusRoutes;

