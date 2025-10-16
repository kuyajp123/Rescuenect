// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import '@supabase/functions-js/edge-runtime.d.ts';
import { serve } from 'serve';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface CleanupResults {
  expiredStatuses: number;
  retentionExpired: number;
  imagesDeleted: number;
  errors: string[];
}

interface FirebaseAuth {
  token: string;
  projectId: string;
}

console.log('Status cleanup function starting...');

serve(async () => {
  try {
    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Starting automated status cleanup...');

    const results: CleanupResults = {
      expiredStatuses: 0,
      retentionExpired: 0,
      imagesDeleted: 0,
      errors: [],
    };

    // Get Firebase authentication
    console.log('🔄 Getting Firebase authentication...');
    const firebaseAuth = await getFirebaseAuthToken();
    if (!firebaseAuth) {
      results.errors.push('Firebase authentication not configured - check logs for details');
      console.log('❌ Firebase credentials not configured, skipping Firestore cleanup');
    } else {
      console.log('✅ Firebase authentication successful');
      // 1. EXPIRE CURRENT STATUSES (move to history)
      await expireCurrentStatuses(supabaseAdmin, results, firebaseAuth);

      // 2. DELETE RETENTION-EXPIRED DOCUMENTS (with image cleanup)
      await deleteRetentionExpiredStatuses(supabaseAdmin, results, firebaseAuth);
    }
    console.log('✅ Cleanup completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Status cleanup completed successfully',
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error in status cleanup:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Status cleanup failed',
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
    console.log('🔍 Project ID found:', projectId ? 'Yes' : 'No');

    // Option A: Use service account JSON
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    console.log('🔍 Service Account JSON found:', serviceAccountJson ? 'Yes' : 'No');

    if (serviceAccountJson && projectId) {
      try {
        console.log('🔄 Parsing service account JSON...');
        console.log('📋 First 100 chars of JSON:', serviceAccountJson.substring(0, 100));

        let serviceAccount;

        // Check if the JSON is Base64 encoded
        if (serviceAccountJson.startsWith('ew') || !serviceAccountJson.startsWith('{')) {
          console.log('🔄 Detected Base64 encoded service account, decoding...');
          try {
            const decodedJson = atob(serviceAccountJson);
            console.log('📋 Decoded JSON first 100 chars:', decodedJson.substring(0, 100));
            serviceAccount = JSON.parse(decodedJson);
          } catch (decodeError) {
            console.error('❌ Failed to decode Base64:', decodeError);
            throw new Error('Failed to decode Base64 service account JSON');
          }
        } else {
          // Clean up the JSON string - remove any potential escape characters
          const cleanedJson = serviceAccountJson
            .replace(/\\"/g, '"') // Replace escaped quotes
            .replace(/\\\\/g, '\\') // Replace double backslashes
            .trim(); // Remove whitespace

          console.log('📋 Cleaned JSON first 100 chars:', cleanedJson.substring(0, 100));
          serviceAccount = JSON.parse(cleanedJson);
        }

        console.log('✅ Service account parsed successfully');
        console.log('📧 Client email:', serviceAccount.client_email);

        // Validate required fields
        if (!serviceAccount.private_key || !serviceAccount.client_email) {
          console.error('❌ Missing required fields in service account JSON');
          throw new Error('Invalid service account JSON - missing private_key or client_email');
        }

        // Create JWT for service account authentication
        const now = Math.floor(Date.now() / 1000);
        const iat = now;
        const exp = now + 3600; // 1 hour expiry

        const header = {
          alg: 'RS256',
          typ: 'JWT',
        };

        const payload = {
          iss: serviceAccount.client_email,
          sub: serviceAccount.client_email,
          aud: 'https://oauth2.googleapis.com/token',
          iat,
          exp,
          scope: 'https://www.googleapis.com/auth/cloud-platform',
        };

        console.log('🔄 Creating JWT...');
        // Get access token using service account
        const jwt = await createJWT(header, payload, serviceAccount.private_key);
        console.log('✅ JWT created successfully');

        console.log('🔄 Requesting access token...');
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
          }),
        });

        const responseText = await tokenResponse.text();
        console.log('📋 Token response status:', tokenResponse.status);

        if (tokenResponse.ok) {
          const tokenData = JSON.parse(responseText);
          console.log('✅ Access token obtained successfully via JWT');
          return { token: tokenData.access_token, projectId };
        } else {
          console.error('❌ Failed to get access token via JWT:', responseText);
        }
      } catch (parseError) {
        console.error('❌ Error in service account authentication:', parseError);
        console.error('❌ Raw service account JSON (first 200 chars):', serviceAccountJson?.substring(0, 200));
        console.log('ℹ️ Falling back to access token method...');
      }
    }

    // Option B: Use pre-generated access token
    const accessToken = Deno.env.get('FIREBASE_ACCESS_TOKEN');
    if (accessToken && projectId) {
      console.log('✅ Using pre-generated access token');
      return { token: accessToken, projectId };
    }

    console.log('ℹ️ No Firebase credentials found');
    return null;
  } catch (error) {
    console.error('❌ Error getting Firebase auth token:', error);
    return null;
  }
}

async function createJWT(
  header: Record<string, string>,
  payload: Record<string, string | number>,
  privateKey: string
): Promise<string> {
  console.log('🔄 Starting JWT creation...');
  const encoder = new TextEncoder();

  // Base64URL encode header and payload
  const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  console.log('📋 Signing input prepared');

  try {
    console.log('🔄 Processing private key...');
    // Clean up the private key
    const cleanPrivateKey = privateKey
      .replace(/\\n/g, '\n')
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');

    console.log('🔄 Converting private key to binary...');
    // Convert base64 to binary
    const binaryKey = Uint8Array.from(atob(cleanPrivateKey), c => c.charCodeAt(0));
    console.log('📋 Private key converted, length:', binaryKey.length);

    console.log('🔄 Importing crypto key...');
    // Import the private key for signing
    const key = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );
    console.log('✅ Crypto key imported successfully');

    console.log('🔄 Signing JWT...');
    // Sign the input
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(signingInput));
    console.log('✅ JWT signed successfully');

    // Base64URL encode the signature
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const finalJWT = `${signingInput}.${encodedSignature}`;
    console.log('✅ JWT creation completed');
    return finalJWT;
  } catch (error) {
    console.error('❌ Error creating JWT:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function expireCurrentStatuses(
  _supabaseAdmin: SupabaseClient,
  results: CleanupResults,
  firebaseAuth: FirebaseAuth
) {
  console.log('⏰ Processing expired current statuses...');

  try {
    const now = new Date().toISOString();

    // Query all expired current statuses across all users via Firestore REST API
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

    console.log('🔍 Querying Firestore for expired statuses...');

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
      results.errors.push(`Firestore query failed: ${response.status} ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log('📋 Firestore response:', JSON.stringify(data, null, 2));

    // Handle empty results
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('ℹ️ No expired current statuses found');
      return;
    }

    console.log(`📋 Found ${data.length} expired current statuses`);

    // Update statuses to history type using Firestore REST API
    for (const docResult of data) {
      try {
        // Handle different response structures
        const document = docResult.document || docResult;

        if (!document || !document.name) {
          console.log('⚠️ Skipping invalid document structure:', docResult);
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
          const versionId = document.fields?.versionId?.stringValue || 'unknown';
          console.log(`✅ Expired status: ${versionId}`);
        } else {
          const error = await updateResponse.text();
          console.error(`❌ Failed to update status:`, error);
          results.errors.push(`Failed to expire status: ${error}`);
        }
      } catch (error) {
        console.error(`❌ Error processing status:`, error);
        results.errors.push(`Error expiring status: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } catch (error) {
    console.error('❌ Error in expireCurrentStatuses:', error);
    results.errors.push(`Expire process error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function deleteRetentionExpiredStatuses(
  supabaseAdmin: SupabaseClient,
  results: CleanupResults,
  firebaseAuth: FirebaseAuth
) {
  console.log('🗑️ Processing retention-expired statuses...');

  try {
    const now = new Date().toISOString();

    // Query retention-expired documents
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
                  op: 'IN',
                  value: {
                    arrayValue: {
                      values: [{ stringValue: 'history' }, { stringValue: 'deleted' }],
                    },
                  },
                },
              },
              {
                fieldFilter: {
                  field: { fieldPath: 'retentionUntil' },
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

    console.log('🔍 Querying Firestore for retention-expired statuses...');

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
      console.error('❌ Firestore retention query failed:', response.status, errorText);
      results.errors.push(`Firestore retention query failed: ${response.status} ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log('📋 Firestore retention response:', JSON.stringify(data, null, 2));

    // Handle empty results
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('ℹ️ No retention-expired statuses found');
      return;
    }

    console.log(`📋 Found ${data.length} retention-expired statuses`);

    // Process each expired status
    for (const docResult of data) {
      try {
        // Handle different response structures
        const document = docResult.document || docResult;

        if (!document || !document.name || !document.fields) {
          console.log('⚠️ Skipping invalid document structure:', docResult);
          continue;
        }

        const fields = document.fields;
        const imageUrl = fields.image?.stringValue || '';
        const uid = fields.uid?.stringValue || '';
        const parentId = fields.parentId?.stringValue || '';
        const versionId = fields.versionId?.stringValue || '';

        // 1. Delete associated image from Supabase Storage (if exists)
        if (imageUrl && imageUrl !== '') {
          await deleteStatusImage(supabaseAdmin, imageUrl, uid, parentId, versionId);
          results.imagesDeleted++;
        }

        // 2. Delete the Firestore document
        const docPath = document.name;
        const deleteUrl = `https://firestore.googleapis.com/v1/${docPath}`;

        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${firebaseAuth.token}`,
          },
        });

        if (deleteResponse.ok) {
          results.retentionExpired++;
          console.log(`✅ Deleted expired status: ${versionId}`);
        } else {
          const error = await deleteResponse.text();
          console.error(`❌ Failed to delete status:`, error);
          results.errors.push(`Failed to delete status: ${error}`);
        }
      } catch (error) {
        console.error(`❌ Error processing retention-expired status:`, error);
        results.errors.push(`Error deleting status: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } catch (error) {
    console.error('❌ Error in deleteRetentionExpiredStatuses:', error);
    results.errors.push(`Retention cleanup error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function deleteStatusImage(
  supabaseAdmin: SupabaseClient,
  imageUrl: string,
  userId: string,
  parentId: string,
  versionId: string
) {
  try {
    if (!imageUrl || imageUrl === '') {
      return; // Nothing to delete
    }

    // Extract file path from public URL or construct it
    let filePath: string;

    if (imageUrl.includes('supabase')) {
      // Extract path from Supabase public URL
      // URL format: https://project.supabase.co/storage/v1/object/public/status-images/userId/filename
      const url = new URL(imageUrl);
      const pathSegments = url.pathname.split('/');
      // Find 'status-images' in path and take everything after it
      const bucketIndex = pathSegments.findIndex(segment => segment === 'status-images');
      if (bucketIndex !== -1) {
        filePath = pathSegments.slice(bucketIndex + 1).join('/');
      } else {
        // Fallback: construct path based on naming convention
        const fileExtension = imageUrl.split('.').pop() || 'jpg';
        filePath = `${userId}/${parentId}-${versionId}.${fileExtension}`;
      }
    } else {
      // Construct path based on our naming convention from IMAGE_UPLOAD_ARCHITECTURE.md
      const fileExtension = imageUrl.split('.').pop() || 'jpg';
      filePath = `${userId}/${parentId}-${versionId}.${fileExtension}`;
    }

    console.log(`🗑️ Deleting image from Supabase Storage: ${filePath}`);

    const { error } = await supabaseAdmin.storage.from('status-images').remove([filePath]);

    if (error) {
      console.error('❌ Error deleting image from storage:', error);
      // Don't throw - continue with document deletion even if image deletion fails
    } else {
      console.log(`✅ Successfully deleted image: ${filePath}`);
    }
  } catch (error) {
    console.error('❌ Error in deleteStatusImage:', error);
    // Don't throw - continue with document deletion even if image deletion fails
  }
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/status-cleanup' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
