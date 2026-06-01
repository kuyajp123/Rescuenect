// Type definitions for Expo Router routes
export type AppRoute = 
  | '/auth/signIn'
  | '/auth/barangayForm'
  | '/auth/nameAndContactForm'
  | '/auth/setupComplete'
  | '/(app)/(tabs)'
  | `/(app)/(tabs)/${string}`;

// Type-safe route constants
export const ROUTES = {
  AUTH: {
    SIGN_IN: '/auth/signIn' as const,
    BARANGAY_FORM: '/auth/barangayForm' as const,
    NAME_AND_CONTACT_FORM: '/auth/nameAndContactForm' as const,
    SETUP_COMPLETE: '/auth/setupComplete' as const,
  },
  TABS: '/(app)/(tabs)' as const,
} as const;

// Helper type for router.replace
export type RouterReplaceRoute = AppRoute;
