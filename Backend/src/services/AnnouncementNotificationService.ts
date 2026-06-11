import { admin, db } from '@/db/firestoreConfig';
import { normalizeBarangayValue } from '@/config/locationConfig';

// Max length for the notification body text
const MAX_BODY_LENGTH = 120;

/**
 * Notification scope for announcement delivery.
 * - 'all'       : notify every resident under the LGU client
 * - 'barangays' : notify only residents whose barangay is in the announcement's barangay list
 */
export type AnnouncementNotificationScope = 'all' | 'barangays';

export interface SendAnnouncementNotificationParams {
  announcementId: string;
  title: string;
  subtitle?: string;
  /** Plain-text snippet of the HTML content (used as fallback body when subtitle is absent) */
  contentText?: string;
  category: string;
  clientId: string;
  /** Barangay values selected for this announcement */
  barangays: string[];
  /** Controls who receives the push notification */
  notificationScope: AnnouncementNotificationScope;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const invalidFcmTokenCodes = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')   // strip tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')        // collapse whitespace
    .trim();
}

function buildNotificationBody(subtitle: string | undefined, contentText: string | undefined): string {
  const sub = subtitle?.trim();
  if (sub) return truncate(sub, MAX_BODY_LENGTH);
  const plainText = contentText ? stripHtml(contentText) : '';
  if (plainText) return truncate(plainText, MAX_BODY_LENGTH);
  return 'Tap to read the full announcement.';
}

function isValidToken(token: string): boolean {
  return !!(token && token.length > 100 && token.includes(':'));
}

async function clearInvalidUserTokens(tokens: string[]): Promise<void> {
  const uniqueTokens = [...new Set(tokens)];
  await Promise.all(
    uniqueTokens.map(async token => {
      try {
        // Tokens are stored in the fcmTokens array – use arrayRemove to clean up
        const snapshot = await db.collection('users').where('fcmTokens', 'array-contains', token).get();
        if (snapshot.empty) return;
        const batch = db.batch();
        snapshot.docs.forEach(doc =>
          batch.update(doc.ref, {
            fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
          })
        );
        await batch.commit();
      } catch (error) {
        console.error('Failed to clear invalid user FCM token:', error);
      }
    })
  );
}

// ─── main service ────────────────────────────────────────────────────────────

export class AnnouncementNotificationService {
  /**
   * Fetch FCM tokens + basic user data for residents scoped to the given clientId.
   * When scope is 'barangays', only residents whose barangay matches one of the
   * announcement's targeted barangays are included.
   */
  private static async getResidentTargets(
    clientId: string,
    scope: AnnouncementNotificationScope,
    targetBarangays: string[]
  ): Promise<{ tokens: string[]; totalResidents: number }> {
    const snapshot = await db.collection('users').get();

    const normalizedTargetBarangays = new Set(targetBarangays.map(normalizeBarangayValue));
    const tokens: string[] = [];
    let totalResidents = 0;

    snapshot.forEach(doc => {
      const data = doc.data();

      // Match by clientId
      const userClientId = typeof data.clientId === 'string' ? data.clientId.trim() : '';
      if (userClientId !== clientId) return;

      // Barangay sub-scoping
      if (scope === 'barangays' && normalizedTargetBarangays.size > 0) {
        const userBarangays: string[] = Array.isArray(data.barangay)
          ? data.barangay
          : typeof data.barangay === 'string'
          ? [data.barangay]
          : [];

        const hasMatch = userBarangays.some(b => normalizedTargetBarangays.has(normalizeBarangayValue(b)));
        if (!hasMatch) return;
      }

      totalResidents++;

      // Collect FCM tokens from the fcmTokens array (residents use array, not single field)
      const fcmTokens: unknown[] = Array.isArray(data.fcmTokens) ? data.fcmTokens : [];
      for (const t of fcmTokens) {
        if (typeof t === 'string' && isValidToken(t)) {
          tokens.push(t);
        }
      }
    });

    return { tokens: [...new Set(tokens)], totalResidents };
  }

  /**
   * Save the announcement notification record to Firestore for in-app display.
   * This is ALWAYS called regardless of FCM availability.
   */
  private static async saveNotificationRecord(params: {
    announcementId: string;
    title: string;
    body: string;
    category: string;
    clientId: string;
    barangays: string[];
    notificationScope: AnnouncementNotificationScope;
    sentTo: number;
    fcmDelivery: { success: number; failure: number };
  }): Promise<void> {
    const timestamp = Date.now();
    const docRef = db.collection('notifications').doc();

    await docRef.set({
      id: docRef.id,
      type: 'announcement',
      title: params.title,
      message: params.body,
      timestamp,
      createdAt: new Date(timestamp).toISOString(),
      clientId: params.clientId,
      location: params.clientId,
      barangays: params.barangays,
      audience: 'users',
      sentTo: params.sentTo,
      deliveryStatus: {
        success: params.fcmDelivery.success,
        failure: params.fcmDelivery.failure,
      },
      data: {
        category: params.category,
        announcementId: params.announcementId,
        notificationScope: params.notificationScope,
        source: 'admin',
        priority: 'medium',
      },
    });
  }

  /**
   * Send FCM push notifications to all collected tokens.
   * Returns delivery stats. Tokens that are no longer valid are cleaned up.
   */
  private static async sendFcmPush(params: {
    tokens: string[];
    notificationTitle: string;
    notificationBody: string;
    announcementId: string;
    clientId: string;
    category: string;
  }): Promise<{ success: number; failure: number }> {
    if (params.tokens.length === 0) {
      return { success: 0, failure: 0 };
    }

    const invalidTokens: string[] = [];
    let success = 0;
    let failure = 0;

    const results = await Promise.all(
      params.tokens.map(async token => {
        try {
          await admin.messaging().send({
            token,
            notification: {
              title: params.notificationTitle,
              body: params.notificationBody,
            },
            data: {
              type: 'announcement',
              announcementId: params.announcementId,
              clientId: params.clientId,
              category: params.category,
            },
            android: {
              priority: 'high',
              notification: { priority: 'high', defaultSound: true, defaultVibrateTimings: true },
            },
            apns: {
              payload: {
                aps: {
                  alert: { title: params.notificationTitle, body: params.notificationBody },
                  badge: 1,
                  sound: 'default',
                },
              },
            },
          });
          return true;
        } catch (error: any) {
          const code = error?.errorInfo?.code ?? error?.code ?? '';
          if (invalidFcmTokenCodes.has(code)) {
            invalidTokens.push(token);
          }
          console.error('FCM send failed for token:', { code, message: error instanceof Error ? error.message : error });
          return false;
        }
      })
    );

    success = results.filter(Boolean).length;
    failure = params.tokens.length - success;

    if (invalidTokens.length > 0) {
      // Clean up stale tokens asynchronously – don't block the response
      clearInvalidUserTokens(invalidTokens).catch(err =>
        console.error('Failed to clear invalid tokens:', err)
      );
    }

    return { success, failure };
  }

  /**
   * Main entry point.
   * 1. Fetches resident targets (filtered by scope + barangays when applicable).
   * 2. Sends FCM push to residents who have an FCM token.
   * 3. Always saves the in-app notification record to Firestore.
   */
  static async sendAnnouncementNotification(params: SendAnnouncementNotificationParams): Promise<void> {
    const notificationTitle = `📢 ${params.title}`;
    const notificationBody = buildNotificationBody(params.subtitle, params.contentText);

    const { tokens, totalResidents } = await this.getResidentTargets(
      params.clientId,
      params.notificationScope,
      params.barangays
    );

    // Send FCM push (only to residents with valid tokens)
    const fcmDelivery = await this.sendFcmPush({
      tokens,
      notificationTitle,
      notificationBody,
      announcementId: params.announcementId,
      clientId: params.clientId,
      category: params.category,
    });

    console.log(
      `✅ Announcement notification sent | scope=${params.notificationScope} | residents=${totalResidents} | fcm_success=${fcmDelivery.success} | fcm_failure=${fcmDelivery.failure}`
    );

    // Always save in-app notification record
    await this.saveNotificationRecord({
      announcementId: params.announcementId,
      title: notificationTitle,
      body: notificationBody,
      category: params.category,
      clientId: params.clientId,
      barangays: params.barangays,
      notificationScope: params.notificationScope,
      sentTo: totalResidents,
      fcmDelivery,
    });
  }
}
