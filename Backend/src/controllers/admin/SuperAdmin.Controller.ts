import { db, verifyFirebaseConnection } from '@/db/firestoreConfig';
import { AdminAuthModel } from '@/models/admin/AdminAuthModel';
import { ClientChangeRequestModel } from '@/models/admin/ClientChangeRequestModel';
import { ClientModel, parseGeoJsonFromStorage } from '@/models/admin/ClientModel';
import { LegacyNaicMigrationModel } from '@/models/admin/LegacyNaicMigrationModel';
import { LguRequestModel } from '@/models/admin/LguRequestModel';
import { OperationLogService } from '@/services/OperationLogService';
import { PsgcService } from '@/services/PsgcService';
import type {
  AdminUser,
  ClientChangeRequest,
  ClientChangeRequestStatus,
  ClientChangeRequestType,
  ClientLgu,
  ClientLguStatus,
  LguRequest,
  LguRequestStatus,
  SystemStatus,
} from '@/types/admin';
import { Request, Response } from 'express';

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

const activeBarangayCount = (client: ClientLgu): number =>
  client.barangays.filter(barangay => barangay.isActive !== false).length;

const clientLogSnapshot = (client: ClientLgu | null | undefined): Record<string, unknown> | null => {
  if (!client) return null;

  return {
    name: client.name,
    status: client.status,
    provinceName: client.provinceName,
    municipalityName: client.municipalityName,
    weatherLocationKey: client.weatherLocationKey,
    centerLatitude: client.weatherLatitude,
    centerLongitude: client.weatherLongitude,
    activeBarangays: activeBarangayCount(client),
    totalBarangays: client.barangays.length,
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
  };
};

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
      const [system, clients, lguRequests, changeRequests, admins, residentSnapshot] = await Promise.all([
        SuperAdminController.buildSystemStatus(),
        ClientModel.listClients(),
        LguRequestModel.listRequests(),
        ClientChangeRequestModel.listAll(),
        AdminAuthModel.listLguAdmins(),
        db.collection('users').get(),
      ]);

      const clientCounts: Record<ClientLguStatus, number> = { draft: 0, active: 0, inactive: 0 };
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

  static async getOperationLogs(req: Request, res: Response): Promise<void> {
    try {
      const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 300;
      res.status(200).json({ logs: await OperationLogService.list(limit) });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch operation logs' });
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
      res.status(200).json({ clients: await ClientModel.listClients() });
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
        before: clientLogSnapshot(before),
        after: clientLogSnapshot(client),
      });
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
    try {
      if (req.params.clientId === 'naic') {
        res.status(400).json({ message: 'Default Naic client cannot be deleted' });
        return;
      }

      const client = await ClientModel.getClientById(req.params.clientId);
      if (!client) {
        res.status(404).json({ message: 'Client not found' });
        return;
      }

      if (client.status === 'active') {
        res.status(400).json({ success: false, message: 'Deactivate the client before deleting it' });
        return;
      }

      const affectedAdmins = await AdminAuthModel.deactivateAdminsForClient(client.id, req.adminUser?.uid || 'system');
      await ClientModel.deleteClient(client.id);
      await OperationLogService.create({
        actor: req.adminUser,
        action: 'client.delete',
        actionLabel: 'Deleted client',
        targetType: 'client',
        targetId: client.id,
        targetName: client.name,
        clientId: client.id,
        clientName: client.name,
        message: `${client.name} was deleted and ${affectedAdmins} LGU admin account(s) were deactivated.`,
        before: clientLogSnapshot(client),
        after: { deleted: true, affectedAdmins },
      });
      res.status(200).json({ client, affectedAdmins });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete client' });
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
