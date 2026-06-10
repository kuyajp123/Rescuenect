import { db } from '@/db/firestoreConfig';
import * as admin from 'firebase-admin';

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

const invalidFcmTokenCodes = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

const stringifyDataPayload = (value: Record<string, unknown>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(removeUndefined(value)).map(([key, entry]) => [
      key,
      typeof entry === 'string' ? entry : JSON.stringify(entry),
    ])
  );

type AdminPushTarget = {
  uid: string;
  token: string;
};

type PushDeliveryResult = {
  targetCount: number;
  success: number;
  failure: number;
};

export class ManagementNotificationService {
  private static collectionRef() {
    return db.collection('notifications');
  }

  private static async getAdminPushTargets(params: CreateManagementNotificationParams): Promise<AdminPushTarget[]> {
    const snapshot = await db.collection('admin').get();
    const targets = new Map<string, AdminPushTarget>();

    snapshot.forEach(doc => {
      const data = doc.data();
      const role = data.role === 'super_admin' || data.role === 'lgu_admin' ? data.role : null;
      const status = data.status === 'inactive' ? 'inactive' : 'active';
      const token = typeof data.fcmToken === 'string' ? data.fcmToken.trim() : '';

      if (!role || status !== 'active' || !token) return;
      if (params.targetRole !== 'all_admins' && role !== params.targetRole) return;
      if (role === 'lgu_admin' && params.clientId && data.clientId !== params.clientId) return;

      targets.set(token, { uid: doc.id, token });
    });

    return [...targets.values()];
  }

  private static getNotificationLink(notification: Record<string, unknown>) {
    const appBaseUrl = (process.env.APP_BASE_URL || '').replace(/\/$/, '');
    const data = notification.data && typeof notification.data === 'object' ? (notification.data as Record<string, unknown>) : {};
    const actionPath = typeof data.actionPath === 'string' ? data.actionPath : '';

    if (!appBaseUrl) return undefined;
    if (!actionPath) return appBaseUrl;

    return `${appBaseUrl}${actionPath.startsWith('/') ? actionPath : `/${actionPath}`}`;
  }

  private static async clearInvalidAdminTokens(tokens: string[]) {
    const uniqueTokens = [...new Set(tokens)];
    await Promise.all(
      uniqueTokens.map(async token => {
        try {
          const snapshot = await db.collection('admin').where('fcmToken', '==', token).get();
          if (snapshot.empty) return;

          const batch = db.batch();
          snapshot.docs.forEach(doc => batch.update(doc.ref, { fcmToken: null }));
          await batch.commit();
        } catch (error) {
          console.error('Failed to clear invalid admin FCM token:', error);
        }
      })
    );
  }

  private static async sendPushNotifications(
    params: CreateManagementNotificationParams,
    notification: Record<string, unknown>
  ): Promise<PushDeliveryResult> {
    try {
      const targets = await this.getAdminPushTargets(params);
      if (targets.length === 0) return { targetCount: 0, success: 0, failure: 0 };

      const data = notification.data && typeof notification.data === 'object' ? (notification.data as Record<string, unknown>) : {};
      const link = this.getNotificationLink(notification);
      const invalidTokens: string[] = [];

      const results = await Promise.all(
        targets.map(async target => {
          try {
            await admin.messaging().send({
              token: target.token,
              notification: {
                title: params.title,
                body: params.message,
              },
              data: stringifyDataPayload({
                type: params.type,
                notificationId: notification.id,
                clientId: params.clientId ?? '',
                clientName: params.clientName ?? '',
                actionPath: data.actionPath,
                targetRole: params.targetRole,
              }),
              ...(link ? { webpush: { fcmOptions: { link } } } : {}),
            });

            return true;
          } catch (error: any) {
            const code = error?.errorInfo?.code || error?.code;
            if (invalidFcmTokenCodes.has(code)) {
              invalidTokens.push(target.token);
            }
            console.error('Failed to send admin FCM notification:', {
              uid: target.uid,
              code,
              message: error instanceof Error ? error.message : error,
            });
            return false;
          }
        })
      );

      if (invalidTokens.length > 0) {
        await this.clearInvalidAdminTokens(invalidTokens);
      }

      const success = results.filter(Boolean).length;
      return {
        targetCount: targets.length,
        success,
        failure: targets.length - success,
      };
    } catch (error) {
      console.error('Failed to deliver admin push notifications:', error);
      return { targetCount: 0, success: 0, failure: 0 };
    }
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
        success: 0,
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
      const pushDelivery = await this.sendPushNotifications(params, notification);
      await docRef.set(
        {
          pushSentTo: pushDelivery.targetCount,
          deliveryStatus: {
            success: pushDelivery.success,
            failure: pushDelivery.failure,
          },
        },
        { merge: true }
      );
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
