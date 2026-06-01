import { ResidentController } from '@/controllers/admin/Resident.Controller';
import { AdminMiddleware } from '@/middlewares/AdminMiddleware';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const residentsRoutes = Router();

residentsRoutes.use(AuthMiddleware.verifyToken, AdminMiddleware.requireAdmin, AdminMiddleware.requireClientAccess);

residentsRoutes.get('/getResidents', ResidentController.getResidents);

export default residentsRoutes;
