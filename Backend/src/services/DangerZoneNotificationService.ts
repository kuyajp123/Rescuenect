import { canonicalizeClientId } from '@/config/locationConfig';
import { admin, db } from '@/db/firestoreConfig';
import { DangerZoneRecord } from '@/types/dangerZone';
import { FieldValue } from 'firebase-admin/firestore';

export type DangerZoneNotificationEvent =
  | 'report_verified'
  | 'official_created'
  | 'road_segment_blocked'
  | 'resolved'
  | 'expired';

const invalidFcmTokenCodes = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

const formatDangerType = (value: string): string =>
  value
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Danger zone';

const toIsoString = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof (value as { _seconds?: number })._seconds === 'number') {
    return new Date((value as { _seconds: number })._seconds * 1000).toISOString();
  }
  if (typeof (value as { seconds?: number }).seconds === 'number') {
    return new Date((value as { seconds: number }).seconds * 1000).toISOString();
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
};

const isValidToken = (token: string): boolean => !!(token && token.length > 100 && token.includes(':'));

const buildBody = (eventType: DangerZoneNotificationEvent, zone: DangerZoneRecord): string => {
  const dangerType = formatDangerType(zone.type);

  switch (eventType) {
    case 'report_verified':
      return `LGU verified a danger-zone report: ${dangerType}. Check the evacuation map.`;
    case 'official_created':
      return `LGU posted an official danger zone: ${dangerType}. Check the evacuation map.`;
    case 'road_segment_blocked':
      return `LGU marked a road segment as affected: ${dangerType}. Check the evacuation map.`;
    case 'resolved':
      return `A danger zone has been marked resolved: ${dangerType}.`;
    case 'expired':
      return `A danger zone alert has expired: ${dangerType}.`;
    default:
      return `Danger-zone update: ${dangerType}.`;
  }
};

export const buildDangerZoneNotificationId = (eventType: DangerZoneNotificationEvent, dangerZoneId: string): string =>
  `danger_zone_${eventType}_${dangerZoneId}`.replace(/[^\w.-]/g, '_').slice(0, 700);

export const getDangerZoneNotificationEventForOfficialZone = (
  zone: Pick<DangerZoneRecord, 'geometryType' | 'severity'>
): DangerZoneNotificationEvent =>
  zone.geometryType === 'line' && (zone.severity === 'high' || zone.severity === 'critical')
    ? 'road_segment_blocked'
    : 'official_created';

export interface DangerZoneNotificationPayload {
  notificationCategory: 'danger_zone';
  eventType: DangerZoneNotificationEvent;
  dangerZoneId: string;
  status: string;
  severity: string;
  geometryType: string;
  dangerType: string;
  description: string;
  expiresAt: string | null;
  actionPath: '/evacuation';
}

export const buildDangerZoneNotificationPayload = (
  eventType: DangerZoneNotificationEvent,
  zone: DangerZoneRecord
): DangerZoneNotificationPayload => ({
  notificationCategory: 'danger_zone',
  eventType,
  dangerZoneId: zone.id,
  status: zone.status,
  severity: zone.severity,
  geometryType: zone.geometryType,
  dangerType: zone.type,
  description: zone.description,
  expiresAt: toIsoString(zone.expiresAt),
  actionPath: '/evacuation',
});

export class DangerZoneNotificationService {
  private static async getResidentTargets(clientId: string): Promise<{ tokens: string[]; totalResidents: number }> {
    const normalizedClientId = canonicalizeClientId(clientId) ?? clientId;
    const snapshot = await db.collection('users').get();
    const tokens: string[] = [];
    let totalResidents = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const userClientId = typeof data.clientId === 'string' ? canonicalizeClientId(data.clientId) ?? data.clientId : '';
      if (userClientId !== normalizedClientId) return;

      totalResidents++;
      const fcmTokens = Array.isArray(data.fcmTokens) ? data.fcmTokens : [];
      for (const token of fcmTokens) {
        if (typeof token === 'string' && isValidToken(token)) tokens.push(token);
      }
      if (typeof data.fcmToken === 'string' && isValidToken(data.fcmToken)) tokens.push(data.fcmToken);
    });

    return { tokens: [...new Set(tokens)], totalResidents };
  }

  private static async clearInvalidUserTokens(tokens: string[]): Promise<void> {
    await Promise.all(
      [...new Set(tokens)].map(async token => {
        try {
          const snapshot = await db.collection('users').where('fcmTokens', 'array-contains', token).get();
          if (snapshot.empty) return;

          const batch = db.batch();
          snapshot.docs.forEach(doc => {
            batch.update(doc.ref, {
              fcmTokens: FieldValue.arrayRemove(token),
            });
          });
          await batch.commit();
        } catch (error) {
          console.error('Failed to clear invalid danger-zone FCM token:', error);
        }
      })
    );
  }

  private static async sendFcmPush(params: {
    tokens: string[];
    title: string;
    body: string;
    eventType: DangerZoneNotificationEvent;
    zone: DangerZoneRecord;
  }): Promise<{ success: number; failure: number; errors: string[] }> {
    if (params.tokens.length === 0) return { success: 0, failure: 0, errors: [] };

    const invalidTokens: string[] = [];
    const errors: string[] = [];

    const results = await Promise.all(
      params.tokens.map(async token => {
        try {
          await admin.messaging().send({
            token,
            notification: {
              title: params.title,
              body: params.body,
            },
            data: {
              type: 'danger_zone',
              notificationCategory: 'danger_zone',
              eventType: params.eventType,
              dangerZoneId: params.zone.id,
              clientId: params.zone.clientId,
              severity: params.zone.severity,
              geometryType: params.zone.geometryType,
              actionPath: '/evacuation',
            },
            android: {
              priority: 'high',
              notification: { priority: 'high', defaultSound: true, defaultVibrateTimings: true },
            },
            apns: {
              payload: {
                aps: {
                  alert: { title: params.title, body: params.body },
                  badge: 1,
                  sound: 'default',
                },
              },
            },
          });
          return true;
        } catch (error: any) {
          const code = error?.errorInfo?.code ?? error?.code ?? '';
          if (invalidFcmTokenCodes.has(code)) invalidTokens.push(token);
          errors.push(error instanceof Error ? error.message : String(error));
          return false;
        }
      })
    );

    if (invalidTokens.length > 0) {
      this.clearInvalidUserTokens(invalidTokens).catch(error =>
        console.error('Failed to clear invalid danger-zone tokens:', error)
      );
    }

    const success = results.filter(Boolean).length;
    return {
      success,
      failure: params.tokens.length - success,
      errors,
    };
  }

  static async sendLifecycleNotification(
    eventType: DangerZoneNotificationEvent,
    zone: DangerZoneRecord
  ): Promise<{ notificationId: string; skipped: boolean }> {
    const notificationId = buildDangerZoneNotificationId(eventType, zone.id);
    const docRef = db.collection('notifications').doc(notificationId);
    const existing = await docRef.get();

    if (existing.exists) {
      return { notificationId, skipped: true };
    }

    const title =
      zone.severity === 'critical'
        ? 'Critical danger-zone update'
        : zone.severity === 'high'
        ? 'High danger-zone update'
        : 'Danger-zone update';
    const body = buildBody(eventType, zone);
    const payload = buildDangerZoneNotificationPayload(eventType, zone);
    const timestamp = Date.now();
    const location = zone.municipalityName || zone.clientId;
    const { tokens, totalResidents } = await this.getResidentTargets(zone.clientId);

    await docRef.set({
      id: notificationId,
      type: 'danger_zone',
      title,
      message: body,
      timestamp,
      createdAt: new Date(timestamp).toISOString(),
      clientId: zone.clientId,
      location,
      barangays: [],
      audience: 'users',
      sentTo: totalResidents,
      deliveryStatus: {
        success: 0,
        failure: 0,
      },
      data: payload,
    });

    const deliveryStatus = await this.sendFcmPush({
      tokens,
      title,
      body,
      eventType,
      zone,
    });

    await docRef.set({ deliveryStatus }, { merge: true });

    return { notificationId, skipped: false };
  }
}
