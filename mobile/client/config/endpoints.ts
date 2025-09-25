const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

if (!BASE_URL) {
    console.error("❌ API base URL is not defined");
    throw new Error('API base URL not configured');
}

export const API_ROUTES = {
    AUTH: {
        SIGNIN: `${BASE_URL}/auth/signin`,
    },
    STATUS: {
        SAVE_STATUS: `${BASE_URL}/status/createStatus`,
        GET_STATUS: (statusId: string) => `${BASE_URL}/status/getStatus/${statusId}`,
    },
    DATA: {
        SAVE_USER_DATA: `${BASE_URL}/data/saveUserInfo`,
        SAVE_BARANGAY_DATA: `${BASE_URL}/data/saveBarangay`,
    },
    GEOCODING: {
        GET_ADDRESS: `${BASE_URL}/api/geoCoding`,
    }
}