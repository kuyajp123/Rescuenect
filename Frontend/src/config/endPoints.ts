const BACKEND_URL = import.meta.env.VITE_BACKEND_URL!;

if (!BACKEND_URL) {
  console.error('❌ BACKEND_URL is not defined');
  throw new Error('BACKEND_URL not configured');
}

export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN: `${BACKEND_URL}/admin/auth/signin`,
    UPDATE_FCM_TOKEN: `${BACKEND_URL}/admin/config/update-fcm-token`,
    UPDATE_PROFILE: `${BACKEND_URL}/admin/auth/update-profile`,
  },
  STATUS: {
    GET_VERSIONS: `${BACKEND_URL}/admin/status/getVersions`,
    RESOLVED_STATUS: `${BACKEND_URL}/admin/status/resolvedStatus`,
  },
  EVACUATION: {
    ADD_CENTER: `${BACKEND_URL}/admin/evacuation/addCenter`,
    GET_CENTERS: `${BACKEND_URL}/unified/getCenters`,
    DELETE_CENTER: `${BACKEND_URL}/admin/evacuation/deleteCenter`,
    UPDATE_CENTER: `${BACKEND_URL}/admin/evacuation/updateCenter`,
  },
  NOTIFICATION: {
    MARK_AS_READ: `${BACKEND_URL}/unified/markNotificationAsRead`,
    MARK_AS_HIDDEN: `${BACKEND_URL}/unified/markNotificationAsHidden`,
  },
  RESIDENTS: {
    GET_RESIDENTS: `${BACKEND_URL}/admin/residents/getResidents`,
    GET_RESIDENTS_STATUS: `${BACKEND_URL}/unified/getResidentStatuses`,
    GET_ALL_LATEST_STATUSES: `${BACKEND_URL}/admin/status/getAllLatestStatuses`,
  },
};
