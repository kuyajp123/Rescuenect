import { upload } from '@/config/multer';
import { EvacuationController } from '@/controllers/admin/Evacuation.Controller';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const evacuationRoutes = Router();

evacuationRoutes.use(AuthMiddleware.verifyToken);

evacuationRoutes.post('/addCenter', upload.array('images', 3), EvacuationController.addCenter);

evacuationRoutes.put('/updateCenter', upload.array('images', 3), EvacuationController.updateCenter);

evacuationRoutes.delete('/deleteCenter', EvacuationController.deleteCenter);

export default evacuationRoutes;
