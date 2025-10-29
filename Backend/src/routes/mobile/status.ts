import { Router } from 'express';
import { StatusController } from '@/controllers/mobile/Status';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { upload } from '@/config/multer';

const statusRoutes = Router();

// Apply authentication middleware to all status routes starts here
statusRoutes.use(AuthMiddleware.verifyToken);

statusRoutes.post('/createStatus', upload.single('image'), StatusController.createStatus);

statusRoutes.get('/getStatus/:uid', StatusController.getStatus);

statusRoutes.delete('/deleteStatus/:uid', StatusController.deleteStatus);

export default statusRoutes;
