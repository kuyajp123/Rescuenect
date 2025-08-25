import { useAuth } from '@/components/store/useAuth';

// Helper function to get current auth state (reusable throughout the app)
export const getCurrentUser = () => {
    return useAuth.getState().authUser;
};

// Helper function to check if user is authenticated (reusable throughout the app)
export const isAuthenticated = () => {
    return useAuth.getState().authUser !== null;
};

// Helper function to check if auth is loading (reusable throughout the app)
export const isAuthLoading = () => {
    return useAuth.getState().isLoading;
};

// Re-export the main auth initialization function for backward compatibility
export { initializeAuth as loadUserAuth } from './firebaseAuth';