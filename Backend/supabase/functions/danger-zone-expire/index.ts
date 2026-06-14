import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import {
  FieldValue,
  getFirestore,
  Timestamp,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

type DangerZoneRecord = {
  id: string;
  clientId: string;
  status: string;
  isActive: boolean;
  type: string;
  severity: string;
  description: string;
  geometryType: string;
  expiresAt?: unknown;
  municipalityName?: string | null;
};

type ProcessResult = {
  scanned: number;
  expired: number;
  notificationsCreated: number;
  notificationsSkipped: number;
  errors: string[];
};

const DEFAULT_MAX_ZONES = 50;
const INVALID_FCM_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

let firestoreInstance: Firestore | null = null;
let messagingInstance: Messaging | null = null;

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return jsonResponse(null, 204);
  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  const startedAt = performance.now();

  try {
    const db = initializeFirestore();
    const messaging = initializeMessaging();
    const result = await processExpiredDangerZones(db, messaging);

    return jsonResponse({
      success: true,
      ...result,
      responseTimeMs: Math.round(performance.now() - startedAt),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown danger-zone expiry error',
        responseTimeMs: Math.round(performance.now() - startedAt),
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

function initializeFirestore(): Firestore {
  if (firestoreInstance) return firestoreInstance;

  const app = getApps()[0] ?? initializeApp({ credential: cert(getServiceAccount()) });
  firestoreInstance = getFirestore(app);
  firestoreInstance.settings({ ignoreUndefinedProperties: true });
  return firestoreInstance;
}

function initializeMessaging(): Messaging {
  if (messagingInstance) return messagingInstance;

  const app = getApps()[0] ?? initializeApp({ credential: cert(getServiceAccount()) });
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

function getServiceAccount(): ServiceAccount {
  const rawSecret = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON') ?? Deno.env.get('FIREBASE_ADMIN_CREDENTIALS');
  if (!rawSecret) {
    throw new Error('Firebase credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON.');
  }

  const raw = rawSecret.trim();
  const cleaned = raw.startsWith('{') ? raw : atob(raw);
  const parsed = JSON.parse(cleaned.replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim());
  const serviceAccount = {
    projectId: parsed.projectId ?? parsed.project_id,
    clientEmail: parsed.clientEmail ?? parsed.client_email,
    privateKey: parsed.privateKey ?? parsed.private_key,
  };

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('Firebase service account JSON is missing project_id, client_email, or private_key.');
  }

  return serviceAccount;
}

function getMaxZones(): number {
  const configured = Number(Deno.env.get('DANGER_ZONE_EXPIRE_MAX_ZONES'));
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : DEFAULT_MAX_ZONES;
}

async function processExpiredDangerZones(db: Firestore, messaging: Messaging): Promise<ProcessResult> {
  const result: ProcessResult = {
    scanned: 0,
    expired: 0,
    notificationsCreated: 0,
    notificationsSkipped: 0,
    errors: [],
  };

  const now = Timestamp.now();
  const snapshot = await db
    .collection('dangerZones')
    .where('status', '==', 'verified')
    .where('isActive', '==', true)
    .where('expiresAt', '<=', now)
    .limit(getMaxZones())
    .get();

  result.scanned = snapshot.size;

  for (const doc of snapshot.docs) {
    try {
      const expiredZone = await expireDangerZone(db, doc);
      if (!expiredZone) continue;

      result.expired++;
      const notification = await sendExpiredNotification(db, messaging, expiredZone);
      if (notification.skipped) {
        result.notificationsSkipped++;
      } else {
        result.notificationsCreated++;
      }

      await doc.ref.set(
        {
          notificationAudit: {
            expired: Timestamp.now(),
          },
          expiryNotifiedAt: Timestamp.now(),
        },
        { merge: true }
      );
    } catch (error) {
      result.errors.push(`${doc.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return result;
}

async function expireDangerZone(
  db: Firestore,
  doc: QueryDocumentSnapshot
): Promise<DangerZoneRecord | null> {
  let expiredZone: DangerZoneRecord | null = null;

  await db.runTransaction(async transaction => {
    const freshSnap = await transaction.get(doc.ref);
    if (!freshSnap.exists) return;

    const data = freshSnap.data();
    const expiresAtMillis = timestampMillis(data.expiresAt);
    if (data.status !== 'verified' || data.isActive !== true || !expiresAtMillis || expiresAtMillis > Date.now()) {
      return;
    }

    const now = Timestamp.now();
    transaction.update(doc.ref, {
      status: 'expired',
      isActive: false,
      expiredBy: 'system',
      expiredAt: now,
      updatedAt: now,
      auditTrail: FieldValue.arrayUnion({
        action: 'expired',
        actorId: 'system',
        actorRole: 'system',
        at: now,
        note: 'Expired automatically by scheduled danger-zone expiry job',
      }),
    });

    expiredZone = {
      id: freshSnap.id,
      ...data,
      status: 'expired',
      isActive: false,
    } as DangerZoneRecord;
  });

  return expiredZone;
}

async function sendExpiredNotification(
  db: Firestore,
  messaging: Messaging,
  zone: DangerZoneRecord
): Promise<{ notificationId: string; skipped: boolean }> {
  const notificationId = buildDangerZoneNotificationId('expired', zone.id);
  const docRef = db.collection('notifications').doc(notificationId);
  const existing = await docRef.get();

  if (existing.exists) return { notificationId, skipped: true };

  const timestamp = Date.now();
  const title = 'Danger-zone update';
  const body = `A danger zone alert has expired: ${formatDangerType(zone.type)}.`;
  const targets = await getResidentTargets(db, zone.clientId);

  await docRef.set({
    id: notificationId,
    type: 'danger_zone',
    title,
    message: body,
    timestamp,
    createdAt: new Date(timestamp).toISOString(),
    clientId: zone.clientId,
    location: zone.municipalityName || zone.clientId,
    barangays: [],
    audience: 'users',
    sentTo: targets.totalResidents,
    deliveryStatus: {
      success: 0,
      failure: 0,
    },
    data: {
      notificationCategory: 'danger_zone',
      eventType: 'expired',
      dangerZoneId: zone.id,
      status: 'expired',
      severity: zone.severity,
      geometryType: zone.geometryType,
      dangerType: zone.type,
      description: zone.description,
      expiresAt: toIsoString(zone.expiresAt),
      actionPath: '/evacuation',
    },
  });

  const deliveryStatus = await sendFcmPush(messaging, {
    tokens: targets.tokens,
    title,
    body,
    zone,
  });

  await docRef.set({ deliveryStatus }, { merge: true });

  if (deliveryStatus.invalidTokens.length > 0) {
    clearInvalidUserTokens(db, deliveryStatus.invalidTokens).catch(error =>
      console.error('Failed to clear invalid danger-zone expiry tokens:', error)
    );
  }

  return { notificationId, skipped: false };
}

async function getResidentTargets(db: Firestore, clientId: string): Promise<{ tokens: string[]; totalResidents: number }> {
  const snapshot = await db.collection('users').where('clientId', '==', clientId).get();
  const tokens: string[] = [];

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const fcmTokens = Array.isArray(data.fcmTokens) ? data.fcmTokens : [];
    fcmTokens.forEach(token => {
      if (typeof token === 'string' && isValidToken(token)) tokens.push(token);
    });
    if (typeof data.fcmToken === 'string' && isValidToken(data.fcmToken)) tokens.push(data.fcmToken);
  });

  return { tokens: [...new Set(tokens)], totalResidents: snapshot.size };
}

async function sendFcmPush(
  messaging: Messaging,
  params: { tokens: string[]; title: string; body: string; zone: DangerZoneRecord }
): Promise<{ success: number; failure: number; errors: string[]; invalidTokens: string[] }> {
  if (params.tokens.length === 0) return { success: 0, failure: 0, errors: [], invalidTokens: [] };

  const errors: string[] = [];
  const invalidTokens: string[] = [];
  const results = await Promise.all(
    params.tokens.map(async token => {
      try {
        await messaging.send({
          token,
          notification: {
            title: params.title,
            body: params.body,
          },
          data: {
            type: 'danger_zone',
            notificationCategory: 'danger_zone',
            eventType: 'expired',
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
      } catch (error) {
        const code = (error as { code?: string; errorInfo?: { code?: string } })?.errorInfo?.code ?? (error as { code?: string })?.code ?? '';
        if (INVALID_FCM_TOKEN_CODES.has(code)) invalidTokens.push(token);
        errors.push(error instanceof Error ? error.message : String(error));
        return false;
      }
    })
  );

  const success = results.filter(Boolean).length;
  return {
    success,
    failure: params.tokens.length - success,
    errors,
    invalidTokens,
  };
}

async function clearInvalidUserTokens(db: Firestore, tokens: string[]): Promise<void> {
  for (const token of [...new Set(tokens)]) {
    const snapshot = await db.collection('users').where('fcmTokens', 'array-contains', token).get();
    if (snapshot.empty) continue;

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        fcmTokens: FieldValue.arrayRemove(token),
      });
    });
    await batch.commit();
  }
}

function buildDangerZoneNotificationId(eventType: string, dangerZoneId: string): string {
  return `danger_zone_${eventType}_${dangerZoneId}`.replace(/[^\w.-]/g, '_').slice(0, 700);
}

function formatDangerType(value: string): string {
  return (
    value
      .split('_')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Danger zone'
  );
}

function timestampMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof (value as { toMillis?: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof (value as { _seconds?: number })._seconds === 'number') {
    return (value as { _seconds: number })._seconds * 1000;
  }
  if (typeof (value as { seconds?: number }).seconds === 'number') {
    return (value as { seconds: number }).seconds * 1000;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }
  return 0;
}

function toIsoString(value: unknown): string | null {
  const millis = timestampMillis(value);
  return millis ? new Date(millis).toISOString() : null;
}

function isValidToken(token: string): boolean {
  return !!(token && token.length > 100 && token.includes(':'));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      ...(body === null ? {} : { 'Content-Type': 'application/json' }),
    },
  });
}
