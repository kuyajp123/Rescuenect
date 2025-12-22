const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

if (!BASE_URL) {
  console.error('❌ API base URL is not defined');
  throw new Error('API base URL not configured');
}

export const API_ROUTES = {
  AUTH: {
    SIGNIN: `${BASE_URL}/mobile/auth/signin`,
  },
  SYSTEM: {
    HEALTH: `${BASE_URL}/health`,
  },
  STATUS: {
    SAVE_STATUS: `${BASE_URL}/mobile/status/createStatus`,
    GET_STATUS: (statusId: string) => `${BASE_URL}/mobile/status/getStatus/${statusId}`,
    DELETE_STATUS: `${BASE_URL}/mobile/status/deleteStatus`,
    GET_ALL_MY_STATUSES: `${BASE_URL}/unified/getResidentStatuses`,
  },
  DATA: {
    SAVE_USER_DATA: `${BASE_URL}/mobile/data/saveUserInfo`,
    SAVE_BARANGAY_DATA: `${BASE_URL}/mobile/data/saveBarangay`,
    SAVE_FCMTOKENREFRESH: `${BASE_URL}/mobile/data/saveFcmTokenRefresh`,
    SAVE_LOCATION: `${BASE_URL}/mobile/data/saveLocation`,
    GET_LOCATIONS: `${BASE_URL}/mobile/data/getLocations`,
    DELETE_LOCATION: `${BASE_URL}/mobile/data/deleteLocation`,
    DELETE_USER: `${BASE_URL}/mobile/data/deleteUser`,
    // FCM Token Management
    UPDATE_FCM_TOKEN: `${BASE_URL}/mobile/data/updateFcmToken`,
    REMOVE_FCM_TOKEN: `${BASE_URL}/mobile/data/removeFcmToken`,
    GET_FCM_TOKENS: `${BASE_URL}/mobile/data/getFcmTokens`,
  },
  GEOCODING: {
    GET_ADDRESS: `${BASE_URL}/mobile/api/geoCoding`,
  },
  EVACUATION: {
    GET_CENTERS: `${BASE_URL}/unified/getCenters`,
  },
  NOTIFICATION: {
    GET_NOTIFICATION_DETAILS: `${BASE_URL}/unified/getNotificationDetails`,
    MARK_AS_READ: `${BASE_URL}/unified/markNotificationAsRead`,
    MARK_AS_READ_IN_STATUS_RESOLVED: `${BASE_URL}/mobile/data/markNotificationAsReadInStatusResolved`,
    MARK_ALL_AS_READ: `${BASE_URL}/unified/markAllNotificationsAsRead`,
    MARK_AS_HIDDEN: `${BASE_URL}/unified/markNotificationAsHidden`,
    MARK_AS_DELETED: `${BASE_URL}/mobile/data/markNotificationAsDeleted`,
  },
};
