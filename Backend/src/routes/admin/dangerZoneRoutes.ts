import { DangerZoneController } from '@/controllers/admin/DangerZone.Controller';
import { AdminMiddleware } from '@/middlewares/AdminMiddleware';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const dangerZoneRoutes = Router();

dangerZoneRoutes.use(AuthMiddleware.verifyToken, AdminMiddleware.requireAdmin, AdminMiddleware.requireClientAccess);

dangerZoneRoutes.get('/getReports', DangerZoneController.getReports);
dangerZoneRoutes.get('/getZones', DangerZoneController.getZones);
dangerZoneRoutes.get('/analytics', DangerZoneController.getAnalytics);
dangerZoneRoutes.get('/routing-operations', DangerZoneController.getRoutingOperations);

dangerZoneRoutes.post(
  '/createOfficial',
  AdminMiddleware.blockLguWritesWhenClientDeletionScheduled,
  DangerZoneController.createOfficial
);

dangerZoneRoutes.patch(
  '/verifyReport',
  AdminMiddleware.blockLguWritesWhenClientDeletionScheduled,
  DangerZoneController.verifyReport
);

dangerZoneRoutes.patch(
  '/rejectReport',
  AdminMiddleware.blockLguWritesWhenClientDeletionScheduled,
  DangerZoneController.rejectReport
);

dangerZoneRoutes.patch(
  '/updateZone',
  AdminMiddleware.blockLguWritesWhenClientDeletionScheduled,
  DangerZoneController.updateZone
);

dangerZoneRoutes.patch(
  '/resolveZone',
  AdminMiddleware.blockLguWritesWhenClientDeletionScheduled,
  DangerZoneController.resolveZone
);

export default dangerZoneRoutes;
