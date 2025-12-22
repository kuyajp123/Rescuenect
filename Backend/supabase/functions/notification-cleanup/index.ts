// Notification Cleanup Edge Function
// Automatically deletes notifications older than 1 month (30 days)
// Designed to be run as a scheduled cron job

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const CLEANUP_DAYS = 30; // 1 month

interface FirebaseAuth {
  token: string;
  projectId: string;
}

console.log('🗑️ Notification Cleanup Function - Initializing...');

Deno.serve(async req => {
  try {
    // Verify request method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`🧹 Starting notification cleanup (${CLEANUP_DAYS} days)...`);

    // Get Firebase authentication
    const firebaseAuth = await getFirebaseAuthToken();
    if (!firebaseAuth) {
      throw new Error('Firebase authentication failed - credentials not configured');
    }

    // Perform cleanup using Firestore REST API
    const deletedCount = await deleteOldNotifications(firebaseAuth, CLEANUP_DAYS);

    const result = {
      success: true,
      message: `Successfully cleaned up old notifications`,
      deletedCount,
      cleanupThreshold: `${CLEANUP_DAYS} days`,
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ Cleanup complete: ${deletedCount} notifications deleted`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Notification cleanup failed:', error);

    const errorResponse = {
      success: false,
      error: 'Notification cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function getFirebaseAuthToken(): Promise<FirebaseAuth | null> {
  try {
    const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');

    if (serviceAccountJson && projectId) {
      try {
        let serviceAccount;

        // Check if the JSON is Base64 encoded
        if (serviceAccountJson.startsWith('ew') || !serviceAccountJson.startsWith('{')) {
          try {
            const decodedJson = atob(serviceAccountJson);
            serviceAccount = JSON.parse(decodedJson);
          } catch (decodeError) {
            console.error('❌ Failed to decode Base64 service account JSON:', decodeError);
            throw new Error('Failed to decode Base64 service account JSON');
          }
        } else {
          // Clean up the JSON string - remove any potential escape characters
          const cleanedJson = serviceAccountJson.replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim();

          serviceAccount = JSON.parse(cleanedJson);
        }

        console.log('🔐 Authenticating with Firebase using service account:', serviceAccount.client_email);

        // Validate required fields
        if (!serviceAccount.private_key || !serviceAccount.client_email) {
          throw new Error('Invalid service account JSON - missing required fields');
        }

        // Create JWT for service account authentication
        const now = Math.floor(Date.now() / 1000);
        const header = { alg: 'RS256', typ: 'JWT' };
        const payload = {
          iss: serviceAccount.client_email,
          sub: serviceAccount.client_email,
          aud: 'https://oauth2.googleapis.com/token',
          iat: now,
          exp: now + 3600,
          scope: 'https://www.googleapis.com/auth/cloud-platform',
        };

        const jwt = await createJWT(header, payload, serviceAccount.private_key);

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
          }),
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          console.log('✅ Firebase authentication successful');
          return { token: tokenData.access_token, projectId };
        } else {
          const errorText = await tokenResponse.text();
          console.error('❌ Failed to obtain Firebase access token:', errorText);
        }
      } catch (parseError) {
        console.error('❌ Service account authentication failed:', parseError);
      }
    }

    // Fallback: Use pre-generated access token
    const accessToken = Deno.env.get('FIREBASE_ACCESS_TOKEN');
    if (accessToken && projectId) {
      console.log('🔐 Using fallback access token for Firebase authentication');
      return { token: accessToken, projectId };
    }

    console.error('❌ No valid Firebase credentials found');
    return null;
  } catch (error) {
    console.error('❌ Firebase authentication error:', error);
    return null;
  }
}

async function createJWT(
  header: Record<string, string>,
  payload: Record<string, string | number>,
  privateKey: string
): Promise<string> {
  const encoder = new TextEncoder();

  // Base64URL encode header and payload
  const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  try {
    // Clean up the private key
    const cleanPrivateKey = privateKey
      .replace(/\\n/g, '\n')
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');

    // Convert base64 to binary and import key
    const binaryKey = Uint8Array.from(atob(cleanPrivateKey), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Sign and encode
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(signingInput));
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return `${signingInput}.${encodedSignature}`;
  } catch (error) {
    console.error('❌ JWT creation failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function deleteOldNotifications(firebaseAuth: FirebaseAuth, daysOld: number): Promise<number> {
  try {
    // Calculate threshold date (notifications older than this will be deleted)
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysOld);
    const thresholdTimestamp = thresholdDate.getTime(); // Convert to milliseconds

    console.log(
      `📅 Deleting notifications older than: ${new Date(thresholdTimestamp).toISOString()} (${thresholdTimestamp}ms)`
    );

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseAuth.projectId}/databases/(default)/documents:runQuery`;

    // Query notifications older than threshold
    const query = {
      structuredQuery: {
        from: [{ collectionId: 'notifications' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'timestamp' },
            op: 'LESS_THAN',
            value: { integerValue: thresholdTimestamp.toString() },
          },
        },
        limit: 500, // Process in batches of 500
      },
    };

    const response = await fetch(firestoreUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${firebaseAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firestore query failed:', response.status, errorText);
      throw new Error(`Firestore query failed: ${response.status}`);
    }

    const data = await response.json();

    // Handle empty results
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('ℹ️ No old notifications found');
      return 0;
    }

    console.log(`📋 Found ${data.length} notifications to delete`);

    let deletedCount = 0;

    // Delete each notification document
    for (const docResult of data) {
      try {
        const document = docResult.document || docResult;

        if (!document || !document.name) {
          continue;
        }

        // Delete the Firestore document
        const docPath = document.name;
        const deleteUrl = `https://firestore.googleapis.com/v1/${docPath}`;

        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${firebaseAuth.token}`,
          },
        });

        if (deleteResponse.ok) {
          deletedCount++;
        } else {
          const error = await deleteResponse.text();
          console.error(`❌ Failed to delete notification: ${error}`);
        }
      } catch (error) {
        console.error(`❌ Error processing notification:`, error);
      }
    }

    console.log(`✅ Successfully deleted ${deletedCount} notifications`);
    return deletedCount;
  } catch (error) {
    console.error('❌ Error in deleteOldNotifications:', error);
    throw error;
  }
}

/*
 * DEPLOYMENT INSTRUCTIONS:
 *
 * 1. Deploy this function:
 *    supabase functions deploy notification-cleanup
 *
 * 2. Set up environment variables in Supabase Dashboard:
 *    - FIREBASE_SERVICE_ACCOUNT_JSON (your Firebase service account)
 *    - CRON_SECRET (optional: secret token for authorization)
 *
 * 3. Set up a cron job to run this function daily:
 *    - Go to Supabase Dashboard > Edge Functions > notification-cleanup
 *    - Add a cron trigger: "0 2 * * *" (runs daily at 2 AM)
 *    OR use Supabase CLI:
 *    supabase functions schedule notification-cleanup --cron "0 2 * * *"
 *
 * 4. Test the function locally:
 *    supabase functions serve notification-cleanup
 *
 *    Then invoke:
 *    curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/notification-cleanup' \
 *      --header 'Authorization: Bearer YOUR_CRON_SECRET' \
 *      --header 'Content-Type: application/json'
 *
 * 5. Monitor logs:
 *    supabase functions logs notification-cleanup
 */
