import { SuperAdminController } from '@/controllers/admin/SuperAdmin.Controller';
import { AdminMiddleware } from '@/middlewares/AdminMiddleware';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const superRoutes = Router();

superRoutes.use(AuthMiddleware.verifyToken, AdminMiddleware.requireAdmin, AdminMiddleware.requireSuperAdmin);

superRoutes.get('/overview', SuperAdminController.getOverview);
superRoutes.get('/logs', SuperAdminController.getOperationLogs);
superRoutes.post('/migrations/naic-client-id', SuperAdminController.backfillLegacyNaicData);
superRoutes.get('/migrations/dynamic-client-cutover-audit', SuperAdminController.getDynamicClientCutoverAudit);
superRoutes.post('/migrations/dynamic-client-cutover', SuperAdminController.runDynamicClientCutover);
superRoutes.get('/lgu-requests', SuperAdminController.getLguRequests);
superRoutes.delete('/lgu-requests/:id', SuperAdminController.deleteLguRequest);
superRoutes.post('/lgu-requests/:id/approve', SuperAdminController.approveLguRequest);
superRoutes.post('/lgu-requests/:id/reject', SuperAdminController.rejectLguRequest);
superRoutes.get('/client-change-requests', SuperAdminController.getClientChangeRequests);
superRoutes.delete('/client-change-requests/:id', SuperAdminController.deleteClientChangeRequest);
superRoutes.post('/client-change-requests/:id/approve', SuperAdminController.approveClientChangeRequest);
superRoutes.post('/client-change-requests/:id/reject', SuperAdminController.rejectClientChangeRequest);
superRoutes.get('/clients', SuperAdminController.getClients);
superRoutes.get('/clients/:clientId', SuperAdminController.getClientDetails);
superRoutes.patch('/clients/:clientId', SuperAdminController.updateClient);
superRoutes.delete('/clients/:clientId', SuperAdminController.deleteClient);
superRoutes.get('/clients/:clientId/deletion-preview', SuperAdminController.getClientDeletionPreview);
superRoutes.post('/clients/:clientId/schedule-deletion', SuperAdminController.scheduleClientDeletion);
superRoutes.post('/clients/:clientId/cancel-deletion', SuperAdminController.cancelClientDeletion);
superRoutes.post('/clients/:clientId/activate', SuperAdminController.activateClient);
superRoutes.post('/clients/:clientId/deactivate', SuperAdminController.deactivateClient);
superRoutes.post('/clients/:clientId/boundary', SuperAdminController.uploadClientBoundary);
superRoutes.get('/admins', SuperAdminController.getAdmins);
superRoutes.post('/admins/invite', SuperAdminController.inviteAdmin);
superRoutes.patch('/admins/:uid', SuperAdminController.updateAdmin);
superRoutes.delete('/admins/:uid', SuperAdminController.deleteAdmin);
superRoutes.get('/system-status', SuperAdminController.getSystemStatus);

export default superRoutes;
