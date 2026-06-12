const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/$/, '');

if (!BACKEND_URL) {
  console.error('VITE_BACKEND_URL is not configured');
}

export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN: `${BACKEND_URL}/admin/auth/signin`,
    ME: `${BACKEND_URL}/admin/me`,
    UPDATE_FCM_TOKEN: `${BACKEND_URL}/admin/config/update-fcm-token`,
    UPDATE_PROFILE: `${BACKEND_URL}/admin/auth/update-profile`,
    COMPLETE_ONBOARDING: `${BACKEND_URL}/admin/auth/complete-onboarding`,
    UPLOAD_CLIENT_LOGO: `${BACKEND_URL}/admin/auth/upload-client-logo`,
  },
  STATUS: {
    GET_VERSIONS: `${BACKEND_URL}/admin/status/getVersions`,
    RESOLVED_STATUS: `${BACKEND_URL}/admin/status/resolvedStatus`,
    GET_STATUS_HISTORY: `${BACKEND_URL}/admin/status/getStatusHistory`,
  },
  EVACUATION: {
    ADD_CENTER: `${BACKEND_URL}/admin/evacuation/addCenter`,
    GET_CENTERS: `${BACKEND_URL}/admin/evacuation/getCenters`,
    DELETE_CENTER: `${BACKEND_URL}/admin/evacuation/deleteCenter`,
    UPDATE_CENTER: `${BACKEND_URL}/admin/evacuation/updateCenter`,
  },
  NOTIFICATION: {
    MARK_AS_READ: `${BACKEND_URL}/unified/markNotificationAsRead`,
    MARK_AS_HIDDEN: `${BACKEND_URL}/unified/markNotificationAsHidden`,
    MARK_ALL_AS_READ: `${BACKEND_URL}/unified/markAllNotificationsAsRead`,
    MARK_ALL_AS_HIDDEN: `${BACKEND_URL}/unified/markAllNotificationsAsHidden`,
  },
  RESIDENTS: {
    GET_RESIDENTS: `${BACKEND_URL}/admin/residents/getResidents`,
    GET_RESIDENTS_STATUS: `${BACKEND_URL}/admin/status/getResidentStatuses`,
    GET_ALL_LATEST_STATUSES: `${BACKEND_URL}/admin/status/getAllLatestStatuses`,
  },
  ANNOUNCEMENT: {
    CREATE_ANNOUNCEMENT: `${BACKEND_URL}/admin/announcement/createAnnouncement`,
    GET_ALL_ANNOUNCEMENTS: `${BACKEND_URL}/admin/announcement/all`,
    GET_ANNOUNCEMENT_DETAILS: (id: string) => `${BACKEND_URL}/admin/announcement/details/${id}`,
    DELETE_ANNOUNCEMENT: `${BACKEND_URL}/admin/announcement/deleteAnnouncement`,
    UPDATE_ANNOUNCEMENT: `${BACKEND_URL}/admin/announcement/updateAnnouncement`,
  },
  CAROUSEL: {
    GET_ALL: `${BACKEND_URL}/admin/carousel/all`,
    CREATE: `${BACKEND_URL}/admin/carousel/create`,
    UPDATE: (id: string) => `${BACKEND_URL}/admin/carousel/update/${id}`,
    DELETE: (id: string) => `${BACKEND_URL}/admin/carousel/delete/${id}`,
    REORDER: `${BACKEND_URL}/admin/carousel/reorder`,
    SAVE_ALL: `${BACKEND_URL}/admin/carousel/save-all`,
  },
  CONTACTS: {
    GET_CONTACTS: `${BACKEND_URL}/admin/contacts/getContacts`,
    CREATE_CONTACT: `${BACKEND_URL}/admin/contacts/addContact`,
    UPLOAD_LOGO: `${BACKEND_URL}/admin/contacts/upload-logo`,
  },
  PUBLIC: {
    CLIENTS: `${BACKEND_URL}/public/clients`,
    MOBILE_APP_LATEST: `${BACKEND_URL}/public/mobile-app/latest`,
    PSGC_REGIONS: `${BACKEND_URL}/public/psgc/regions`,
    PSGC_PROVINCES: (regionCode: string) => `${BACKEND_URL}/public/psgc/regions/${regionCode}/provinces`,
    PSGC_REGION_MUNICIPALITIES: (regionCode: string) =>
      `${BACKEND_URL}/public/psgc/regions/${regionCode}/municipalities`,
    PSGC_MUNICIPALITIES: (provinceCode: string) =>
      `${BACKEND_URL}/public/psgc/provinces/${provinceCode}/municipalities`,
    PSGC_BARANGAYS: (municipalityCode: string) =>
      `${BACKEND_URL}/public/psgc/municipalities/${municipalityCode}/barangays`,
    LGU_REQUESTS: `${BACKEND_URL}/public/lgu-requests`,
  },
  SUPER_ADMIN: {
    OVERVIEW: `${BACKEND_URL}/admin/super/overview`,
    SUPABASE_MONITORING: `${BACKEND_URL}/admin/super/supabase`,
    SUPABASE_FUNCTION: (slug: string) => `${BACKEND_URL}/admin/super/supabase/functions/${encodeURIComponent(slug)}`,
    SUPABASE_STORAGE_BUCKET: (bucket: string) =>
      `${BACKEND_URL}/admin/super/supabase/storage/${encodeURIComponent(bucket)}`,
    SERVER_WAKEUP: `${BACKEND_URL}/admin/super/supabase/server-wakeup/status`,
    RUN_SERVER_WAKEUP: `${BACKEND_URL}/admin/super/supabase/server-wakeup/run`,
    LOGS: `${BACKEND_URL}/admin/super/logs`,
    LGU_REQUESTS: `${BACKEND_URL}/admin/super/lgu-requests`,
    DYNAMIC_CLIENT_CUTOVER_AUDIT: `${BACKEND_URL}/admin/super/migrations/dynamic-client-cutover-audit`,
    DYNAMIC_CLIENT_CUTOVER: `${BACKEND_URL}/admin/super/migrations/dynamic-client-cutover`,
    DELETE_LGU_REQUEST: (id: string) => `${BACKEND_URL}/admin/super/lgu-requests/${id}`,
    MOBILE_APP_RELEASE: `${BACKEND_URL}/admin/super/mobile-app/release`,
    APPROVE_LGU_REQUEST: (id: string) => `${BACKEND_URL}/admin/super/lgu-requests/${id}/approve`,
    REJECT_LGU_REQUEST: (id: string) => `${BACKEND_URL}/admin/super/lgu-requests/${id}/reject`,
    CLIENT_CHANGE_REQUESTS: `${BACKEND_URL}/admin/super/client-change-requests`,
    APPROVE_CLIENT_CHANGE_REQUEST: (id: string) => `${BACKEND_URL}/admin/super/client-change-requests/${id}/approve`,
    REJECT_CLIENT_CHANGE_REQUEST: (id: string) => `${BACKEND_URL}/admin/super/client-change-requests/${id}/reject`,
    DELETE_CLIENT_CHANGE_REQUEST: (id: string) => `${BACKEND_URL}/admin/super/client-change-requests/${id}`,
    CLIENTS: `${BACKEND_URL}/admin/super/clients`,
    CLIENT_DETAIL: (clientId: string) => `${BACKEND_URL}/admin/super/clients/${clientId}`,
    UPDATE_CLIENT: (clientId: string) => `${BACKEND_URL}/admin/super/clients/${clientId}`,
    CLIENT_DELETION_PREVIEW: (clientId: string) => `${BACKEND_URL}/admin/super/clients/${clientId}/deletion-preview`,
    SCHEDULE_CLIENT_DELETION: (clientId: string) => `${BACKEND_URL}/admin/super/clients/${clientId}/schedule-deletion`,
    CANCEL_CLIENT_DELETION: (clientId: string) => `${BACKEND_URL}/admin/super/clients/${clientId}/cancel-deletion`,
    CLIENT_ARCHIVES: `${BACKEND_URL}/admin/super/client-archives`,
    CLIENT_ARCHIVE_DETAIL: (archiveId: string) => `${BACKEND_URL}/admin/super/client-archives/${archiveId}`,
    DELETE_CLIENT_ARCHIVE: (archiveId: string) => `${BACKEND_URL}/admin/super/client-archives/${archiveId}`,
    ACTIVATE_CLIENT: (clientId: string) => `${BACKEND_URL}/admin/super/clients/${clientId}/activate`,
    DEACTIVATE_CLIENT: (clientId: string) => `${BACKEND_URL}/admin/super/clients/${clientId}/deactivate`,
    CLIENT_BOUNDARY: (clientId: string) => `${BACKEND_URL}/admin/super/clients/${clientId}/boundary`,
    ADMINS: `${BACKEND_URL}/admin/super/admins`,
    INVITE_ADMIN: `${BACKEND_URL}/admin/super/admins/invite`,
    UPDATE_ADMIN: (uid: string) => `${BACKEND_URL}/admin/super/admins/${encodeURIComponent(uid)}`,
    DELETE_ADMIN: (uid: string) => `${BACKEND_URL}/admin/super/admins/${encodeURIComponent(uid)}`,
    SYSTEM_STATUS: `${BACKEND_URL}/admin/super/system-status`,
  },
  LGU_ADMIN: {
    CLIENT: `${BACKEND_URL}/admin/lgu/client`,
    CHANGE_REQUESTS: `${BACKEND_URL}/admin/lgu/change-requests`,
    CREATE_CHANGE_REQUEST: `${BACKEND_URL}/admin/lgu/change-requests`,
    CANCEL_CHANGE_REQUEST: (id: string) => `${BACKEND_URL}/admin/lgu/change-requests/${id}/cancel`,
  }
};
