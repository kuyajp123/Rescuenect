# FCM Token Management System

Complete FCM (Firebase Cloud Messaging) token management for React Native Expo app with multi-device support.

## Overview

This system manages FCM tokens across multiple user devices, automatically handling token registration, refresh, cleanup, and multi-device push notifications.

## Architecture

### Frontend (React Native)

- **Service**: `fcmTokenService.ts` - Core FCM token operations
- **Hook**: `useLogout.ts` - Logout with token cleanup
- **Layout**: `_layout.tsx` - Global token lifecycle management

### Backend (Node.js/Express)

- **Model**: `UserDataModel.ts` - Firestore operations for fcmTokens array
- **Controller**: `User.Data.Controller.ts` - HTTP endpoints for token management
- **Service**: `individualNotification.ts` - Multi-device notification delivery
- **Routes**: `userData.ts` - API routes for token operations

## Firestore Structure

```typescript
users/
  └── {userId}/
      ├── fcmTokens: string[]  // Array of device tokens (auto-managed)
      ├── notifications: array  // User notifications
      └── ... other user data
```

### Why Array of Tokens?

- Users can have multiple devices (phone, tablet, etc.)
- Each device gets its own FCM token
- Notifications are sent to all registered devices
- Invalid tokens are automatically cleaned up

## Frontend Implementation

### 1. FCM Token Service

```typescript
import { FCMTokenService } from '@/services/fcmTokenService';

// Register token on login
await FCMTokenService.updateUserFcmToken(authUser);

// Setup token refresh listener
const unsubscribe = FCMTokenService.setupTokenRefreshListener(authUser, newToken => {
  console.log('Token refreshed:', newToken);
});

// Remove token on logout
await FCMTokenService.removeFcmToken(authUser);

// Check notification permission
const hasPermission = await FCMTokenService.checkNotificationPermission();
```

### 2. Logout Hook

```typescript
import { useLogout } from '@/hooks/useLogout';

function SettingsScreen() {
  const { logout } = useLogout();

  const handleLogout = async () => {
    await logout(); // Automatically removes FCM token
  };

  return <Button onPress={handleLogout}>Logout</Button>;
}
```

### 3. App Layout Integration

The `_layout.tsx` automatically handles:

- Token registration on login
- Token refresh monitoring
- Token cleanup on logout

```typescript
// This is already implemented in _layout.tsx
useEffect(() => {
  if (!authUser) return;

  // Register token
  FCMTokenService.updateUserFcmToken(authUser);

  // Setup refresh listener
  const unsubscribe = FCMTokenService.setupTokenRefreshListener(authUser, newToken => {
    setUserData(prev => ({
      userData: { ...prev.userData, fcmToken: newToken },
    }));
  });

  return () => unsubscribe();
}, [authUser]);
```

## Backend Implementation

### 1. API Endpoints

```typescript
// Add/update FCM token (auto-deduplicates)
POST /mobile/data/updateFcmToken
Body: { uid: string, fcmToken: string }

// Remove FCM token on logout
POST /mobile/data/removeFcmToken
Body: { uid: string, fcmToken: string }

// Get all tokens for a user
GET /mobile/data/getFcmTokens?uid={userId}
```

### 2. Model Methods

```typescript
import { UserDataModel } from '@/models/mobile/UserDataModel';

// Add token (uses arrayUnion - no duplicates)
await UserDataModel.updateFcmToken(userId, fcmToken);

// Remove token (uses arrayRemove)
await UserDataModel.removeFcmToken(userId, fcmToken);

// Get all tokens
const tokens = await UserDataModel.getFcmTokens(userId);
```

### 3. Multi-Device Notifications

```typescript
import { IndividualNotificationService } from '@/services/status/individualNotification';

// Send to all user devices
await IndividualNotificationService.sendStatusResolvedNotification(userId, versionId, 'Status has been resolved');

// Send announcement to all devices
await IndividualNotificationService.sendAnnouncementNotification(
  userId,
  'Alert',
  'Typhoon warning issued',
  announcementId
);
```

The notification service automatically:

- Sends to all registered device tokens
- Tracks failed deliveries
- Removes invalid tokens from Firestore
- Logs success/failure counts

## Workflow

### User Login Flow

1. User authenticates with Firebase Auth
2. App requests notification permission
3. Device FCM token is retrieved
4. Token is sent to backend
5. Backend adds token to user's `fcmTokens` array (arrayUnion prevents duplicates)
6. Token refresh listener is activated

### Token Refresh Flow

1. FCM automatically refreshes token periodically or when:
   - App is reinstalled
   - User clears app data
   - App is restored from backup
2. `onTokenRefresh` callback fires
3. New token is sent to backend
4. Backend adds new token (old token remains until invalid)
5. Local state is updated

### Logout Flow

1. User initiates logout
2. Current device token is retrieved
3. Token is removed from backend (arrayRemove)
4. Firebase Auth signs out
5. Local auth state is cleared
6. Token refresh listener is unsubscribed

### Notification Delivery Flow

1. Admin triggers notification (status resolved, announcement, etc.)
2. Backend retrieves user's `fcmTokens` array
3. Notification is sent to each token
4. Invalid tokens are tracked
5. Invalid tokens are removed from Firestore array
6. Success count is logged

## Error Handling

### Invalid Token Cleanup

- Automatic removal of expired/invalid tokens
- Error code `messaging/registration-token-not-registered` triggers cleanup
- Uses `arrayRemove` to safely delete specific tokens
- Does not affect other valid tokens

### Graceful Degradation

- Notification failure does not break app flow
- Token registration failure is logged but not fatal
- Logout succeeds even if token removal fails

## Configuration

### Environment Variables

```env
EXPO_PUBLIC_BACKEND_URL=https://your-backend.com
```

### Firebase Setup

Ensure Firebase Cloud Messaging is enabled in:

- Firebase Console → Project Settings → Cloud Messaging
- Android: `google-services.json` in `android/app/`
- iOS: `GoogleService-Info.plist` in `ios/`

### Permissions

```typescript
// Already handled by FCMTokenService
const authStatus = await messaging().requestPermission();
```

## Testing

### Test Token Registration

```typescript
// Check if token is registered
const tokens = await UserDataModel.getFcmTokens(userId);
console.log('User tokens:', tokens);
```

### Test Multi-Device

1. Login on Device A → check Firestore → should see 1 token
2. Login on Device B → check Firestore → should see 2 tokens
3. Send notification → both devices should receive it
4. Logout Device A → check Firestore → should see 1 token (Device B only)

### Test Token Cleanup

1. Manually invalidate a token in Firestore (add fake token)
2. Send notification
3. Check logs → should see cleanup message
4. Check Firestore → fake token should be removed

## Best Practices

✅ **DO:**

- Let the system handle token lifecycle automatically
- Use `useLogout` hook for logout (includes token cleanup)
- Check notification permissions before showing UI
- Log token operations for debugging

❌ **DON'T:**

- Manually manage `fcmTokens` array in Firestore
- Store tokens in local state permanently
- Skip token cleanup on logout
- Send notifications without checking for tokens

## Troubleshooting

### Notifications not received

1. Check notification permissions: `FCMTokenService.checkNotificationPermission()`
2. Verify tokens in Firestore: `UserDataModel.getFcmTokens(userId)`
3. Check backend logs for failed deliveries
4. Confirm FCM is enabled in Firebase Console

### Token not updating

1. Check `onTokenRefresh` listener is active
2. Verify backend endpoint is reachable
3. Check authentication token is valid
4. Review console logs for errors

### Duplicate notifications

1. Check if multiple devices are registered (expected behavior)
2. Verify token deduplication is working (arrayUnion)
3. Check if old tokens are being cleaned up

## Migration Guide

### From Old System (fcmToken: string)

```typescript
// Old structure
users/{userId}/fcmToken: "single-token-string"

// New structure
users/{userId}/fcmTokens: ["token1", "token2", ...]
```

**Migration steps:**

1. Backup existing `fcmToken` values
2. Copy `fcmToken` to `fcmTokens` array for each user
3. Update frontend to use new service
4. Deploy backend changes
5. Test multi-device scenarios
6. Remove old `fcmToken` field (optional)

## Summary

This FCM token management system provides:

- ✅ Multi-device support
- ✅ Automatic token refresh handling
- ✅ Clean logout with token removal
- ✅ Multi-device notification delivery
- ✅ Automatic invalid token cleanup
- ✅ Graceful error handling
- ✅ Complete TypeScript types
- ✅ Comprehensive logging

**Zero configuration required** - just login/logout and it works! 🚀
