const BACKEND_URL = import.meta.env.VITE_BACKEND_URL!;

// Debug logging
console.log('🔍 Frontend Environment Check:');
console.log('🔍 VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
console.log('🔍 Resolved BACKEND_URL:', BACKEND_URL);

if (!BACKEND_URL) {
  console.error('❌ BACKEND_URL is not defined');
  throw new Error('BACKEND_URL not configured');
}

export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN: `${BACKEND_URL}/admin/auth/signin`,
  },
  STATUS: {
    GET_VERSIONS: `${BACKEND_URL}/admin/status/getVersions`,
  },
};
