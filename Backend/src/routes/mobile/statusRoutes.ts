import { Router } from 'express';
import { StatusController } from '@/controllers/mobile/Status.Controller';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { ResidentClientMiddleware } from '@/middlewares/ResidentClientMiddleware';
import { upload } from '@/config/multer';

const statusRoutes = Router();

// Apply authentication to all status routes, then ownership checks per route.
statusRoutes.use(AuthMiddleware.verifyToken);

statusRoutes.post(
  '/createStatus',
  ResidentClientMiddleware.blockWritesWhenClientUnavailable,
  upload.single('image'),
  AuthMiddleware.requireOwnUid,
  StatusController.createStatus
);

statusRoutes.get('/getStatus/:uid', AuthMiddleware.requireOwnUid, StatusController.getStatus);

statusRoutes.delete('/deleteStatus/:uid', AuthMiddleware.requireOwnUid, StatusController.deleteStatus);

export default statusRoutes;
