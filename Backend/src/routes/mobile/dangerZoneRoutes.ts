import { upload } from '@/config/multer';
import { DangerZoneController } from '@/controllers/mobile/DangerZone.Controller';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { ResidentClientMiddleware } from '@/middlewares/ResidentClientMiddleware';
import { Router } from 'express';

const dangerZoneRoutes = Router();

dangerZoneRoutes.use(AuthMiddleware.verifyToken);

dangerZoneRoutes.post(
  '/createReport',
  ResidentClientMiddleware.blockWritesWhenClientUnavailable,
  upload.single('image'),
  AuthMiddleware.requireOwnUid,
  DangerZoneController.createReport
);

dangerZoneRoutes.get('/myReports', AuthMiddleware.requireOwnUid, DangerZoneController.getMyReports);

export default dangerZoneRoutes;
