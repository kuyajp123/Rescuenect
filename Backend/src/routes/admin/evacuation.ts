import { EvacuationController } from '@/controllers/admin/Evacuation.Controller';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const evacuationRoutes = Router();

evacuationRoutes.use(AuthMiddleware.verifyToken);

evacuationRoutes.post('/addCenter', EvacuationController.addCenter);

export default evacuationRoutes;
