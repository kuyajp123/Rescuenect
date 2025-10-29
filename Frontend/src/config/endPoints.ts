const BACKEND_URL = import.meta.env.VITE_BACKEND_URL!;

if (!BACKEND_URL) {
  console.error('❌ BACKEND_URL is not defined');
  throw new Error('BACKEND_URL not configured');
}

export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN: `${BACKEND_URL}}/admin/auth/signin`,
  },
  STATUS: {
    GET_VERSIONS: (parentId: string) => `${BACKEND_URL}/admin/status/getVersions/${parentId}`,
  }
};
