import axios from 'axios';

// Fetch status and save data to StatusFormStore
export const fetchAndSaveStatusData = async (statusId: string, idToken: string): Promise<any> => {
    const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

    if (!API_URL) {
        console.log("❌ API URL is not defined");
        return { success: false, data: null, error: 'API URL not configured' };
    }

    try {
        console.log("🔄 Fetching status data for user:", statusId);
        
        const response = await axios.get(`${API_URL}/status/getStatus/${statusId}`, {
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`
            },
            timeout: 10000, // ✅ Fix: Add 10 second timeout
        });
        
        console.log("✅ Status data fetch response:", response.data);
        return { success: true, data: response.data.data, error: null };
        
    } catch (error: any) {
        console.error("❌ Error fetching status data:", error.message);
        
        // ✅ Fix: Handle different error types
        if (error.code === 'ECONNABORTED') {
            console.error("❌ Request timeout");
            return { success: false, data: null, error: 'Request timeout' };
        }
        
        if (error.response) {
            console.error("❌ Server error:", error.response.status, error.response.data);
            return { success: false, data: null, error: error.response.data?.message || 'Server error' };
        }
        
        if (error.request) {
            console.error("❌ Network error - no response received");
            return { success: false, data: null, error: 'Network error' };
        }
        
        return { success: false, data: null, error: error.message || 'Unknown error' };
    }
}