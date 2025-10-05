import axios from 'axios';
import { API_ROUTES } from '@/config/endpoints';

// Fetch status and save data to StatusFormStore
export const fetchAndSaveStatusData = async (statusId: string, idToken: string): Promise<any> => {
  try {
    const response = await axios.get(API_ROUTES.STATUS.GET_STATUS(statusId), {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      // timeout: 10000
    });

    // console.log("✅ Status data fetch response:", JSON.stringify(response.data, null, 2));
    return { success: true, data: response.data.data, error: null };
  } catch (error: any) {
    console.error('❌ Error fetching status data:', error.message);

    // ✅ Fix: Handle different error types
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Request timeout');
      return { success: false, data: null, error: 'Request timeout' };
    }

    if (error.response) {
      console.error('❌ Server error:', error.response.status, error.response.data);
      return { success: false, data: null, error: error.response.data?.message || 'Server error' };
    }

    if (error.request) {
      console.error('❌ Network error - no response received');
      return { success: false, data: null, error: 'Network error' };
    }

    return { success: false, data: null, error: error.message || 'Unknown error' };
  }
};
