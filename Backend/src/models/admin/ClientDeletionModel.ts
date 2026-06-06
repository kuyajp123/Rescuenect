import { db } from '@/db/firestoreConfig';
import { ClientModel } from '@/models/admin/ClientModel';
// import { EmailService } from '@/services/EmailService';
import type { ClientDeletionJob, ClientDeletionPreview, ClientLgu } from '@/types/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const DELETION_GRACE_DAYS = 30;

const toMillis = (value: unknown): number => {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  const seconds = (value as { seconds?: number; _seconds?: number }).seconds ?? (value as { _seconds?: number })._seconds;
  if (typeof seconds === 'number') {
    return seconds * 1000;
  }
  return 0;
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatManilaDateTime = (date: Date): string =>
  date.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const emptyPreview = (): ClientDeletionPreview => ({
  canDelete: false,
  canScheduleDeletion: false,
  warnings: [],
  dependencies: {
    residents: 0,
    lguAdmins: 0,
    adminInvitations: 0,
    statuses: 0,
    evacuationCenters: 0,
    announcements: 0,
    contacts: 0,
    notifications: 0,
    clientBoundaries: 0,
    clientChangeRequests: 0,
  },
});

const serializeJob = (id: string, data: FirebaseFirestore.DocumentData): ClientDeletionJob => ({
  id,
  clientId: data.clientId || id,
  clientName: data.clientName || data.clientId || id,
  status: ['scheduled', 'running', 'completed', 'failed', 'cancelled'].includes(data.status)
    ? data.status
    : 'scheduled',
  deletionEffectiveAt: data.deletionEffectiveAt,
  deletionScheduledAt: data.deletionScheduledAt,
  deletionRequestedBy: data.deletionRequestedBy ?? null,
  deletionReason: data.deletionReason ?? null,
  progress: data.progress ?? {},
  errors: Array.isArray(data.errors) ? data.errors : [],
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

export class ClientDeletionModel {
  private static jobsRef() {
    return db.collection('clientDeletionJobs');
  }

  private static async countCollection(collectionName: string, clientId: string): Promise<number> {
    const snapshot = await db.collection(collectionName).where('clientId', '==', clientId).get();
    return snapshot.size;
  }

  private static async countOptionalDoc(collectionName: string, documentId: string): Promise<number> {
    const snap = await db.collection(collectionName).doc(documentId).get();
    return snap.exists ? 1 : 0;
  }

  private static async getLguAdminNotificationEmails(clientId: string): Promise<string[]> {
    const [adminSnapshot, invitationSnapshot] = await Promise.all([
      db.collection('admin').where('clientId', '==', clientId).get(),
      db.collection('adminInvitations').where('clientId', '==', clientId).get(),
    ]);
    const emails = new Set<string>();

    adminSnapshot.docs.forEach(doc => {
      const email = doc.data().email;
      if (typeof email === 'string' && email.trim()) emails.add(email.trim().toLowerCase());
    });

    invitationSnapshot.docs.forEach(doc => {
      const email = doc.data().email;
      if (typeof email === 'string' && email.trim()) emails.add(email.trim().toLowerCase());
    });

    return Array.from(emails);
  }

  private static async notifyLguAdminsDeletionScheduled(params: {
    client: ClientLgu;
    effectiveAt: Date;
    reason: string | null;
  }): Promise<void> {
    const emails = await this.getLguAdminNotificationEmails(params.client.id);
    if (emails.length === 0) return;

    //--- EMAIL DISABLED ---
    // const effectiveAt = formatManilaDateTime(params.effectiveAt);
    // const reasonLine = params.reason ? ` Reason noted by the Super Admin: ${params.reason}` : '';
    // await Promise.all(
    //   emails.map(email =>
    //     EmailService.sendSimple({
    //       to: email,
    //       subject: `Rescuenect access update for ${params.client.name}`,
    //       title: 'Thank you for working with Rescuenect',
    //       message:
    //         `Your LGU client, ${params.client.name}, has been scheduled for removal from Rescuenect. ` +
    //         `Your admin account will stay available during the grace period and will be removed when the client is archived after ${effectiveAt}. ` +
    //         `Thank you for the time and care you shared with the Rescuenect community.${reasonLine}`,
    //       template: 'lgu_client_deletion_scheduled',
    //     })
    //   )
    // );
    //--- EMAIL DISABLED ---
  }

  static async getDeletionPreview(clientId: string): Promise<ClientDeletionPreview> {
    const client = await ClientModel.getClientById(clientId);
    if (!client) throw new Error('Client not found');

    const preview = emptyPreview();
    const [
      residents,
      lguAdmins,
      adminInvitations,
      statuses,
      evacuationCenters,
      announcements,
      contacts,
      notifications,
      clientBoundaries,
      clientChangeRequests,
    ] = await Promise.all([
      this.countCollection('users', client.id),
      this.countCollection('admin', client.id),
      this.countCollection('adminInvitations', client.id),
      db.collectionGroup('statuses').where('clientId', '==', client.id).get().then(snapshot => snapshot.size),
      this.countCollection('centers', client.id),
      this.countCollection('announcements', client.id),
      this.countOptionalDoc('contacts', client.id),
      this.countCollection('notifications', client.id),
      this.countOptionalDoc('clientBoundaries', client.id),
      this.countCollection('clientChangeRequests', client.id),
    ]);

    preview.dependencies = {
      residents,
      lguAdmins,
      adminInvitations,
      statuses,
      evacuationCenters,
      announcements,
      contacts,
      notifications,
      clientBoundaries,
      clientChangeRequests,
    };

    preview.canDelete = false;
    preview.canScheduleDeletion = client.status === 'draft' || client.status === 'inactive';

    if (client.status === 'active') {
      preview.warnings.push('Deactivate the client before scheduling deletion.');
    }
    if (client.status === 'deletion_scheduled') {
      preview.warnings.push('Deletion is already scheduled for this client.');
    }
    if (client.status === 'deleting') {
      preview.warnings.push('Deletion cleanup is already running for this client.');
    }
    if (client.status === 'deleted') {
      preview.warnings.push('This client has already been deleted.');
    }
    if (preview.canScheduleDeletion) {
      preview.warnings.push('Deletion is scheduled with a 30-day grace period by default.');
    }

    return preview;
  }

  static async scheduleDeletion(params: {
    clientId: string;
    requestedBy: string;
    reason?: string | null;
    graceDays?: number;
  }): Promise<{ client: ClientLgu; job: ClientDeletionJob; preview: ClientDeletionPreview }> {
    const client = await ClientModel.getClientById(params.clientId);
    if (!client) throw new Error('Client not found');
    if (client.status !== 'draft' && client.status !== 'inactive') {
      throw new Error('Only draft or inactive clients can be scheduled for deletion');
    }

    const preview = await this.getDeletionPreview(client.id);
    if (!preview.canScheduleDeletion) {
      throw new Error(preview.warnings[0] || 'Client cannot be scheduled for deletion');
    }

    const now = new Date();
    const graceDays =
      typeof params.graceDays === 'number' && Number.isFinite(params.graceDays) && params.graceDays >= 0
        ? Math.floor(params.graceDays)
        : DELETION_GRACE_DAYS;
    const effectiveAt = addDays(now, graceDays);
    const effectiveTimestamp = Timestamp.fromDate(effectiveAt);
    const reason = typeof params.reason === 'string' && params.reason.trim() ? params.reason.trim() : null;

    await db.collection('clients').doc(client.id).set(
      {
        status: 'deletion_scheduled',
        deletionScheduledAt: FieldValue.serverTimestamp(),
        deletionEffectiveAt: effectiveTimestamp,
        deletionRequestedBy: params.requestedBy,
        deletionReason: reason,
        deletionCancelledAt: null,
        deletionStatus: 'scheduled',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await this.jobsRef().doc(client.id).set(
      {
        clientId: client.id,
        clientName: client.name,
        status: 'scheduled',
        deletionEffectiveAt: effectiveTimestamp,
        deletionScheduledAt: FieldValue.serverTimestamp(),
        deletionRequestedBy: params.requestedBy,
        deletionReason: reason,
        progress: {},
        errors: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await this.notifyLguAdminsDeletionScheduled({ client, effectiveAt, reason });

    const [updatedClient, jobSnap] = await Promise.all([
      ClientModel.getClientById(client.id),
      this.jobsRef().doc(client.id).get(),
    ]);
    if (!updatedClient || !jobSnap.exists) throw new Error('Failed to schedule client deletion');

    return {
      client: updatedClient,
      job: serializeJob(jobSnap.id, jobSnap.data() ?? {}),
      preview,
    };
  }

  static async cancelDeletion(params: {
    clientId: string;
    cancelledBy: string;
  }): Promise<{ client: ClientLgu; job: ClientDeletionJob | null }> {
    const client = await ClientModel.getClientById(params.clientId);
    if (!client) throw new Error('Client not found');
    if (client.status !== 'deletion_scheduled') {
      throw new Error('Only scheduled deletions can be cancelled');
    }
    if (toMillis(client.deletionEffectiveAt) <= Date.now()) {
      throw new Error('Deletion can no longer be cancelled because the effective date has passed');
    }

    await db.collection('clients').doc(client.id).set(
      {
        status: 'inactive',
        deletionScheduledAt: null,
        deletionEffectiveAt: null,
        deletionRequestedBy: null,
        deletionReason: null,
        deletionCancelledAt: FieldValue.serverTimestamp(),
        deletionStatus: 'cancelled',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await this.jobsRef().doc(client.id).set(
      {
        status: 'cancelled',
        cancelledBy: params.cancelledBy,
        cancelledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const [updatedClient, jobSnap] = await Promise.all([
      ClientModel.getClientById(client.id),
      this.jobsRef().doc(client.id).get(),
    ]);
    if (!updatedClient) throw new Error('Client not found after cancellation');

    return {
      client: updatedClient,
      job: jobSnap.exists ? serializeJob(jobSnap.id, jobSnap.data() ?? {}) : null,
    };
  }
}
