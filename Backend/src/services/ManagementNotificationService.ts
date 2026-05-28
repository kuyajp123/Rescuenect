import { db } from '@/db/firestoreConfig';

export type ManagementNotificationType =
  | 'system'
  | 'client_request'
  | 'client_change_request'
  | 'admin_invite'
  | 'system_health';

type AdminNotificationTargetRole = 'super_admin' | 'lgu_admin' | 'all_admins';

type CreateManagementNotificationParams = {
  type: ManagementNotificationType;
  title: string;
  message: string;
  targetRole: AdminNotificationTargetRole;
  clientId?: string | null;
  clientName?: string | null;
  location?: string;
  sentTo?: number;
  data?: Record<string, unknown>;
};

const removeUndefined = (value: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));

export class ManagementNotificationService {
  private static collectionRef() {
    return db.collection('notifications');
  }

  static async create(params: CreateManagementNotificationParams): Promise<string | null> {
    const timestamp = Date.now();
    const docRef = this.collectionRef().doc();
    const location = params.location || params.clientId || 'system';

    const notification = removeUndefined({
      id: docRef.id,
      type: params.type,
      title: params.title,
      message: params.message,
      timestamp,
      createdAt: new Date(timestamp).toISOString(),
      clientId: params.clientId ?? null,
      clientName: params.clientName ?? null,
      location,
      barangays: [],
      audience: 'admin',
      targetRole: params.targetRole,
      sentTo: params.sentTo ?? 0,
      deliveryStatus: {
        success: params.sentTo ?? 0,
        failure: 0,
      },
      data: removeUndefined({
        notificationCategory: params.type,
        clientId: params.clientId ?? null,
        clientName: params.clientName ?? null,
        ...(params.data ?? {}),
      }),
    });

    try {
      await docRef.set(notification);
      return docRef.id;
    } catch (error) {
      console.error('Failed to create management notification:', error);
      return null;
    }
  }

  static async notifySuperAdmins(
    params: Omit<CreateManagementNotificationParams, 'targetRole'>
  ): Promise<string | null> {
    return this.create({
      ...params,
      targetRole: 'super_admin',
    });
  }
}
