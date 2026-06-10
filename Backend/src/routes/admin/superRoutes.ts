import { SuperAdminController } from '@/controllers/admin/SuperAdmin.Controller';
import { AdminMiddleware } from '@/middlewares/AdminMiddleware';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { APK_CONTENT_TYPE } from '@/services/mobileAppReleaseGithub';
import { mkdirSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import multer from 'multer';

const superRoutes = Router();
const DEFAULT_MAX_APK_BYTES = 250 * 1024 * 1024;
const apkUploadDir = path.join(tmpdir(), 'rescuenect-super-admin-apk-uploads');

mkdirSync(apkUploadDir, { recursive: true });

const getMaxApkBytes = (): number => {
  const configuredLimit = Number(process.env.MOBILE_APK_MAX_BYTES);
  return Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : DEFAULT_MAX_APK_BYTES;
};

const safeUploadFileName = (originalName: string): string => {
  const safeOriginalName = originalName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

  return `${Date.now()}-${safeOriginalName || 'rescuenect.apk'}`;
};

const apkUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, apkUploadDir),
    filename: (_req, file, callback) => callback(null, safeUploadFileName(file.originalname)),
  }),
  limits: { fileSize: getMaxApkBytes() },
  fileFilter: (_req, file, callback) => {
    const mimeType = file.mimetype.toLowerCase();
    const isApk =
      file.originalname.toLowerCase().endsWith('.apk') ||
      mimeType === APK_CONTENT_TYPE ||
      mimeType === 'application/octet-stream';

    if (!isApk) {
      callback(new Error('Only APK files are allowed.'));
      return;
    }

    callback(null, true);
  },
}).single('apk');

const handleApkUpload = (req: Request, res: Response, next: NextFunction): void => {
  apkUpload(req, res, error => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({
          message: `APK exceeds the configured ${Math.round(getMaxApkBytes() / (1024 * 1024))}MB upload limit.`,
        });
        return;
      }

      res.status(400).json({ message: error.message });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
      return;
    }

    next();
  });
};

superRoutes.use(AuthMiddleware.verifyToken, AdminMiddleware.requireAdmin, AdminMiddleware.requireSuperAdmin);

superRoutes.get('/overview', SuperAdminController.getOverview);
superRoutes.get('/supabase', SuperAdminController.getSupabaseMonitoring);
superRoutes.get('/supabase/functions/:slug', SuperAdminController.getSupabaseFunction);
superRoutes.get('/supabase/storage/:bucket', SuperAdminController.getSupabaseStorageBucket);
superRoutes.get('/supabase/server-wakeup/status', SuperAdminController.getServerWakeup);
superRoutes.patch('/supabase/server-wakeup/status', SuperAdminController.updateServerWakeup);
superRoutes.post('/supabase/server-wakeup/run', SuperAdminController.runServerWakeup);
superRoutes.get('/logs', SuperAdminController.getOperationLogs);
superRoutes.delete('/logs/migrations', SuperAdminController.deleteMigrationLogs);
superRoutes.post('/mobile-app/release', handleApkUpload, SuperAdminController.uploadMobileAppRelease);

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
superRoutes.get('/client-archives', SuperAdminController.getClientArchives);
superRoutes.get('/client-archives/:archiveId', SuperAdminController.getClientArchive);
superRoutes.delete('/client-archives/:archiveId', SuperAdminController.deleteClientArchive);
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
