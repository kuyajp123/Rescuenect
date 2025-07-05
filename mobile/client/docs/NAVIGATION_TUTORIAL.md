# React Native Expo Router Navigation - Complete Tutorial

This guide provides a comprehensive overview of how navigation works in your React Native app using Expo Router, with practical examples and code snippets.

## 🏗️ Current App Structure

Your app uses a file-based routing system where the folder structure determines navigation:

```
app/
├── _layout.tsx                    # Root layout (Stack navigator)
├── +not-found.tsx                 # 404 error page
├── (tabs)/                        # Tab group (main app navigation)
│   ├── _layout.tsx                # Tab navigator layout
│   ├── home.tsx                   # Home tab
│   ├── community.tsx              # Community tab (button demos)
│   ├── details.tsx                # Details tab
│   ├── menu.tsx                   # Menu tab (navigation examples)
│   └── profile.tsx                # Profile tab
├── settings/                      # Settings stack (nested navigation)
│   ├── _layout.tsx                # Settings stack layout
│   ├── index.tsx                  # Main settings (/settings/)
│   ├── notifications.tsx          # Notifications settings
│   └── privacy.tsx                # Privacy settings
├── user/
│   └── [id].tsx                   # Dynamic route (/user/123)
└── modal-example.tsx              # Modal demonstration
```

## 🧭 Navigation Concepts

### 1. File-Based Routing

- **Files = Routes**: Each `.tsx` file in `app/` becomes a screen
- **Folders = Route Groups**: Organize related screens
- **Special Files**:
  - `_layout.tsx`: Defines navigation structure
  - `index.tsx`: Default route for a folder
  - `[param].tsx`: Dynamic routes with parameters
  - `(folder)`: Route groups (parentheses don't appear in URL)

### 2. Navigation Types

#### Tab Navigation (`(tabs)/`)

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={
        {
          /* tab options */
        }
      }
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="community" options={{ title: "Community" }} />
      <Tabs.Screen name="menu" options={{ title: "Menu" }} />
    </Tabs>
  );
}
```

#### Stack Navigation (`settings/`)

```tsx
// app/settings/_layout.tsx
import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen name="privacy" options={{ title: "Privacy" }} />
    </Stack>
  );
}
```

#### Dynamic Routes (`user/[id].tsx`)

```tsx
// app/user/[id].tsx
import { useLocalSearchParams } from "expo-router";

export default function UserProfile() {
  const { id } = useLocalSearchParams();
  return <Text>User ID: {id}</Text>;
}
```

## 🚀 Navigation Methods

### 1. Programmatic Navigation (`router`)

```tsx
import { router } from "expo-router";

// Navigate forward
router.push("/settings");
router.push("/user/123");

// Replace current screen
router.replace("/login");

// Go back
router.back();

// Check if can go back
if (router.canGoBack()) {
  router.back();
}

// Navigate with parameters
router.push({
  pathname: "/user/[id]",
  params: { id: "123" },
});
```

### 2. Declarative Navigation (`Link`)

```tsx
import { Link } from 'expo-router';

// Basic link
<Link href="/settings">Go to Settings</Link>

// Dynamic route
<Link href="/user/123">View User</Link>

// Link as custom component
<Link href="/profile" asChild>
  <Pressable style={styles.button}>
    <Text>Profile</Text>
  </Pressable>
</Link>
```

### 3. Hook-based Navigation (`useRouter`)

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

## 📱 Practical Examples in Your App

### 1. Tab Navigation Example

**Location**: `app/(tabs)/menu.tsx`

The menu screen demonstrates navigation to different parts of the app:

```tsx
// Navigate to profile tab
router.push("/(tabs)/profile");

// Navigate to settings stack
router.push("/settings/");

// Navigate to specific settings page
router.push("/settings/notifications");
```

### 2. Dynamic Route Example

**Location**: `app/user/[id].tsx`

This shows how to create screens that accept parameters:

```tsx
// Navigation
router.push("/user/123"); // Shows John Doe
router.push("/user/456"); // Shows Jane Smith

// In the component
const { id } = useLocalSearchParams();
const user = userData[id]; // Get user based on ID
```

### 3. Modal Example

**Location**: `app/modal-example.tsx`

Demonstrates different modal patterns:

```tsx
// React Native Modal (component-based)
<Modal visible={showModal} animationType="slide">
  <View>Modal content</View>
</Modal>

// Navigation Modal (route-based)
// In _layout.tsx:
<Stack.Screen
  name="modal"
  options={{ presentation: 'modal' }}
/>
```

### 4. Nested Navigation Example

**Location**: `app/settings/`

Shows how to create nested navigation stacks:

```tsx
// Settings has its own stack navigator
settings/
├── _layout.tsx      # Stack navigator
├── index.tsx        # /settings/ (main page)
├── notifications.tsx # /settings/notifications
└── privacy.tsx      # /settings/privacy
```

## 🎯 Navigation Patterns Demonstrated

### 1. Tab to Stack Navigation

```tsx
// From tab (menu.tsx) to stack (settings)
router.push("/settings/");
```

### 2. Stack within Stack

```tsx
// From settings main page to sub-page
router.push("/settings/privacy");
```

### 3. Cross-Tab Navigation

```tsx
// From any tab to another tab
router.push("/(tabs)/profile");
```

### 4. Back Navigation

```tsx
// Go back in stack
router.back();

// Check if back is possible
if (router.canGoBack()) {
  router.back();
} else {
  // Handle case where back isn't possible
}
```

## 🔧 Advanced Features

### 1. Screen Options

```tsx
<Stack.Screen
  name="example"
  options={{
    title: "Custom Title",
    headerStyle: { backgroundColor: "#blue" },
    headerTintColor: "white",
    presentation: "modal",
    animation: "slide_from_right",
  }}
/>
```

### 2. Header Customization

```tsx
<Stack.Screen
  name="profile"
  options={{
    headerTitle: "My Profile",
    headerRight: () => <Button title="Edit" onPress={handleEdit} />,
    headerLeft: () => <Button title="Back" onPress={() => router.back()} />,
  }}
/>
```

### 3. Route Parameters

```tsx
// Pass parameters
router.push({
  pathname: "/user/[id]",
  params: {
    id: "123",
    tab: "profile",
    highlight: "true",
  },
});

// Receive parameters
const { id, tab, highlight } = useLocalSearchParams();
```

## 🎨 UI Navigation Examples

### 1. Navigation Cards (Menu Screen)

The menu screen shows how to create attractive navigation elements:

```tsx
const navigationItems = [
  {
    title: "Profile",
    subtitle: "View and edit your profile",
    icon: User,
    action: () => router.push("/(tabs)/profile"),
  },
  // ... more items
];
```

### 2. Quick Action Buttons

```tsx
<Pressable onPress={() => router.push("/user/456")}>
  <Text>User Profile</Text>
  <Text>Dynamic Route</Text>
</Pressable>
```

### 3. Back Navigation with Validation

```tsx
<Pressable
  onPress={() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      Alert.alert("Cannot go back");
    }
  }}
>
  <Text>Go Back (if possible)</Text>
</Pressable>
```

## 🛠️ How to Add New Navigation

### 1. Adding a New Tab

1. Create file: `app/(tabs)/new-tab.tsx`
2. Add to tab layout: `app/(tabs)/_layout.tsx`

```tsx
<Tabs.Screen
  name="new-tab"
  options={{
    title: "New Tab",
    tabBarIcon: ({ color }) => <Icon color={color} size={24} />,
  }}
/>
```

### 2. Adding a New Stack

1. Create folder: `app/new-stack/`
2. Add layout: `app/new-stack/_layout.tsx`
3. Add screens: `app/new-stack/index.tsx`, etc.
4. Navigate: `router.push('/new-stack/')`

### 3. Adding Dynamic Routes

1. Create file: `app/category/[slug].tsx`
2. Navigate: `router.push('/category/electronics')`
3. Access param: `const { slug } = useLocalSearchParams();`

## 📚 Key Takeaways

1. **File Structure = Navigation Structure**: Your app's navigation is defined by how you organize files in the `app/` folder.

2. **Multiple Navigation Types**: You can combine tabs, stacks, modals, and dynamic routes in the same app.

3. **Type Safety**: Use TypeScript with Expo Router for better development experience.

4. **Performance**: Expo Router automatically handles code splitting and lazy loading.

5. **Deep Linking**: Your navigation structure automatically supports deep linking.

## 🔗 Navigation Flow in Your App

```
Root Layout (Stack)
├── (tabs) - Main app navigation
│   ├── home - Welcome screen
│   ├── community - Button demos & color system
│   ├── details - Detail information
│   ├── profile - User profile
│   └── menu - Navigation examples & app settings
├── settings/ - Nested stack for settings
│   ├── index - Main settings page
│   ├── notifications - Notification preferences
│   └── privacy - Privacy settings
├── user/[id] - Dynamic user profiles
└── modal-example - Modal demonstration
```

This structure provides a solid foundation for any React Native app with complex navigation requirements!

## 🎯 Try It Out!

1. **Open the Menu tab** to see navigation examples
2. **Tap navigation items** to see different navigation patterns
3. **Check the dynamic route** by tapping "User Profile" buttons
4. **Explore the modal example** to see different modal types
5. **Navigate through settings** to see nested stack navigation

The app demonstrates real-world navigation patterns you'll use in production apps!
