import { Router } from 'express';
import { StatusController } from '@/controllers/StatusController';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { upload } from '@/config/multerConfig';

const statusRoutes = Router();

// Apply authentication middleware to all status routes starts here
statusRoutes.use(AuthMiddleware.verifyToken);

statusRoutes.post('/createStatus', upload.single('image'), StatusController.createStatus);

statusRoutes.get('/getStatus/:uid', StatusController.getStatus);

export default statusRoutes;

