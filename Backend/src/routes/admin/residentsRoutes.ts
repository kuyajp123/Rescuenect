import { ResidentController } from '@/controllers/admin/Resident.Controller';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const residentsRoutes = Router();

residentsRoutes.use(AuthMiddleware.verifyToken);

residentsRoutes.get('/getResidents', ResidentController.getResidents);

export default residentsRoutes;