import { db, verifyFirebaseConnection } from '@/db/firestoreConfig';
import { AdminAuthModel } from '@/models/admin/AdminAuthModel';
import { ClientArchiveModel } from '@/models/admin/ClientArchiveModel';
import { ClientChangeRequestModel } from '@/models/admin/ClientChangeRequestModel';
import { ClientDeletionModel } from '@/models/admin/ClientDeletionModel';
import { ClientModel, parseGeoJsonFromStorage } from '@/models/admin/ClientModel';
import { DynamicClientCutoverMigrationModel } from '@/models/admin/DynamicClientCutoverMigrationModel';
import { LegacyNaicMigrationModel } from '@/models/admin/LegacyNaicMigrationModel';
import { LguRequestModel } from '@/models/admin/LguRequestModel';
import { OperationLogService } from '@/services/OperationLogService';
import { PsgcService } from '@/services/PsgcService';
import { SupabaseMonitoringService } from '@/services/SupabaseMonitoringService';
import { publishManualMobileAppRelease } from '@/services/mobileAppManualRelease';
import type {
  AdminUser,
  ClientChangeRequest,
  ClientChangeRequestStatus,
  ClientArchiveSummary,
  ClientDeletionPreview,
  ClientChangeRequestType,
  ClientLgu,
  ClientLguStatus,
  LguRequest,
  LguRequestStatus,
  SystemStatus,
} from '@/types/admin';
import { hasRecordChanges } from '@/utils/changeDetection';
import { Request, Response } from 'express';
import { rm } from 'fs/promises';

const REVIEW_NOTE_WORD_LIMIT = 300;

const getReviewNote = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const note = value.trim();
  if (!note) return undefined;
  const wordCount = note.split(/\s+/).filter(Boolean).length;
  if (wordCount > REVIEW_NOTE_WORD_LIMIT) {
    throw new Error(`Review note must be ${REVIEW_NOTE_WORD_LIMIT} words or fewer`);
  }
  return note;
};

const requestStringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const activeBarangayCount = (client: ClientLgu): number =>
  client.barangays.filter(barangay => barangay.isActive !== false).length;

const barangayLogSnapshot = (client: ClientLgu): Record<string, unknown>[] =>
  client.barangays
    .map(barangay => ({
      barangayCode: barangay.barangayCode ?? null,
      barangayLabel: barangay.barangayLabel,
      value: barangay.value,
      isActive: barangay.isActive !== false,
    }))
    .sort((left, right) =>
      String(left.barangayCode || left.value || left.barangayLabel).localeCompare(
        String(right.barangayCode || right.value || right.barangayLabel)
      )
    );

const clientLogSnapshot = (client: ClientLgu | null | undefined): Record<string, unknown> | null => {
  if (!client) return null;

  return {
    name: client.name,
    status: client.status,
    regionCode: client.regionCode ?? null,
    provinceName: client.provinceName,
    provinceCode: client.provinceCode,
    municipalityName: client.municipalityName,
    municipalityCode: client.municipalityCode,
    municipalityType: client.municipalityType ?? client.type ?? null,
    weatherLocationKey: client.weatherLocationKey,
    centerLatitude: client.weatherLatitude,
    centerLongitude: client.weatherLongitude,
    activeBarangays: activeBarangayCount(client),
    totalBarangays: client.barangays.length,
    barangays: barangayLogSnapshot(client),
    mapSettings: {
      centerLatitude: client.mapSettings?.centerLatitude ?? null,
      centerLongitude: client.mapSettings?.centerLongitude ?? null,
      minZoom: client.mapSettings?.minZoom ?? null,
      zoom: client.mapSettings?.zoom ?? null,
      maxZoom: client.mapSettings?.maxZoom ?? null,
      maxBounds: client.mapSettings?.maxBounds ?? null,
      boundarySource: client.mapSettings?.boundarySource ?? null,
      boundaryVerified: client.mapSettings?.boundaryVerified ?? false,
    },
    earthquakeSettings: {
      radiusKm: client.earthquakeSettings?.radiusKm ?? null,
      minMagnitude: client.earthquakeSettings?.minMagnitude ?? null,
    },
    deletionScheduledAt: client.deletionScheduledAt ?? null,
    deletionEffectiveAt: client.deletionEffectiveAt ?? null,
    deletionStatus: client.deletionStatus ?? null,
  };
};

const clientDeletionStatusSnapshot = (client: ClientLgu | null | undefined): Record<string, unknown> | null => {
  if (!client) return null;

  return {
    status: client.status,
    deletionEffectiveAt: client.deletionEffectiveAt ?? null,
    deletionReason: client.deletionReason ?? null,
    deletionStatus: client.deletionStatus ?? null,
  };
};

const summarizeDeletionDependencies = (
  dependencies: ClientDeletionPreview['dependencies'] | Record<string, number> | null | undefined
): Record<string, number> => {
  const counts = dependencies ?? {};
  const operationalRecords =
    (counts.statuses ?? 0) +
    (counts.evacuationCenters ?? 0) +
    (counts.announcements ?? 0) +
    (counts.contacts ?? 0) +
    (counts.clientBoundaries ?? 0) +
    (counts.clientChangeRequests ?? 0);

  return {
    residents: counts.residents ?? 0,
    lguAdmins: counts.lguAdmins ?? 0,
    adminInvitations: counts.adminInvitations ?? 0,
    notifications: counts.notifications ?? 0,
    operationalRecords,
  };
};

const clientArchiveLogSnapshot = (archive: ClientArchiveSummary): Record<string, unknown> => ({
  id: archive.id,
  clientId: archive.clientId,
  clientName: archive.clientName,
  status: archive.status,
  archivedAt: archive.archivedAt ?? null,
  deletionEffectiveAt: archive.deletionEffectiveAt ?? null,
  deletionReason: archive.deletionReason ?? null,
  counts: archive.counts ?? {},
});

const adminLogSnapshot = (admin: AdminUser | null | undefined): Record<string, unknown> | null => {
  if (!admin) return null;

  return {
    email: admin.email,
    role: admin.role,
    status: admin.status,
    clientId: admin.clientId,
    clientName: admin.clientName ?? null,
  };
};

const lguRequestLogSnapshot = (request: LguRequest | null | undefined): Record<string, unknown> | null => {
  if (!request) return null;

  return {
    status: request.status,
    lguName: request.lguName,
    requesterEmail: request.requesterEmail,
    municipalityName: request.municipalityName,
    provinceName: request.provinceName,
    selectedBarangays: request.selectedBarangays.length,
    clientId: request.clientId ?? null,
    reviewNote: request.reviewNote ?? null,
  };
};

const clientChangeLogSnapshot = (
  request: ClientChangeRequest | null | undefined
): Record<string, unknown> | null => {
  if (!request) return null;

  return {
    status: request.status,
    clientName: request.clientName ?? request.clientId,
    type: request.type,
    requestedByEmail: request.requestedByEmail ?? null,
    reviewNote: request.reviewNote ?? null,
  };
};

export class SuperAdminController {
  private static async buildSystemStatus(): Promise<SystemStatus> {
    const firebaseConnected = await verifyFirebaseConnection();
    const psgc = PsgcService.getStatus();
    const weatherConfigured = Boolean(process.env.WEATHER_API_KEY || process.env.TOMORROW_IO_API_KEY);

    return {
      status: firebaseConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      backend: {
        status: 'ok',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
      firebase: {
        connected: firebaseConnected,
      },
      psgc,
      weather: {
        configured: weatherConfigured,
        status: weatherConfigured ? 'configured' : 'missing_key',
      },
      earthquake: {
        status: 'configured',
      },
    };
  }

  static async getOverview(_req: Request, res: Response): Promise<void> {
    try {
      const [system, clients, lguRequests, changeRequests, admins, residentSnapshot, supabaseMonitoring] =
        await Promise.all([
          SuperAdminController.buildSystemStatus(),
          ClientModel.listClients(),
          LguRequestModel.listRequests(),
          ClientChangeRequestModel.listAll(),
          AdminAuthModel.listLguAdmins(),
          db.collection('users').get(),
          SupabaseMonitoringService.getOverview().catch(error => ({
            configured: false,
            error: error instanceof Error ? error.message : 'Failed to load Supabase monitoring',
          })),
        ]);

      const clientCounts: Record<ClientLguStatus, number> = {
        draft: 0,
        active: 0,
        inactive: 0,
        deletion_scheduled: 0,
        deleting: 0,
        deleted: 0,
      };
      clients.forEach(client => {
        clientCounts[client.status] += 1;
      });

      const requestCounts: Record<LguRequestStatus, number> = {
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
      };
      lguRequests.forEach(request => {
        requestCounts[request.status] += 1;
      });

      const changeCounts: Record<ClientChangeRequestStatus, number> = {
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
      };
      const changeTypeCounts = new Map<ClientChangeRequestType, number>();
      changeRequests.forEach(request => {
        changeCounts[request.status] += 1;
        changeTypeCounts.set(request.type, (changeTypeCounts.get(request.type) ?? 0) + 1);
      });

      const activeClientIds = new Set(clients.filter(client => client.status === 'active').map(client => client.id));
      const activeResidents = residentSnapshot.docs.filter(doc => {
        const data = doc.data();
        return typeof data.clientId === 'string' && activeClientIds.has(data.clientId);
      }).length;

      res.status(system.firebase.connected ? 200 : 503).json({
        status: system.status,
        timestamp: system.timestamp,
        summary: {
          clients: clientCounts,
          lguRequests: requestCounts,
          changeRequests: changeCounts,
          lguAdmins: admins.length,
          activeResidents,
        },
        charts: {
          clientStatus: Object.entries(clientCounts).map(([name, value]) => ({ name, value })),
          lguRequestStatus: Object.entries(requestCounts).map(([name, value]) => ({ name, value })),
          changeRequestStatus: Object.entries(changeCounts).map(([name, value]) => ({ name, value })),
          changeRequestTypes: Array.from(changeTypeCounts.entries()).map(([name, value]) => ({ name, value })),
        },
        system,
        supabase: supabaseMonitoring,
      });
    } catch (error: unknown) {
      res
        .status(500)
        .json({
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to compute overview',
        });
    }
  }

  static async uploadMobileAppRelease(req: Request, res: Response): Promise<void> {
    const uploadedFile = req.file;

    try {
      if (!uploadedFile) {
        res.status(400).json({ message: 'APK file is required' });
        return;
      }

      const result = await publishManualMobileAppRelease({
        apkPath: uploadedFile.path,
        originalFileName: uploadedFile.originalname,
        fileSize: uploadedFile.size,
        buildProfile: requestStringOrNull(req.body?.buildProfile),
        appIdentifier: requestStringOrNull(req.body?.appIdentifier),
        appVersion: requestStringOrNull(req.body?.appVersion),
        buildNumber: requestStringOrNull(req.body?.buildNumber),
        releaseTag: requestStringOrNull(req.body?.releaseTag),
        releaseName: requestStringOrNull(req.body?.releaseName),
        releaseSource: 'super-admin-upload',
        uploadedBy: req.adminUser?.uid ?? null,
      });

      await OperationLogService.create({
        actor: req.adminUser,
        action: 'mobile_app.apk_upload',
        actionLabel: 'Uploaded mobile APK',
        targetType: 'mobile_app_release',
        targetId: result.releaseRecord.buildId,
        targetName: result.releaseRecord.fileName,
        message: `${result.releaseRecord.fileName} was published for resident app downloads.`,
        before: null,
        after: {
          buildProfile: result.releaseRecord.buildProfile,
          appIdentifier: result.releaseRecord.appIdentifier,
          version: result.releaseRecord.appVersion,
          buildNumber: result.releaseRecord.appBuildVersion,
          fileName: result.releaseRecord.fileName,
          fileSize: result.releaseRecord.fileSize,
          githubReleaseTag: result.releaseRecord.githubReleaseTag,
          githubReleaseUrl: result.releaseRecord.githubReleaseUrl,
        },
      });

      res.status(200).json({ message: 'Mobile APK published', release: result.release });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish mobile APK';
      const status = message.includes('must be configured') ? 500 : 400;
      console.error('Failed to publish mobile APK from Super Admin upload:', error);
      res.status(status).json({ message });
    } finally {
      if (uploadedFile?.path) {
        await rm(uploadedFile.path, { force: true }).catch(error => {
          console.error('Failed to remove temporary APK upload:', error);
        });
      }
    }
  }

  static async getOperationLogs(req: Request, res: Response): Promise<void> {
    try {
      const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 300;
      res.status(200).json({ logs: await OperationLogService.list(limit) });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch operation logs' });
    }
  }

  static async deleteMigrationLogs(_req: Request, res: Response): Promise<void> {
    try {
      const deleted = await OperationLogService.deleteByTargetType('migration');
      res.status(200).json({ deleted, message: `Removed ${deleted} migration log(s) from operation history.` });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete migration logs' });
    }
  }

  static async backfillLegacyNaicData(req: Request, res: Response): Promise<void> {
    try {
      const dryRun = req.query.dryRun === 'true' || req.body?.dryRun === true;
      const summary = await LegacyNaicMigrationModel.backfillNaicClientId({ dryRun });
      if (!dryRun) {
        await OperationLogService.create({
          actor: req.adminUser,
          action: 'migration.naic_client_id',
          actionLabel: 'Ran Naic client migration',
          targetType: 'migration',
          targetId: 'naic-client-id',
          clientId: 'naic',
          clientName: 'Naic',
          message: 'Legacy Naic records were backfilled with clientId.',
          before: null,
          after: { summary },
        });
      }
      res.status(200).json({ summary });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to backfill legacy Naic data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getDynamicClientCutoverAudit(_req: Request, res: Response): Promise<void> {
    try {
      const summary = await DynamicClientCutoverMigrationModel.audit({ dryRun: true });
      res.status(200).json({ summary });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to audit dynamic client cutover readiness',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async runDynamicClientCutover(req: Request, res: Response): Promise<void> {
    try {
      const dryRun = req.query.dryRun === 'true' || req.body?.dryRun === true;
      const summary = await DynamicClientCutoverMigrationModel.run({ dryRun });
      if (!dryRun) {
        await OperationLogService.create({
          actor: req.adminUser,
          action: 'migration.dynamic_client_cutover',
          actionLabel: 'Ran dynamic client cutover',
          targetType: 'migration',
          targetId: 'dynamic-client-cutover',
          message: 'Legacy client-scoped records were prepared for strict dynamic client routing.',
          before: null,
          after: { summary },
        });
      }
      res.status(200).json({ summary });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to run dynamic client cutover',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getSupabaseMonitoring(_req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json(await SupabaseMonitoringService.getOverview());
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to load Supabase monitoring',
      });
    }
  }

  static async getSupabaseFunction(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json(await SupabaseMonitoringService.getFunctionDetail(req.params.slug));
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to load Supabase function details',
      });
    }
  }

  static async getSupabaseStorageBucket(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json(await SupabaseMonitoringService.getStorageDetail(req.params.bucket));
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to load Supabase storage details',
      });
    }
  }

  static async getServerWakeup(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json(await SupabaseMonitoringService.getServerWakeupStatus());
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to load server wakeup status',
      });
    }
  }

  static async updateServerWakeup(req: Request, res: Response): Promise<void> {
    try {
      if (typeof req.body?.enabled !== 'boolean') {
        res.status(400).json({ message: 'enabled must be true or false' });
        return;
      }

      const before = await SupabaseMonitoringService.getServerWakeupStatus().catch(() => null);
      const status = await SupabaseMonitoringService.setServerWakeupEnabled(req.body.enabled);
      await OperationLogService.create({
        actor: req.adminUser,
        action: 'system.server_wakeup_update',
        actionLabel: req.body.enabled ? 'Enabled server wakeup' : 'Disabled server wakeup',
        targetType: 'supabase_function',
        targetId: 'server-wakeup',
        targetName: 'server-wakeup',
        message: `Server wakeup was ${req.body.enabled ? 'enabled' : 'disabled'} for the fixed 13-minute schedule.`,
        before: before as Record<string, unknown> | null,
        after: status,
      });
      res.status(200).json(status);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to update server wakeup status',
      });
    }
  }

  static async runServerWakeup(req: Request, res: Response): Promise<void> {
    try {
      const result = await SupabaseMonitoringService.runServerWakeup();
      await OperationLogService.create({
        actor: req.adminUser,
        action: 'system.server_wakeup_run',
        actionLabel: 'Ran server wakeup',
        targetType: 'supabase_function',
        targetId: 'server-wakeup',
        targetName: 'server-wakeup',
        message: 'Server wakeup was manually triggered from the Super Admin dashboard.',
        before: null,
        after: result,
      });
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to run server wakeup',
      });
    }
  }

  static async getLguRequests(_req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ requests: await LguRequestModel.listRequests() });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch LGU requests' });
    }
  }

  static async approveLguRequest(req: Request, res: Response): Promise<void> {
    try {
      const before = await LguRequestModel.getRequest(req.params.id);
      const request = await LguRequestModel.approveRequest(
        req.params.id,
        req.adminUser?.uid || 'system',
        typeof req.body?.reviewNote === 'string' ? req.body.reviewNote : undefined
      );
      await OperationLogService.create({
        actor: req.adminUser,
        action: 'lgu_request.approve',
        actionLabel: 'Approved LGU request',
        targetType: 'lgu_request',
        targetId: request.id,
        targetName: request.lguName,
        clientId: request.clientId ?? null,
        clientName: request.lguName,
        message: `${request.lguName} was approved as a draft client.`,
        before: lguRequestLogSnapshot(before),
        after: lguRequestLogSnapshot(request),
      });
      res.status(200).json({ request });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to approve request' });
    }
  }

  static async rejectLguRequest(req: Request, res: Response): Promise<void> {
    try {
      const before = await LguRequestModel.getRequest(req.params.id);
      const request = await LguRequestModel.rejectRequest(
        req.params.id,
        req.adminUser?.uid || 'system',
        typeof req.body?.reviewNote === 'string' ? req.body.reviewNote : undefined
      );
      await OperationLogService.create({
        actor: req.adminUser,
        action: 'lgu_request.reject',
        actionLabel: 'Rejected LGU request',
        targetType: 'lgu_request',
        targetId: request.id,
        targetName: request.lguName,
        clientId: request.clientId ?? null,
        clientName: request.lguName,
        message: `${request.lguName} access request was rejected.`,
        before: lguRequestLogSnapshot(before),
        after: lguRequestLogSnapshot(request),
      });
      res.status(200).json({ request });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to reject request' });
    }
  }

  static async deleteLguRequest(req: Request, res: Response): Promise<void> {
    try {
      const request = await LguRequestModel.deleteFinalizedRequest(req.params.id);
      await OperationLogService.create({
        actor: req.adminUser,
        action: 'lgu_request.delete',
        actionLabel: 'Deleted LGU request',
        targetType: 'lgu_request',
        targetId: request.id,
        targetName: request.lguName,
        clientId: request.clientId ?? null,
        clientName: request.lguName,
        message: `${request.lguName} ${request.status} request was deleted from the review list.`,
        before: lguRequestLogSnapshot(request),
        after: { deleted: true },
      });
      res.status(200).json({ request });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete LGU request' });
    }
  }

  static async getClients(_req: Request, res: Response): Promise<void> {
    try {
      const [clients, admins] = await Promise.all([ClientModel.listClients(), AdminAuthModel.listLguAdmins()]);
      const adminCounts = new Map<string, number>();

      admins.forEach(admin => {
        if (!admin.clientId) return;
        adminCounts.set(admin.clientId, (adminCounts.get(admin.clientId) ?? 0) + 1);
      });

      res.status(200).json({
        clients: clients.map(client => ({
          ...client,
          adminCount: adminCounts.get(client.id) ?? 0,
        })),
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch clients' });
    }
  }

  static async getClientDetails(req: Request, res: Response): Promise<void> {
    try {
      const client = await ClientModel.getClientById(req.params.clientId);
      if (!client) {
        res.status(404).json({ message: 'Client not found' });
        return;
      }

      const [request, admins] = await Promise.all([
        LguRequestModel.getRequestForClient(client.id, client.requestId),
        AdminAuthModel.listAdminsByClient(client.id),
      ]);

      res.status(200).json({ client, request, admins });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch client details' });
    }
  }

  static async updateClient(req: Request, res: Response): Promise<void> {
    try {
      const before = await ClientModel.getClientById(req.params.clientId);
      const client = await ClientModel.updateClient(req.params.clientId, req.body || {});
      const beforeLog = clientLogSnapshot(before);
      const afterLog = clientLogSnapshot(client);

      if (hasRecordChanges(beforeLog, afterLog)) {
        await OperationLogService.create({
          actor: req.adminUser,
          action: 'client.update',
          actionLabel: 'Updated client',
          targetType: 'client',
          targetId: client.id,
          targetName: client.name,
          clientId: client.id,
          clientName: client.name,
          message: `${client.name} client settings were updated.`,
          before: beforeLog,
          after: afterLog,
        });
      }
      res.status(200).json({ client });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update client' });
    }
  }

  static async activateClient(req: Request, res: Response): Promise<void> {
    try {
      const before = await ClientModel.getClientById(req.params.clientId);
      const client = await ClientModel.setClientStatus(req.params.clientId, 'active');
      await OperationLogService.create({
        actor: req.adminUser,
        action: 'client.activate',
        actionLabel: 'Activated client',
        targetType: 'client',
        targetId: client.id,
        targetName: client.name,
        clientId: client.id,
        clientName: client.name,
        message: `${client.name} is now active for resident signup and LGU admin operations.`,
        before: clientLogSnapshot(before),
        after: clientLogSnapshot(client),
      });
      res.status(200).json({ client });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to activate client' });
    }
  }

  static async deactivateClient(req: Request, res: Response): Promise<void> {
    try {
      const before = await ClientModel.getClientById(req.params.clientId);
      const client = await ClientModel.setClientStatus(req.params.clientId, 'inactive');
      await OperationLogService.create({
        actor: req.adminUser,
        action: 'client.deactivate',
        actionLabel: 'Deactivated client',
        targetType: 'client',
        targetId: client.id,
        targetName: client.name,
        clientId: client.id,
        clientName: client.name,
        message: `${client.name} is now inactive.`,
        before: clientLogSnapshot(before),
        after: clientLogSnapshot(client),
      });
      res.status(200).json({ client });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to deactivate client' });
    }
  }

  static async deleteClient(req: Request, res: Response): Promise<void> {
    res.status(405).json({
      message: 'Immediate client deletion is disabled. Use scheduled deletion with preview and grace period.',
    });
  }

  static async getClientDeletionPreview(req: Request, res: Response): Promise<void> {
    try {
      const preview = await ClientDeletionModel.getDeletionPreview(req.params.clientId);
      res.status(200).json({ preview });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to build deletion preview';
      res.status(message === 'Client not found' ? 404 : 400).json({ message });
    }
  }

  static async scheduleClientDeletion(req: Request, res: Response): Promise<void> {
    try {
      const before = await ClientModel.getClientById(req.params.clientId);
      const reason = typeof req.body?.reason === 'string' ? req.body.reason : null;
      const graceDays =
        typeof req.body?.graceDays === 'number'
          ? req.body.graceDays
          : typeof req.body?.graceDays === 'string'
            ? Number(req.body.graceDays)
            : undefined;

      const result = await ClientDeletionModel.scheduleDeletion({
        clientId: req.params.clientId,
        requestedBy: req.adminUser?.uid || 'system',
        reason,
        graceDays,
      });

      await OperationLogService.create({
        actor: req.adminUser,
        action: 'client.schedule_deletion',
        actionLabel: 'Scheduled client deletion',
        targetType: 'client',
        targetId: result.client.id,
        targetName: result.client.name,
        clientId: result.client.id,
        clientName: result.client.name,
        message: `${result.client.name} deletion was scheduled with a grace period.`,
        before: clientDeletionStatusSnapshot(before),
        after: {
          status: result.client.status,
          deletionEffectiveAt: result.client.deletionEffectiveAt ?? result.job.deletionEffectiveAt,
          deletionReason: result.client.deletionReason ?? result.job.deletionReason ?? null,
          deletionStatus: result.client.deletionStatus ?? result.job.status,
          jobStatus: result.job.status,
          affectedRecords: summarizeDeletionDependencies(result.preview.dependencies),
        },
      });

      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to schedule client deletion';
      res.status(message === 'Client not found' ? 404 : 400).json({ message });
    }
  }

  static async cancelClientDeletion(req: Request, res: Response): Promise<void> {
    try {
      const before = await ClientModel.getClientById(req.params.clientId);
      const result = await ClientDeletionModel.cancelDeletion({
        clientId: req.params.clientId,
        cancelledBy: req.adminUser?.uid || 'system',
      });

      await OperationLogService.create({
        actor: req.adminUser,
        action: 'client.cancel_deletion',
        actionLabel: 'Cancelled client deletion',
        targetType: 'client',
        targetId: result.client.id,
        targetName: result.client.name,
        clientId: result.client.id,
        clientName: result.client.name,
        message: `${result.client.name} scheduled deletion was cancelled.`,
        before: clientDeletionStatusSnapshot(before),
        after: {
          status: result.client.status,
          deletionStatus: result.client.deletionStatus ?? 'cancelled',
          jobStatus: result.job?.status ?? 'cancelled',
        },
      });

      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel client deletion';
      res.status(message === 'Client not found' ? 404 : 400).json({ message });
    }
  }

  static async getClientArchives(_req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ archives: await ClientArchiveModel.listArchives() });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch client archives' });
    }
  }

  static async getClientArchive(req: Request, res: Response): Promise<void> {
    try {
      const archive = await ClientArchiveModel.getArchive(req.params.archiveId);
      if (!archive) {
        res.status(404).json({ message: 'Client archive not found' });
        return;
      }
      res.status(200).json({ archive });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch client archive' });
    }
  }

  static async deleteClientArchive(req: Request, res: Response): Promise<void> {
    try {
      const archive = await ClientArchiveModel.deleteArchive(req.params.archiveId);
      await OperationLogService.create({
        actor: req.adminUser,
        action: 'client_archive.permanent_delete',
        actionLabel: 'Permanently deleted client archive',
        targetType: 'client_archive',
        targetId: archive.id,
        targetName: archive.clientName,
        clientId: archive.clientId,
        clientName: archive.clientName,
        message: `${archive.clientName} archive was permanently removed.`,
        before: clientArchiveLogSnapshot(archive),
        after: { deleted: true },
      });
      res.status(200).json({ archive });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete client archive';
      res.status(message === 'Client archive not found' ? 404 : 400).json({ message });
    }
  }

  static async getAdmins(_req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ admins: await AdminAuthModel.listLguAdmins() });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch LGU admin users' });
    }
  }

  static async inviteAdmin(req: Request, res: Response): Promise<void> {
    try {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const role = req.body?.role === 'super_admin' ? 'super_admin' : 'lgu_admin';
      const clientId = typeof req.body?.clientId === 'string' ? req.body.clientId.trim() : null;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ message: 'Valid email is required' });
        return;
      }

      if (role === 'super_admin') {
        res.status(400).json({ message: 'Super admins must be configured with SUPER_ADMIN_EMAILS' });
        return;
      }

      const client = clientId ? await ClientModel.getClientById(clientId) : null;
      if (!client) {
        res.status(400).json({ message: 'Valid clientId is required for LGU admin invites' });
        return;
      }
      if (['deletion_scheduled', 'deleting', 'deleted'].includes(client.status)) {
        res.status(400).json({ message: 'LGU admin invites are disabled for clients pending deletion or already deleted' });
        return;
      }

      const invitation = await AdminAuthModel.createInvitation({
        email,
        role: 'lgu_admin',
        clientId,
        clientName: client.name,
        invitedBy: req.adminUser?.uid || 'system',
      });
      await OperationLogService.create({
        actor: req.adminUser,
        action: 'admin.invite',
        actionLabel: 'Invited LGU admin',
        targetType: 'admin_invitation',
        targetId: email,
        targetName: email,
        clientId: client.id,
        clientName: client.name,
        message: `${email} was invited as an LGU admin for ${client.name}.`,
        before: null,
        after: invitation,
      });

      res.status(201).json({ invitation });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create admin invitation' });
    }
  }

  static async updateAdmin(req: Request, res: Response): Promise<void> {
    try {
      const status = req.body?.status === 'inactive' ? 'inactive' : req.body?.status === 'active' ? 'active' : null;
      if (!status) {
        res.status(400).json({ message: 'Valid status is required' });
        return;
      }

      if (req.params.uid === req.adminUser?.uid && status === 'inactive') {
        res.status(400).json({ message: 'You cannot deactivate your own super admin account' });
        return;
      }

      const before = await AdminAuthModel.getAdminByUid(req.params.uid);
      const admin = await AdminAuthModel.updateAdminStatus(req.params.uid, status);
      await OperationLogService.create({
        actor: req.adminUser,
        action: 'admin.update_status',
        actionLabel: 'Updated LGU admin status',
        targetType: 'admin',
        targetId: admin.uid,
        targetName: admin.email,
        clientId: admin.clientId,
        clientName: admin.clientName ?? null,
        message: `${admin.email} was set to ${admin.status}.`,
        before: adminLogSnapshot(before),
        after: adminLogSnapshot(admin),
      });
      res.status(200).json({ admin });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update admin user' });
    }
  }

  static async deleteAdmin(req: Request, res: Response): Promise<void> {
    try {
      if (req.params.uid === req.adminUser?.uid) {
        res.status(400).json({ message: 'You cannot delete your own admin account' });
        return;
      }

      const before = await AdminAuthModel.getAdminByUid(req.params.uid);
      const admin = await AdminAuthModel.deleteLguAdmin(req.params.uid, req.adminUser?.uid || 'system');
      await OperationLogService.create({
        actor: req.adminUser,
        action: 'admin.delete',
        actionLabel: 'Deleted LGU admin',
        targetType: 'admin',
        targetId: admin.uid,
        targetName: admin.email,
        clientId: admin.clientId,
        clientName: admin.clientName ?? null,
        message: `${admin.email} was removed from ${admin.clientName || admin.clientId}.`,
        before: adminLogSnapshot(before ?? admin),
        after: { deleted: true, invitationStatus: 'revoked' },
      });
      res.status(200).json({ admin });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete admin user' });
    }
  }

  static async getClientChangeRequests(_req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ requests: await ClientChangeRequestModel.listAll() });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch client change requests' });
    }
  }

  static async approveClientChangeRequest(req: Request, res: Response): Promise<void> {
    try {
      const before = await ClientChangeRequestModel.getById(req.params.id);
      const request = await ClientChangeRequestModel.approve(
        req.params.id,
        req.adminUser?.uid || 'system',
        getReviewNote(req.body?.reviewNote)
      );
      await OperationLogService.create({
        actor: req.adminUser,
        action: 'client_change_request.approve',
        actionLabel: 'Approved client request',
        targetType: 'client_change_request',
        targetId: request.id,
        targetName: request.type,
        clientId: request.clientId,
        clientName: request.clientName ?? null,
        message: `${request.clientName || request.clientId} ${request.type.replace(/_/g, ' ')} proposal was approved.`,
        before: clientChangeLogSnapshot(before),
        after: clientChangeLogSnapshot(request),
      });
      res.status(200).json({ request });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to approve client change request',
      });
    }
  }

  static async rejectClientChangeRequest(req: Request, res: Response): Promise<void> {
    try {
      const before = await ClientChangeRequestModel.getById(req.params.id);
      const request = await ClientChangeRequestModel.reject(
        req.params.id,
        req.adminUser?.uid || 'system',
        getReviewNote(req.body?.reviewNote)
      );
      await OperationLogService.create({
        actor: req.adminUser,
        action: 'client_change_request.reject',
        actionLabel: 'Rejected client request',
        targetType: 'client_change_request',
        targetId: request.id,
        targetName: request.type,
        clientId: request.clientId,
        clientName: request.clientName ?? null,
        message: `${request.clientName || request.clientId} ${request.type.replace(/_/g, ' ')} proposal was rejected.`,
        before: clientChangeLogSnapshot(before),
        after: clientChangeLogSnapshot(request),
      });
      res.status(200).json({ request });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to reject client change request',
      });
    }
  }

  static async deleteClientChangeRequest(req: Request, res: Response): Promise<void> {
    try {
      const request = await ClientChangeRequestModel.delete(req.params.id);
      await OperationLogService.create({
        actor: req.adminUser,
        action: 'client_change_request.delete',
        actionLabel: 'Deleted client request',
        targetType: 'client_change_request',
        targetId: request.id,
        targetName: request.type,
        clientId: request.clientId,
        clientName: request.clientName ?? null,
        message: `${request.clientName || request.clientId} ${request.type.replace(/_/g, ' ')} proposal was deleted.`,
        before: clientChangeLogSnapshot(request),
        after: { deleted: true },
      });
      res.status(200).json({ request });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to delete client change request',
      });
    }
  }

  static async uploadClientBoundary(req: Request, res: Response): Promise<void> {
    try {
      const rawGeoJson = req.body?.geoJson ?? req.body;
      const geoJson = parseGeoJsonFromStorage(rawGeoJson);
      if (!geoJson) throw new Error('Valid GeoJSON object is required');

      const source = typeof req.body?.source === 'string' ? req.body.source : null;
      const before = await ClientModel.getClientById(req.params.clientId);
      const boundary = await ClientModel.saveBoundary({
        clientId: req.params.clientId,
        geoJson,
        source,
        uploadedBy: req.adminUser?.uid || 'system',
      });
      const client = await ClientModel.getClientById(req.params.clientId);
      await OperationLogService.create({
        actor: req.adminUser,
        action: 'client_boundary.upload',
        actionLabel: 'Uploaded client boundary',
        targetType: 'client_boundary',
        targetId: req.params.clientId,
        targetName: `${client?.name || req.params.clientId} boundary`,
        clientId: req.params.clientId,
        clientName: client?.name ?? null,
        message: `${client?.name || req.params.clientId} boundary GeoJSON was uploaded and map bounds were recalculated.`,
        before: clientLogSnapshot(before),
        after: {
          ...clientLogSnapshot(client),
          bounds: boundary.bounds,
        },
      });
      res.status(200).json({ boundary, client });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to upload client boundary',
      });
    }
  }

  static async getSystemStatus(_req: Request, res: Response): Promise<void> {
    try {
      const status = await SuperAdminController.buildSystemStatus();
      res.status(status.firebase.connected ? 200 : 503).json(status);
    } catch (error) {
      res.status(500).json({ message: 'Failed to compute system status' });
    }
  }
}
