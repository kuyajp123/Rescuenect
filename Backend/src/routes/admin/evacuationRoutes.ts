import { upload } from '@/config/multer';
import { EvacuationController } from '@/controllers/admin/Evacuation.Controller';
import { AdminMiddleware } from '@/middlewares/AdminMiddleware';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const evacuationRoutes = Router();

evacuationRoutes.use(AuthMiddleware.verifyToken, AdminMiddleware.requireAdmin, AdminMiddleware.requireClientAccess);

evacuationRoutes.get('/getCenters', EvacuationController.getCenters);
evacuationRoutes.post(
  '/addCenter',
  AdminMiddleware.blockLguWritesWhenClientDeletionScheduled,
  upload.array('images', 3),
  EvacuationController.addCenter
);

evacuationRoutes.put(
  '/updateCenter',
  AdminMiddleware.blockLguWritesWhenClientDeletionScheduled,
  upload.array('images', 3),
  EvacuationController.updateCenter
);

evacuationRoutes.delete(
  '/deleteCenter',
  AdminMiddleware.blockLguWritesWhenClientDeletionScheduled,
  EvacuationController.deleteCenter
);

export default evacuationRoutes;
