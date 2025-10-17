import '@supabase/functions-js/edge-runtime.d.ts';
import { serve } from 'serve';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface CleanupResults {
  expiredStatuses: number;
  errors: string[];
}

interface FirebaseAuth {
  token: string;
  projectId: string;
}

console.log('🕐 Status Expire Function - Initializing...');

serve(async () => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results: CleanupResults = {
      expiredStatuses: 0,
      errors: [],
    };

    const firebaseAuth = await getFirebaseAuthToken();
    if (!firebaseAuth) {
      results.errors.push('Firebase authentication not configured');
      console.error('❌ Authentication failed - Firebase credentials not available');
    } else {
      await expireCurrentStatuses(supabaseAdmin, results, firebaseAuth);
    }

    if (results.errors.length > 0) {
      console.error('⚠️ Status expiration completed with errors:', results);
    } else {
      console.log(`✅ Status expiration completed successfully - Expired: ${results.expiredStatuses} statuses`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Status expiration completed successfully',
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error in status expiration:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Status expiration failed',
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
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
          const cleanedJson = serviceAccountJson
            .replace(/\\"/g, '"') // Replace escaped quotes
            .replace(/\\\\/g, '\\') // Replace double backslashes
            .trim(); // Remove whitespace

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

async function expireCurrentStatuses(
  _supabaseAdmin: SupabaseClient,
  results: CleanupResults,
  firebaseAuth: FirebaseAuth
) {
  try {
    const now = new Date().toISOString();
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseAuth.projectId}/databases/(default)/documents:runQuery`;

    const query = {
      structuredQuery: {
        from: [{ collectionId: 'statuses', allDescendants: true }],
        where: {
          compositeFilter: {
            op: 'AND',
            filters: [
              {
                fieldFilter: {
                  field: { fieldPath: 'statusType' },
                  op: 'EQUAL',
                  value: { stringValue: 'current' },
                },
              },
              {
                fieldFilter: {
                  field: { fieldPath: 'expiresAt' },
                  op: 'LESS_THAN',
                  value: { timestampValue: now },
                },
              },
            ],
          },
        },
        limit: 500,
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
      results.errors.push(`Firestore query failed: ${response.status}`);
      return;
    }

    const data = await response.json();

    // Handle empty results
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('ℹ️ No expired statuses found');
      return;
    }

    console.log(`📋 Found ${data.length} expired statuses to process`);

    // Update statuses to history type
    for (const docResult of data) {
      try {
        const document = docResult.document || docResult;

        if (!document || !document.name) {
          continue;
        }

        const docPath = document.name;
        const updateUrl = `https://firestore.googleapis.com/v1/${docPath}`;

        const updateResponse = await fetch(
          updateUrl + '?updateMask.fieldPaths=statusType&updateMask.fieldPaths=updatedAt',
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${firebaseAuth.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: {
                statusType: { stringValue: 'history' },
                updatedAt: { timestampValue: new Date().toISOString() },
              },
            }),
          }
        );

        if (updateResponse.ok) {
          results.expiredStatuses++;
        } else {
          const error = await updateResponse.text();
          console.error(`❌ Failed to expire status: ${error}`);
          results.errors.push('Failed to expire status');
        }
      } catch (error) {
        console.error(`❌ Error processing status:`, error);
        results.errors.push('Error processing status');
      }
    }
  } catch (error) {
    console.error('❌ Error in expireCurrentStatuses:', error);
    results.errors.push(`Expire process error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
