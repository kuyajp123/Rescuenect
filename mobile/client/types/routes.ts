// Type definitions for Expo Router routes
export type AppRoute = 
  | '/auth/signIn'
  | '/auth/barangayForm'
  | '/(tabs)'
  | `/(tabs)/${string}`;

// Type-safe route constants
export const ROUTES = {
  AUTH: {
    SIGN_IN: '/auth/signIn' as const,
    BARANGAY_FORM: '/auth/barangayForm' as const,
  },
  TABS: '/(tabs)' as const,
} as const;

// Helper type for router.replace
export type RouterReplaceRoute = AppRoute;
