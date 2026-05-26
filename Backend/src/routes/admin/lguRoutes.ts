import { LguAdminController } from '@/controllers/admin/LguAdmin.Controller';
import { AdminMiddleware } from '@/middlewares/AdminMiddleware';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const lguRoutes = Router();

lguRoutes.use(
  AuthMiddleware.verifyToken,
  AdminMiddleware.requireAdmin,
  AdminMiddleware.requireActiveLguAdmin,
  AdminMiddleware.requireClientAccess
);

lguRoutes.get('/client', LguAdminController.getClient);
lguRoutes.get('/change-requests', LguAdminController.getChangeRequests);
lguRoutes.post('/change-requests', LguAdminController.createChangeRequest);
lguRoutes.post('/change-requests/:id/cancel', LguAdminController.cancelChangeRequest);

export default lguRoutes;
