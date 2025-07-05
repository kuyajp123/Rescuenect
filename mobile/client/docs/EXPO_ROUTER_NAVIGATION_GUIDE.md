# Complete Expo Router Navigation Guide

This guide covers everything you need to know about navigation in Expo Router, from basic concepts to advanced patterns.

## Table of Contents

1. [Basic Concepts](#basic-concepts)
2. [File-Based Routing](#file-based-routing)
3. [Navigation Methods](#navigation-methods)
4. [Tab Navigation](#tab-navigation)
5. [Stack Navigation](#stack-navigation)
6. [Nested Navigation](#nested-navigation)
7. [Dynamic Routes](#dynamic-routes)
8. [Modal Navigation](#modal-navigation)
9. [Deep Linking](#deep-linking)
10. [Best Practices](#best-practices)

## Basic Concepts

Expo Router uses file-based routing similar to Next.js. The file structure in your `app/` directory determines your navigation structure.

### Key Principles:

- **Files = Routes**: Each file in `app/` becomes a route
- **Folders = Route Groups**: Folders organize routes
- **Special Files**: `_layout.tsx`, `+not-found.tsx`, etc. have special meanings
- **Automatic Navigation**: Navigation stack is generated automatically

## File-Based Routing

### Basic Routes

```
app/
  index.tsx        → / (home screen)
  about.tsx        → /about
  profile.tsx      → /profile
```

### Folder Structure

```
app/
  (tabs)/          → Tab group (parentheses = route group, not in URL)
    _layout.tsx    → Tab navigator layout
    home.tsx       → /home (tab 1)
    profile.tsx    → /profile (tab 2)
  settings/        → Stack group
    _layout.tsx    → Stack navigator layout
    index.tsx      → /settings (main settings)
    privacy.tsx    → /settings/privacy
  _layout.tsx      → Root layout
```

### Special Files

- `_layout.tsx`: Defines navigation structure for that level
- `index.tsx`: Default route for a folder (like index.html)
- `+not-found.tsx`: 404 error page
- `[id].tsx`: Dynamic route (e.g., `/user/123`)
- `[...slug].tsx`: Catch-all route

## Navigation Methods

### 1. Using `router` (Programmatic)

```tsx
import { router } from "expo-router";

// Navigate to a route
router.push("/settings");

// Navigate and replace current route
router.replace("/login");

// Go back
router.back();

// Go to specific route in stack
router.navigate("/profile");

// Dismiss modal/overlay
router.dismiss();

// Check if can go back
if (router.canGoBack()) {
  router.back();
}
```

### 2. Using `Link` Component (Declarative)

```tsx
import { Link } from 'expo-router';

// Basic link
<Link href="/settings">Go to Settings</Link>

// Link with parameters
<Link href={`/user/${userId}`}>View User</Link>

// Link as button
<Link href="/profile" asChild>
  <Pressable>
    <Text>Go to Profile</Text>
  </Pressable>
</Link>

// Link with query parameters
<Link href={{
  pathname: '/search',
  params: { q: 'react native' }
}}>
  Search React Native
</Link>
```

### 3. Using `useRouter` Hook

```tsx
import { useRouter } from "expo-router";

function MyComponent() {
  const router = useRouter();

  const handlePress = () => {
    router.push("/settings");
  };

  return <Button onPress={handlePress} title="Settings" />;
}
```

## Tab Navigation

### Basic Tab Layout (`app/(tabs)/_layout.tsx`)

```tsx
import { Tabs } from "expo-router";
import { Home, User, Settings } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
```

### Tab Screen Options

```tsx
<Tabs.Screen
  name="home"
  options={{
    title: "Home",
    tabBarIcon: ({ color, focused }) => (
      <Home color={color} size={focused ? 26 : 24} />
    ),
    tabBarBadge: 3, // Red badge with number
    tabBarButton: (props) => <CustomTabButton {...props} />,
    href: null, // Hide tab from tab bar
  }}
/>
```

## Stack Navigation

### Basic Stack Layout (`app/settings/_layout.tsx`)

```tsx
import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#f4511e",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Settings",
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          title: "Privacy Settings",
          presentation: "modal", // Show as modal
        }}
      />
    </Stack>
  );
}
```

### Stack Screen Options

```tsx
<Stack.Screen
  name="details"
  options={{
    title: "Details",
    headerBackTitle: "Back",
    headerRight: () => <Button title="Save" onPress={handleSave} />,
    presentation: "modal",
    animation: "slide_from_right",
  }}
/>
```

## Nested Navigation

### Complex Navigation Structure

```
app/
  _layout.tsx           → Root layout (Stack)
  (tabs)/               → Tab group
    _layout.tsx         → Tab navigator
    home.tsx            → Home tab
    (profile)/          → Profile tab with nested stack
      _layout.tsx       → Profile stack navigator
      index.tsx         → Profile home
      edit.tsx          → Edit profile
      settings.tsx      → Profile settings
  settings/             → Settings stack (outside tabs)
    _layout.tsx         → Settings stack navigator
    index.tsx           → Settings home
    notifications.tsx   → Notification settings
    privacy.tsx         → Privacy settings
  auth/                 → Auth stack
    _layout.tsx         → Auth stack navigator
    login.tsx           → Login screen
    register.tsx        → Register screen
```

### Root Layout Example

```tsx
// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="settings"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Settings",
        }}
      />
      <Stack.Screen
        name="auth"
        options={{
          presentation: "fullScreenModal",
        }}
      />
    </Stack>
  );
}
```

## Dynamic Routes

### Creating Dynamic Routes

```
app/
  user/
    [id].tsx          → /user/123
    [...slug].tsx     → /user/posts/123/comments
```

### Using Parameters

```tsx
// app/user/[id].tsx
import { useLocalSearchParams } from "expo-router";

export default function UserProfile() {
  const { id } = useLocalSearchParams();

  return (
    <View>
      <Text>User ID: {id}</Text>
    </View>
  );
}
```

### Navigating to Dynamic Routes

```tsx
// Navigate to dynamic route
router.push(`/user/${userId}`);

// With Link component
<Link href={`/user/${userId}`}>View User</Link>;

// With query parameters
router.push({
  pathname: "/user/[id]",
  params: { id: userId, tab: "posts" },
});
```

## Modal Navigation

### Modal Presentations

```tsx
// In _layout.tsx
<Stack.Screen
  name="modal"
  options={{
    presentation: "modal",
    headerTitle: "Modal Title",
    headerLeft: () => <Button title="Cancel" onPress={() => router.back()} />,
  }}
/>
```

### Dismissible Modals

```tsx
// app/modal.tsx
import { router } from "expo-router";

export default function Modal() {
  return (
    <View>
      <Text>This is a modal</Text>
      <Button title="Close" onPress={() => router.dismiss()} />
    </View>
  );
}
```

## Deep Linking

### URL Structure

```
myapp://profile/123      → app/profile/[id].tsx
myapp://settings/privacy → app/settings/privacy.tsx
myapp://                 → app/index.tsx
```

### Handling Deep Links

```tsx
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";

export default function useProtectedRoute(user: User | null) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [user, segments]);
}
```

## Best Practices

### 1. Layout Organization

```tsx
// Good: Clear hierarchy
app/
  _layout.tsx           → Root
  (tabs)/
    _layout.tsx         → Tabs
    home.tsx
    profile.tsx
  settings/
    _layout.tsx         → Settings stack
    index.tsx
    privacy.tsx

// Avoid: Too many nested levels
app/
  (main)/
    (tabs)/
      (home)/
        _layout.tsx
        index.tsx
```

### 2. Navigation Guards

```tsx
// app/_layout.tsx
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Stack } from "expo-router";

export default function RootLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
```

### 3. Type-Safe Navigation

```tsx
// types/navigation.ts
export type RootStackParamList = {
  "(tabs)": undefined;
  settings: undefined;
  "user/[id]": { id: string };
};

// Usage with TypeScript
const router = useRouter<RootStackParamList>();
router.push("/user/[id]", { id: "123" });
```

### 4. Screen Options with Hooks

```tsx
import { useFocusEffect } from "@react-navigation/native";
import { Stack } from "expo-router";

export default function DynamicScreen() {
  const [title, setTitle] = useState("Default Title");

  useFocusEffect(() => {
    // Update title when screen comes into focus
    navigation.setOptions({ title });
  });

  return (
    <>
      <Stack.Screen options={{ title }} />
      <View>...</View>
    </>
  );
}
```

### 5. Navigation Performance

```tsx
// Lazy load screens
const LazyScreen = lazy(() => import("./heavy-screen"));

// Pre-load important screens
router.preload("/important-screen");

// Use InteractionManager for complex navigation
import { InteractionManager } from "react-native";

const handleNavigation = () => {
  InteractionManager.runAfterInteractions(() => {
    router.push("/complex-screen");
  });
};
```

## Common Patterns

### 1. Conditional Tab Rendering

```tsx
// Show different tabs based on user role
<Tabs>
  <Tabs.Screen name="home" />
  <Tabs.Screen name="profile" />
  {user.isAdmin && <Tabs.Screen name="admin" />}
</Tabs>
```

### 2. Navigation with Authentication

```tsx
// Redirect after login
const handleLogin = async () => {
  await signIn();
  router.replace("/(tabs)/home");
};

// Logout navigation
const handleLogout = async () => {
  await signOut();
  router.replace("/auth/login");
};
```

### 3. Back Handler

```tsx
import { useFocusEffect } from "@react-navigation/native";
import { BackHandler } from "react-native";

export default function Screen() {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Custom back behavior
        router.push("/home");
        return true; // Prevent default back
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [])
  );
}
```

This guide covers the essential concepts of Expo Router navigation. The key is understanding that your file structure defines your navigation structure, and Expo Router handles the rest automatically!
