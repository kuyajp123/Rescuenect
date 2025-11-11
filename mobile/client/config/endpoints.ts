const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

if (!BASE_URL) {
  console.error('❌ API base URL is not defined');
  throw new Error('API base URL not configured');
}

export const API_ROUTES = {
  AUTH: {
    SIGNIN: `${BASE_URL}/mobile/auth/signin`,
  },
  STATUS: {
    SAVE_STATUS: `${BASE_URL}/mobile/status/createStatus`,
    GET_STATUS: (statusId: string) => `${BASE_URL}/mobile/status/getStatus/${statusId}`,
    DELETE_STATUS: `${BASE_URL}/mobile/status/deleteStatus`,
  },
  DATA: {
    SAVE_USER_DATA: `${BASE_URL}/mobile/data/saveUserInfo`,
    SAVE_BARANGAY_DATA: `${BASE_URL}/mobile/data/saveBarangay`,
    SAVE_FCMTOKENREFRESH: `${BASE_URL}/mobile/data/saveFcmTokenRefresh`,
    SAVE_LOCATION: `${BASE_URL}/mobile/data/saveLocation`,
    GET_LOCATIONS: `${BASE_URL}/mobile/data/getLocations`,
  },
  GEOCODING: {
    GET_ADDRESS: `${BASE_URL}/mobile/api/geoCoding`,
  },
};
