# Zustand State Management Guide

> **A comprehensive guide to Zustand state management patterns, performance optimization, and TypeScript best practices**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Zustand](https://img.shields.io/badge/Zustand-FF6B6B?style=flat&logoColor=white)](https://github.com/pmndrs/zustand)

## Overview

This documentation provides a complete guide to effectively using Zustand for state management in TypeScript React applications. It covers three primary access patterns, performance considerations, and real-world implementation examples.

### Key Features Covered

- 🎯 **Three Core Access Patterns** - Selector hooks, direct access, and full state patterns
- ⚡ **Performance Optimization** - Render minimization and memory efficiency
- 🔒 **TypeScript Integration** - Full type safety and intellisense support
- 🛠️ **Best Practices** - Production-ready patterns and anti-patterns
- 📚 **Real-world Examples** - Forms, APIs, and complex state scenarios

## Table of Contents

- [Quick Start](#quick-start)
- [Store Setup](#store-setup)
- [Access Patterns](#access-patterns)
  - [Pattern 1: Selector Hook Usage](#pattern-1-selector-hook-usage)
  - [Pattern 2: getState() Direct Access](#pattern-2-getstate-direct-access)
  - [Pattern 3: Full State Hook Usage](#pattern-3-full-state-hook-usage)
- [Performance Analysis](#performance-analysis)
- [Best Practices](#best-practices)
- [Common Use Cases](#common-use-cases)
- [Advanced Techniques](#advanced-techniques)
- [Migration Guide](#migration-guide)

## Quick Start

```bash
npm install zustand
# or
yarn add zustand
```

```typescript
import { create } from "zustand";

// 1. Define your store
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// 2. Use in components
const Counter = () => {
  const count = useStore((state) => state.count);
  const increment = useStore((state) => state.increment);

  return <button onClick={increment}>Count: {count}</button>;
};
```

## Store Setup

### Basic TypeScript Store

```typescript
import { create } from "zustand";

interface BackendState {
  data: any[];
  loading: boolean;
  error: string | null;
  setBackendResponse: (data: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearData: () => void;
}

const useBackendResponse = create<BackendState>((set, get) => ({
  data: [],
  loading: false,
  error: null,

  // Actions
  setBackendResponse: (data) => set({ data }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearData: () => set({ data: [], error: null }),
}));

export default useBackendResponse;
```

### Advanced Store with Computed Values

```typescript
interface EnhancedState extends BackendState {
  // Computed getters
  itemCount: () => number;
  hasError: () => boolean;
  isEmpty: () => boolean;

  // Complex actions
  addItem: (item: any) => void;
  removeItem: (id: string) => void;
  toggleLoading: () => void;
}

const useEnhancedStore = create<EnhancedState>((set, get) => ({
  data: [],
  loading: false,
  error: null,

  // Computed values
  itemCount: () => get().data.length,
  hasError: () => get().error !== null,
  isEmpty: () => get().data.length === 0,

  // Actions
  setBackendResponse: (data) => set({ data }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearData: () => set({ data: [], error: null }),

  // Enhanced actions
  addItem: (item) =>
    set((state) => ({
      data: [...state.data, { ...item, id: Date.now() }],
    })),
  removeItem: (id) =>
    set((state) => ({
      data: state.data.filter((item) => item.id !== id),
    })),
  toggleLoading: () => set((state) => ({ loading: !state.loading })),
}));
```

## Access Patterns

### Pattern 1: Selector Hook Usage

> **Best for**: React components that need to subscribe to specific state changes

#### Basic Selector Usage

```typescript
import React from "react";
import useBackendResponse from "./store";

// ✅ Single property selector
const DataDisplay: React.FC = () => {
  const data = useBackendResponse((state) => state.data);

  return <div>Items: {data.length}</div>;
};

// ✅ Action selector
const ControlPanel: React.FC = () => {
  const setBackendResponse = useBackendResponse(
    (state) => state.setBackendResponse
  );
  const clearData = useBackendResponse((state) => state.clearData);

  return (
    <div>
      <button onClick={() => setBackendResponse([])}>Reset Data</button>
      <button onClick={clearData}>Clear All</button>
    </div>
  );
};
```

#### Multiple Property Selection

```typescript
import { shallow } from "zustand/shallow";

// ✅ Optimized multiple selection
const StatusPanel: React.FC = () => {
  const { data, loading, error } = useBackendResponse(
    (state) => ({
      data: state.data,
      loading: state.loading,
      error: state.error,
    }),
    shallow // Prevents unnecessary re-renders
  );

  if (error) return <div className="error">Error: {error}</div>;
  if (loading) return <div className="loading">Loading...</div>;

  return <div className="success">Loaded {data.length} items</div>;
};
```

#### Computed Selectors

```typescript
// ✅ Derived state computation
const StatisticsPanel: React.FC = () => {
  const itemCount = useBackendResponse((state) => state.data.length);
  const hasError = useBackendResponse((state) => state.error !== null);
  const isActive = useBackendResponse(
    (state) => !state.loading && state.data.length > 0
  );

  return (
    <div className="stats">
      <div>Total Items: {itemCount}</div>
      <div>
        Status: {hasError ? "❌ Error" : isActive ? "✅ Active" : "⏳ Inactive"}
      </div>
    </div>
  );
};
```

#### Characteristics

| Aspect           | Details                                                  |
| ---------------- | -------------------------------------------------------- |
| **Usage**        | React components only                                    |
| **Performance**  | ⚡ Optimal - only re-renders when selected state changes |
| **TypeScript**   | 🔒 Full type safety with intellisense                    |
| **Subscription** | ✅ Automatic subscription to selected state slice        |
| **Limitation**   | ❌ Cannot be used outside React components               |

### Pattern 2: getState() Direct Access

> **Best for**: Utilities, side effects, async operations, and non-React contexts

#### Basic Direct Access

```typescript
// ✅ Utility functions
export const dataUtils = {
  getCurrentData: (): any[] => {
    return useBackendResponse.getState().data;
  },

  isDataLoaded: (): boolean => {
    const { data, loading } = useBackendResponse.getState();
    return !loading && data.length > 0;
  },

  clearErrors: (): void => {
    const { setError } = useBackendResponse.getState();
    setError(null);
  },
};

// ✅ Event handlers
export const handleGlobalError = (errorMessage: string): void => {
  const { setError, setLoading } = useBackendResponse.getState();
  setError(errorMessage);
  setLoading(false);
};
```

#### API Service Integration

```typescript
class ApiService {
  static async fetchData(): Promise<void> {
    const { setLoading, setBackendResponse, setError } =
      useBackendResponse.getState();

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/data");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setBackendResponse(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  static async updateItem(id: string, updates: Partial<any>): Promise<void> {
    const { data, setBackendResponse } = useBackendResponse.getState();

    // Optimistic update
    const updatedData = data.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    setBackendResponse(updatedData);

    try {
      await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      // Revert on failure
      setBackendResponse(data);
      throw error;
    }
  }
}
```

#### Async Operations

```typescript
// ✅ Background tasks
async function batchProcessData(items: any[]): Promise<void> {
  const { setLoading, data, setBackendResponse } =
    useBackendResponse.getState();

  setLoading(true);

  try {
    for (const item of items) {
      await processItem(item);

      // Get fresh state for each iteration
      const currentState = useBackendResponse.getState();
      setBackendResponse([...currentState.data, item]);
    }
  } finally {
    setLoading(false);
  }
}

// ✅ Conditional operations
function conditionalUpdate(condition: boolean, newData: any[]): boolean {
  if (!condition) return false;

  const { data, setBackendResponse } = useBackendResponse.getState();

  if (newData.length > data.length) {
    setBackendResponse(newData);
    return true;
  }

  return false;
}
```

#### Characteristics

| Aspect           | Details                                                  |
| ---------------- | -------------------------------------------------------- |
| **Usage**        | 🌐 Anywhere (React, utilities, classes, async functions) |
| **Performance**  | ⚡ No re-renders - gets snapshot of current state        |
| **TypeScript**   | 🔒 Full type safety                                      |
| **Subscription** | ❌ No automatic updates - manual state access only       |
| **Flexibility**  | ✅ Perfect for side effects and non-reactive operations  |

### Pattern 3: Full State Hook Usage

> **Best for**: Legacy code and components that truly need most state properties

#### Full State Access (Not Recommended)

```typescript
// ❌ Poor performance - re-renders on ANY state change
const FullStateComponent: React.FC = () => {
  const store = useBackendResponse(); // Gets entire state
  const { data, loading, error, setBackendResponse, setLoading } = store;

  // This component re-renders whenever ANY part of the state changes
  console.log("Component re-rendered");

  return (
    <div>
      <div>Data: {data.length} items</div>
      <div>Loading: {loading ? "Yes" : "No"}</div>
      <div>Error: {error || "None"}</div>
      <button onClick={() => setBackendResponse([])}>Clear</button>
    </div>
  );
};
```

#### When Full State is Acceptable

```typescript
// ✅ Acceptable when you need most state properties
const AdminDashboard: React.FC = () => {
  const {
    data,
    loading,
    error,
    setBackendResponse,
    setLoading,
    setError,
    clearData,
  } = useBackendResponse();

  // Using most of the state, so full subscription is justified
  return (
    <div className="admin-dashboard">
      <div className="status-bar">
        <span>Status: {loading ? "Loading" : "Idle"}</span>
        <span>Items: {data.length}</span>
        {error && <span className="error">Error: {error}</span>}
      </div>

      <div className="controls">
        <button onClick={() => setLoading(!loading)}>Toggle Loading</button>
        <button
          onClick={() => setBackendResponse([...data, { id: Date.now() }])}
        >
          Add Item
        </button>
        <button onClick={() => setError("Test error")}>Set Error</button>
        <button onClick={clearData}>Clear All</button>
      </div>
    </div>
  );
};
```

#### Characteristics

| Aspect           | Details                                        |
| ---------------- | ---------------------------------------------- |
| **Usage**        | React components only                          |
| **Performance**  | ❌ Poor - re-renders on ANY state change       |
| **TypeScript**   | 🔒 Full type safety                            |
| **Subscription** | ⚠️ Automatic subscription to ALL state changes |
| **Use Case**     | Only when you need most/all state properties   |

## Performance Analysis

### Re-render Comparison

```typescript
// Performance test component
const PerformanceDemo: React.FC = () => {
  const renderCount = useRef(0);
  renderCount.current++;

  // Pattern 1: Selective subscription (optimal)
  const data = useBackendResponse((state) => state.data);

  // Pattern 2: No subscription (no re-renders)
  const handleDirectAccess = () => {
    const { loading } = useBackendResponse.getState();
    console.log("Current loading state:", loading);
  };

  // Pattern 3: Full subscription (re-renders on any change)
  // const fullState = useBackendResponse(); // Commented out for performance

  return (
    <div>
      <div>Render count: {renderCount.current}</div>
      <div>Data items: {data.length}</div>
      <button onClick={handleDirectAccess}>Check Loading State</button>
    </div>
  );
};
```

### Performance Metrics Table

| Pattern           | Re-renders | Memory Usage | Bundle Size | Use Case         |
| ----------------- | ---------- | ------------ | ----------- | ---------------- |
| **Selector Hook** | ⚡ Minimal | 🟢 Low       | 🟢 Small    | React components |
| **getState()**    | ⚡ None    | 🟢 Very Low  | 🟢 Small    | Utilities, APIs  |
| **Full State**    | 🔴 Maximum | 🔴 High      | 🟡 Medium   | Legacy only      |

### Optimization Techniques

```typescript
// ✅ Use shallow comparison for multiple properties
import { shallow } from "zustand/shallow";

const OptimizedMultiSelect: React.FC = () => {
  const { data, loading } = useBackendResponse(
    (state) => ({ data: state.data, loading: state.loading }),
    shallow
  );

  return <div>{loading ? "Loading..." : `${data.length} items`}</div>;
};

// ✅ Memoize expensive computations
const ExpensiveComputation: React.FC = () => {
  const data = useBackendResponse((state) => state.data);

  const expensiveValue = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  return <div>Total value: {expensiveValue}</div>;
};

// ✅ Split components by concern
const DataComponent: React.FC = () => {
  const data = useBackendResponse((state) => state.data);
  return <div>Data: {data.length} items</div>;
};

const LoadingComponent: React.FC = () => {
  const loading = useBackendResponse((state) => state.loading);
  return loading ? <div>Loading...</div> : null;
};
```

## Best Practices

### 1. Pattern Selection Guide

```typescript
// ✅ Use selector hooks in React components
const ReactComponent: React.FC = () => {
  const data = useBackendResponse((state) => state.data);
  const setData = useBackendResponse((state) => state.setBackendResponse);

  return <div onClick={() => setData([])}>{data.length} items</div>;
};

// ✅ Use getState() in utilities and services
const utilityFunction = () => {
  const { data, setBackendResponse } = useBackendResponse.getState();
  setBackendResponse(data.filter((item) => item.active));
};

// ❌ Avoid full state unless necessary
const BadComponent: React.FC = () => {
  const state = useBackendResponse(); // Re-renders on any change
  return <div>{state.data.length}</div>;
};
```

### 2. Store Organization

```typescript
// ✅ Group related state and actions
interface UserState {
  // Data
  user: User | null;
  preferences: UserPreferences;

  // Status
  loading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  clearError: () => void;
}

// ✅ Use descriptive action names
const useUserStore = create<UserState>((set) => ({
  user: null,
  preferences: {},
  loading: false,
  error: null,

  setUser: (user) => set({ user }),
  updatePreferences: (prefs) =>
    set((state) => ({
      preferences: { ...state.preferences, ...prefs },
    })),
  clearError: () => set({ error: null }),
}));
```

### 3. Error Handling

```typescript
// ✅ Centralized error handling
const useErrorHandler = () => {
  const setError = useBackendResponse((state) => state.setError);

  return useCallback(
    (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";

      setError(message);
      console.error("Application error:", error);
    },
    [setError]
  );
};

// ✅ Async action with proper error handling
const useFetchData = () => {
  const { setLoading, setBackendResponse } = useBackendResponse.getState();
  const handleError = useErrorHandler();

  return useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.fetchData();
      setBackendResponse(data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [handleError]);
};
```

### 4. TypeScript Best Practices

```typescript
// ✅ Strong typing for actions
interface StrictUserState {
  users: User[];
  addUser: (user: Omit<User, "id">) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

// ✅ Generic store factory
function createApiStore<T>() {
  return create<{
    data: T[];
    loading: boolean;
    error: string | null;
    setData: (data: T[]) => void;
    addItem: (item: T) => void;
    updateItem: (id: string, updates: Partial<T>) => void;
  }>((set) => ({
    data: [],
    loading: false,
    error: null,
    setData: (data) => set({ data }),
    addItem: (item) => set((state) => ({ data: [...state.data, item] })),
    updateItem: (id, updates) =>
      set((state) => ({
        data: state.data.map((item) =>
          (item as any).id === id ? { ...item, ...updates } : item
        ),
      })),
  }));
}

// Usage
const useProductStore = createApiStore<Product>();
const useOrderStore = createApiStore<Order>();
```

## Common Use Cases

### 1. Form State Management

```typescript
interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  setValue: (field: string, value: any) => void;
  setError: (field: string, error: string) => void;
  setTouched: (field: string) => void;
  reset: () => void;
  submit: () => Promise<void>;
}

const useFormStore = create<FormState>((set, get) => ({
  values: {},
  errors: {},
  touched: {},
  isSubmitting: false,

  setValue: (field, value) =>
    set((state) => ({
      values: { ...state.values, [field]: value },
      errors: { ...state.errors, [field]: "" }, // Clear error on change
    })),

  setError: (field, error) =>
    set((state) => ({
      errors: { ...state.errors, [field]: error },
    })),

  setTouched: (field) =>
    set((state) => ({
      touched: { ...state.touched, [field]: true },
    })),

  reset: () =>
    set({
      values: {},
      errors: {},
      touched: {},
      isSubmitting: false,
    }),

  submit: async () => {
    const { values } = get();
    set({ isSubmitting: true });

    try {
      await submitForm(values);
      get().reset();
    } catch (error) {
      // Handle submission error
    } finally {
      set({ isSubmitting: false });
    }
  },
}));

// Usage in component
const ContactForm: React.FC = () => {
  const values = useFormStore((state) => state.values);
  const setValue = useFormStore((state) => state.setValue);
  const submit = useFormStore((state) => state.submit);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input
        value={values.email || ""}
        onChange={(e) => setValue("email", e.target.value)}
        placeholder="Email"
      />
      <button type="submit">Submit</button>
    </form>
  );
};
```

### 2. Real-time Data Synchronization

```typescript
interface RealtimeState {
  data: any[];
  connected: boolean;
  lastUpdate: Date | null;
  connect: () => void;
  disconnect: () => void;
  updateData: (data: any[]) => void;
}

const useRealtimeStore = create<RealtimeState>((set, get) => ({
  data: [],
  connected: false,
  lastUpdate: null,

  connect: () => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => set({ connected: true });
    ws.onclose = () => set({ connected: false });

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      get().updateData(data);
    };
  },

  disconnect: () => {
    set({ connected: false });
  },

  updateData: (data) =>
    set({
      data,
      lastUpdate: new Date(),
    }),
}));

// Auto-connect hook
const useAutoConnect = () => {
  const connect = useRealtimeStore((state) => state.connect);

  useEffect(() => {
    connect();
  }, [connect]);
};
```

### 3. Authentication Flow

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem("token"),
  loading: false,

  login: async (credentials) => {
    set({ loading: true });

    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data;

      localStorage.setItem("token", token);
      set({ user, token, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },

  refreshToken: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await authAPI.refresh(token);
      const newToken = response.data.token;

      localStorage.setItem("token", newToken);
      set({ token: newToken });
    } catch (error) {
      get().logout();
      throw error;
    }
  },
}));

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  if (!user || !token) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};
```

## Advanced Techniques

### 1. Middleware Integration

```typescript
import { subscribeWithSelector } from "zustand/middleware";

// Logging middleware
const useStoreWithLogging = create(
  subscribeWithSelector<BackendState>((set) => ({
    data: [],
    loading: false,
    error: null,

    setBackendResponse: (data) => {
      console.log("Setting backend response:", data.length, "items");
      set({ data });
    },

    setLoading: (loading) => {
      console.log("Loading state changed:", loading);
      set({ loading });
    },

    setError: (error) => {
      console.log("Error state changed:", error);
      set({ error });
    },

    clearData: () => {
      console.log("Clearing all data");
      set({ data: [], error: null });
    },
  }))
);

// Subscribe to specific changes
useStoreWithLogging.subscribe(
  (state) => state.data,
  (data) => {
    console.log("Data changed, new length:", data.length);
  }
);
```

### 2. Persistence

```typescript
import { persist } from "zustand/middleware";

const usePersistentStore = create(
  persist<UserPreferences>(
    (set) => ({
      theme: "light",
      language: "en",
      notifications: true,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleNotifications: () =>
        set((state) => ({
          notifications: !state.notifications,
        })),
    }),
    {
      name: "user-preferences", // Storage key
      getStorage: () => localStorage, // Choose storage
    }
  )
);
```

### 3. Store Composition

```typescript
// Combine multiple stores
const useAppStore = () => {
  const auth = useAuthStore();
  const backend = useBackendResponse();
  const preferences = usePersistentStore();

  return {
    auth,
    backend,
    preferences,

    // Computed values across stores
    isReady: auth.user && !backend.loading,
    hasData: backend.data.length > 0,
  };
};

// Usage
const AppStatus: React.FC = () => {
  const { isReady, hasData, auth, backend } = useAppStore();

  return (
    <div>
      <div>User: {auth.user?.name || "Not logged in"}</div>
      <div>Status: {isReady ? (hasData ? "Ready" : "No data") : "Loading"}</div>
      <div>Items: {backend.data.length}</div>
    </div>
  );
};
```

## Migration Guide

### From Redux to Zustand

```typescript
// Before (Redux)
const initialState = { count: 0 };

const counterReducer = (state = initialState, action) => {
  switch (action.type) {
    case "INCREMENT":
      return { count: state.count + 1 };
    case "DECREMENT":
      return { count: state.count - 1 };
    default:
      return state;
  }
};

// After (Zustand)
const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
```

### From Context API to Zustand

```typescript
// Before (Context API)
const DataContext = createContext();

const DataProvider = ({ children }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <DataContext.Provider value={{ data, setData, loading, setLoading }}>
      {children}
    </DataContext.Provider>
  );
};

// After (Zustand)
const useDataStore = create((set) => ({
  data: [],
  loading: false,
  setData: (data) => set({ data }),
  setLoading: (loading) => set({ loading }),
}));

// No provider needed!
```

## Conclusion

### Pattern Selection Summary

| Use Case             | Recommended Pattern | Why                                          |
| -------------------- | ------------------- | -------------------------------------------- |
| **React Components** | Selector Hook       | Optimal performance, automatic subscriptions |
| **Utilities & APIs** | getState()          | No re-renders, works anywhere                |
| **Legacy Code**      | Full State          | Only when refactoring is not feasible        |
| **Forms**            | Selector Hook       | Granular updates, performance optimization   |
| **Global Actions**   | getState()          | Side effects, background operations          |

### Key Takeaways

1. **Prefer Selector Hooks** for React components that need state subscriptions
2. **Use getState()** for utilities, APIs, and non-reactive operations
3. **Avoid Full State** pattern unless you truly need most state properties
4. **Leverage TypeScript** for better developer experience and runtime safety
5. **Optimize with shallow comparison** when selecting multiple properties
6. **Organize stores logically** by domain or feature area

### Resources

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [React Performance Guide](https://react.dev/learn/render-and-commit)

---

_Created with ❤️ for better React state management_
