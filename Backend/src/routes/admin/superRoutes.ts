import { SuperAdminController } from '@/controllers/admin/SuperAdmin.Controller';
import { AdminMiddleware } from '@/middlewares/AdminMiddleware';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const superRoutes = Router();

superRoutes.use(AuthMiddleware.verifyToken, AdminMiddleware.requireAdmin, AdminMiddleware.requireSuperAdmin);

superRoutes.get('/lgu-requests', SuperAdminController.getLguRequests);
superRoutes.post('/lgu-requests/:id/approve', SuperAdminController.approveLguRequest);
superRoutes.post('/lgu-requests/:id/reject', SuperAdminController.rejectLguRequest);
superRoutes.get('/clients', SuperAdminController.getClients);
superRoutes.patch('/clients/:clientId', SuperAdminController.updateClient);
superRoutes.post('/clients/:clientId/activate', SuperAdminController.activateClient);
superRoutes.post('/clients/:clientId/deactivate', SuperAdminController.deactivateClient);
superRoutes.get('/admins', SuperAdminController.getAdmins);
superRoutes.get('/system-status', SuperAdminController.getSystemStatus);

export default superRoutes;
