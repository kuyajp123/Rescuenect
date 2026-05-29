import { db } from '@/db/firestoreConfig';
import type { AdminUser, OperationLog, OperationLogActorRole, OperationLogStatus } from '@/types/admin';
import { FieldValue } from 'firebase-admin/firestore';

type OperationLogTarget = {
  targetType: string;
  targetId?: string | null;
  targetName?: string | null;
  clientId?: string | null;
  clientName?: string | null;
};

type CreateOperationLogParams = OperationLogTarget & {
  action: string;
  actionLabel?: string;
  actor?: AdminUser | null;
  actorUid?: string | null;
  actorEmail?: string | null;
  actorRole?: OperationLogActorRole | null;
  status?: OperationLogStatus;
  message: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
};

const humanizeAction = (action: string): string =>
  action
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, match => match.toUpperCase());

const cleanValue = (value: unknown): unknown => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(cleanValue);
  if (typeof value === 'object' && value) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, cleanValue(entry)])
    );
  }

  return value;
};

const cleanRecord = (value?: Record<string, unknown> | null): Record<string, unknown> | null => {
  if (!value) return null;
  return cleanValue(value) as Record<string, unknown>;
};

const serialize = (id: string, data: FirebaseFirestore.DocumentData): OperationLog => ({
  id,
  action: data.action || '',
  actionLabel: data.actionLabel || humanizeAction(data.action || ''),
  targetType: data.targetType || 'system',
  targetId: data.targetId ?? null,
  targetName: data.targetName ?? null,
  clientId: data.clientId ?? null,
  clientName: data.clientName ?? null,
  actorUid: data.actorUid || 'system',
  actorEmail: data.actorEmail ?? null,
  actorRole: data.actorRole || 'system',
  status: data.status === 'failed' ? 'failed' : 'success',
  message: data.message || '',
  before: data.before ?? null,
  after: data.after ?? null,
  metadata: data.metadata || {},
  timestamp: typeof data.timestamp === 'number' ? data.timestamp : 0,
  createdAt: data.createdAt,
});

export class OperationLogService {
  private static collectionRef() {
    return db.collection('operationLogs');
  }

  static async create(params: CreateOperationLogParams): Promise<string | null> {
    const timestamp = Date.now();
    const actor = params.actor;
    const docRef = this.collectionRef().doc();

    const log = {
      id: docRef.id,
      action: params.action,
      actionLabel: params.actionLabel || humanizeAction(params.action),
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      targetName: params.targetName ?? null,
      clientId: params.clientId ?? null,
      clientName: params.clientName ?? null,
      actorUid: params.actorUid || actor?.uid || 'system',
      actorEmail: params.actorEmail ?? actor?.email ?? null,
      actorRole: params.actorRole || actor?.role || 'system',
      status: params.status || 'success',
      message: params.message,
      before: cleanRecord(params.before),
      after: cleanRecord(params.after),
      metadata: cleanRecord(params.metadata) || {},
      timestamp,
      createdAt: FieldValue.serverTimestamp(),
    };

    try {
      await docRef.set(log);
      return docRef.id;
    } catch (error) {
      console.error('Failed to create operation log:', error);
      return null;
    }
  }

  static async list(limitCount = 300): Promise<OperationLog[]> {
    const normalizedLimit = Number.isFinite(limitCount) ? Math.min(Math.max(limitCount, 1), 500) : 300;
    const snapshot = await this.collectionRef().orderBy('timestamp', 'desc').limit(normalizedLimit).get();
    return snapshot.docs.map(doc => serialize(doc.id, doc.data()));
  }
}
