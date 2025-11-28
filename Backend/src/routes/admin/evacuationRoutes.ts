import { EvacuationController } from '@/controllers/admin/Evacuation.Controller';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';
import { upload } from '@/config/multer';

const evacuationRoutes = Router();

evacuationRoutes.use(AuthMiddleware.verifyToken);

evacuationRoutes.post('/addCenter', upload.array('images', 3), EvacuationController.addCenter);

evacuationRoutes.get('/getCenters', EvacuationController.getCenters);

export default evacuationRoutes;
