# Backend Integration Strategy - Part 2

## Migration Plan

### Phase 1: Preparation (Week 1)

#### 1.1 Code Analysis and Mapping

```bash
# Create migration analysis script
# Backend/scripts/analyze-migration.ts

import { readFileSync, readdirSync } from 'fs';
import path from 'path';

interface CodeAnalysis {
  mobileControllers: string[];
  sharedLogic: string[];
  conflicts: string[];
  recommendations: string[];
}

export function analyzeMigration(): CodeAnalysis {
  const mobileBackendPath = './mobile/backend/src';
  const mainBackendPath = './src';

  // Analyze controllers, models, services
  // Identify shared logic and potential conflicts
  // Generate migration recommendations

  return {
    mobileControllers: ['AuthController', 'StatusController', 'NotificationController'],
    sharedLogic: ['Firebase config', 'JWT utils', 'Validation schemas'],
    conflicts: ['Different auth implementations', 'Duplicate status models'],
    recommendations: [
      'Merge auth services with platform detection',
      'Unify status models with platform-specific DTOs',
      'Create shared validation schemas'
    ]
  };
}
```

#### 1.2 Backup and Version Control

```bash
# Create feature branch for integration
git checkout -b feature/backend-integration

# Backup current mobile backend
cp -r mobile/backend mobile/backend-backup

# Create migration tracking
echo "# Migration Progress\n- [ ] Phase 1: Preparation\n- [ ] Phase 2: Structure Setup\n- [ ] Phase 3: Code Migration\n- [ ] Phase 4: Testing\n- [ ] Phase 5: Deployment" > MIGRATION_PROGRESS.md
```

### Phase 2: Structure Setup (Week 1-2)

#### 2.1 Directory Restructuring

```typescript
// Backend/scripts/setup-structure.ts
import { mkdirSync, existsSync } from 'fs';

const directories = [
  'src/controllers/admin',
  'src/controllers/mobile',
  'src/controllers/shared',
  'src/routes/admin',
  'src/routes/mobile',
  'src/routes/shared',
  'src/middlewares/auth',
  'src/middlewares/platform',
  'src/middlewares/validation',
  'src/services/auth',
  'src/services/notifications',
  'src/models/entities',
  'src/models/dto',
  'src/models/validation',
  'src/config',
  'src/utils',
  'tests/unit',
  'tests/integration',
  'docs/api',
];

directories.forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});
```

#### 2.2 Configuration Migration

```typescript
// Backend/src/config/migration.ts
export interface MigrationConfig {
  enableMobileRoutes: boolean;
  enableAdminRoutes: boolean;
  enableSharedRoutes: boolean;
  migrationMode: 'development' | 'production';
  fallbackToOldEndpoints: boolean;
}

export const migrationConfig: MigrationConfig = {
  enableMobileRoutes: process.env.ENABLE_MOBILE_ROUTES === 'true',
  enableAdminRoutes: process.env.ENABLE_ADMIN_ROUTES === 'true',
  enableSharedRoutes: true,
  migrationMode: (process.env.MIGRATION_MODE as any) || 'development',
  fallbackToOldEndpoints: process.env.FALLBACK_OLD_ENDPOINTS === 'true',
};
```

### Phase 3: Code Migration (Week 2-3)

#### 3.1 Controller Migration Strategy

```typescript
// Migration mapping for controllers
const controllerMigration = {
  // Mobile backend controllers → Unified backend
  'mobile/backend/src/controllers/AuthController.ts' → 'src/controllers/mobile/AuthController.ts',
  'mobile/backend/src/controllers/StatusController.ts' → 'src/controllers/mobile/StatusController.ts',

  // Existing admin controllers
  'src/controllers/LoginController.ts' → 'src/controllers/admin/AuthController.ts',
  'src/controllers/WeatherController.ts' → 'src/controllers/shared/WeatherController.ts',

  // Create new shared controllers
  'shared/StatusController.ts' → 'src/controllers/shared/StatusController.ts'
};
```

#### 3.2 Service Layer Unification

```typescript
// Backend/src/services/auth/UnifiedAuthService.ts
export class UnifiedAuthService {
  private firebaseAuth = admin.auth();

  // Merged authentication logic from both backends
  async authenticateUser(token: string, platform: Platform): Promise<AuthResult> {
    // Validate Firebase token
    const decodedToken = await this.firebaseAuth.verifyIdToken(token);

    // Platform-specific user resolution
    const user = await this.resolveUserByPlatform(decodedToken, platform);

    // Generate session or update last login
    await this.updateLoginSession(user, platform);

    return {
      user,
      platform,
      permissions: await this.getUserPermissions(user, platform),
    };
  }

  private async resolveUserByPlatform(decodedToken: admin.auth.DecodedIdToken, platform: Platform): Promise<User> {
    if (platform === Platform.ADMIN) {
      return await this.resolveAdminUser(decodedToken);
    } else {
      return await this.resolveMobileUser(decodedToken);
    }
  }

  // Migrate existing admin auth logic
  private async resolveAdminUser(token: admin.auth.DecodedIdToken): Promise<AdminUser> {
    // Original admin authentication logic
    const adminEmails = JSON.parse(process.env.ADMIN_EMAILS || '{}');
    if (!Object.values(adminEmails).includes(token.email)) {
      throw new UnauthorizedError('Not an admin user');
    }

    return {
      uid: token.uid,
      email: token.email!,
      role: UserRole.ADMIN,
      platform: Platform.ADMIN,
    };
  }

  // Migrate mobile auth logic
  private async resolveMobileUser(token: admin.auth.DecodedIdToken): Promise<MobileUser> {
    // Mobile user authentication logic
    return {
      uid: token.uid,
      email: token.email!,
      role: UserRole.MOBILE_USER,
      platform: Platform.MOBILE,
    };
  }
}
```

### Phase 4: Testing Strategy (Week 3-4)

#### 4.1 Unit Tests

```typescript
// Backend/tests/unit/services/UnifiedAuthService.test.ts
describe('UnifiedAuthService', () => {
  let authService: UnifiedAuthService;

  beforeEach(() => {
    authService = new UnifiedAuthService();
  });

  describe('Platform-specific authentication', () => {
    test('should authenticate admin user correctly', async () => {
      const mockToken = 'mock-admin-token';
      const result = await authService.authenticateUser(mockToken, Platform.ADMIN);

      expect(result.user.role).toBe(UserRole.ADMIN);
      expect(result.platform).toBe(Platform.ADMIN);
    });

    test('should authenticate mobile user correctly', async () => {
      const mockToken = 'mock-mobile-token';
      const result = await authService.authenticateUser(mockToken, Platform.MOBILE);

      expect(result.user.role).toBe(UserRole.MOBILE_USER);
      expect(result.platform).toBe(Platform.MOBILE);
    });
  });
});
```

#### 4.2 Integration Tests

```typescript
// Backend/tests/integration/api/platform-routes.test.ts
describe('Platform-specific API Routes', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  describe('Admin Routes', () => {
    test('GET /api/admin/status should require admin auth', async () => {
      const response = await request(app).get('/api/admin/status').expect(401);

      expect(response.body.error).toContain('Authorization token required');
    });

    test('GET /api/admin/status should return all statuses for admin', async () => {
      const adminToken = await generateAdminToken();

      const response = await request(app)
        .get('/api/admin/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('phoneNumber'); // Admin can see phone numbers
    });
  });

  describe('Mobile Routes', () => {
    test('GET /api/mobile/status should return user-specific statuses', async () => {
      const mobileToken = await generateMobileUserToken();

      const response = await request(app)
        .get('/api/mobile/status')
        .set('Authorization', `Bearer ${mobileToken}`)
        .set('X-Platform', 'mobile')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).not.toHaveProperty('phoneNumber'); // Mobile users don't see others' phone numbers
    });
  });
});
```

### Phase 5: Deployment Strategy (Week 4)

#### 5.1 Blue-Green Deployment

```typescript
// deployment/deploy-strategy.ts
export interface DeploymentConfig {
  environment: 'staging' | 'production';
  enableGradualRollout: boolean;
  rolloutPercentage: number;
  fallbackEnabled: boolean;
}

export class DeploymentManager {
  async deployUnifiedBackend(config: DeploymentConfig) {
    // 1. Deploy to staging environment first
    await this.deployToStaging();

    // 2. Run comprehensive tests
    await this.runSmokeTests();

    // 3. Gradual production rollout
    if (config.enableGradualRollout) {
      await this.gradualProductionRollout(config.rolloutPercentage);
    } else {
      await this.fullProductionDeployment();
    }

    // 4. Monitor and validate
    await this.monitorDeployment();
  }

  private async gradualProductionRollout(percentage: number) {
    // Route percentage of traffic to new backend
    // Monitor error rates and performance
    // Gradually increase traffic to new backend
  }
}
```

## Scaling Considerations

### Horizontal Scaling Architecture

#### 1. Load Balancer Configuration

```nginx
# nginx.conf for load balancing
upstream backend_servers {
    least_conn;
    server backend-1:4000 weight=3;
    server backend-2:4000 weight=3;
    server backend-3:4000 weight=2;
}

server {
    listen 80;
    server_name api.rescuenect.com;

    # Route admin requests
    location /api/admin/ {
        proxy_pass http://backend_servers;
        proxy_set_header X-Platform "admin";
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Route mobile requests
    location /api/mobile/ {
        proxy_pass http://backend_servers;
        proxy_set_header X-Platform "mobile";
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Shared endpoints
    location /api/shared/ {
        proxy_pass http://backend_servers;
        proxy_set_header X-Platform "shared";
    }
}
```

#### 2. Database Scaling Strategy

```typescript
// Backend/src/services/database/ScalingStrategy.ts
export class DatabaseScalingManager {
  // Read replicas for read-heavy operations
  private readReplica = admin.firestore();
  private writeInstance = admin.firestore();

  async optimizedRead(collection: string, query: any): Promise<any[]> {
    // Use read replica for heavy read operations
    return await this.readReplica.collection(collection).where(query).get();
  }

  async optimizedWrite(collection: string, data: any): Promise<string> {
    // Use primary instance for writes
    const docRef = await this.writeInstance.collection(collection).add(data);
    return docRef.id;
  }

  // Implement caching strategy
  async cachedRead(cacheKey: string, fetchFn: () => Promise<any>): Promise<any> {
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    const result = await fetchFn();
    await this.setCache(cacheKey, result, 300); // 5-minute cache
    return result;
  }
}
```

#### 3. Microservices Preparation

```typescript
// Backend/src/services/microservices/ServiceRegistry.ts
export interface MicroserviceConfig {
  name: string;
  url: string;
  healthEndpoint: string;
  version: string;
}

export class ServiceRegistry {
  private services: Map<string, MicroserviceConfig> = new Map();

  registerService(config: MicroserviceConfig) {
    this.services.set(config.name, config);
  }

  async callService(serviceName: string, endpoint: string, data?: any): Promise<any> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not registered`);
    }

    // Implement circuit breaker pattern
    return await this.circuitBreakerCall(`${service.url}${endpoint}`, data);
  }

  // Future microservices to extract:
  // - NotificationService (push notifications, SMS, email)
  // - WeatherService (weather data processing)
  // - AnalyticsService (reporting and analytics)
  // - FileService (image/file uploads)
}
```

### Caching Strategy

#### 1. Redis Implementation

```typescript
// Backend/src/services/cache/RedisCache.ts
import Redis from 'ioredis';

export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
  }

  // Cache status data for admin dashboard
  async cacheStatusSummary(data: any, ttl: number = 300): Promise<void> {
    await this.redis.setex('status:summary', ttl, JSON.stringify(data));
  }

  async getCachedStatusSummary(): Promise<any | null> {
    const cached = await this.redis.get('status:summary');
    return cached ? JSON.parse(cached) : null;
  }

  // Cache user sessions
  async cacheUserSession(uid: string, sessionData: any, ttl: number = 86400): Promise<void> {
    await this.redis.setex(`session:${uid}`, ttl, JSON.stringify(sessionData));
  }

  // Invalidate cache on data changes
  async invalidateStatusCache(): Promise<void> {
    const keys = await this.redis.keys('status:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### Performance Monitoring

#### 1. Application Performance Monitoring

```typescript
// Backend/src/middlewares/monitoring/PerformanceMonitor.ts
export class PerformanceMonitor {
  static trackRequest() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();

      // Track request details
      const requestId = req.headers['x-request-id'] || generateRequestId();
      req.requestId = requestId;

      // Log request start
      console.log(`[${requestId}] ${req.method} ${req.path} - Platform: ${req.headers['x-platform']} - Start`);

      // Track response
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
          requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          platform: req.headers['x-platform'],
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString(),
        };

        // Log performance metrics
        console.log(`[${requestId}] Completed in ${duration}ms - Status: ${res.statusCode}`);

        // Send to monitoring service (e.g., New Relic, DataDog)
        this.sendMetrics(logData);

        // Alert on slow requests
        if (duration > 5000) {
          this.alertSlowRequest(logData);
        }
      });

      next();
    };
  }

  private static sendMetrics(data: any) {
    // Send to external monitoring service
    // Example: New Relic, DataDog, or custom analytics
  }

  private static alertSlowRequest(data: any) {
    // Send alert for requests taking longer than 5 seconds
    console.warn(`SLOW REQUEST ALERT:`, data);
  }
}
```

## Communication Strategies

### 1. Frontend (Admin) Communication

#### API Client Setup

```typescript
// Frontend/src/lib/api/ApiClient.ts
export class ApiClient {
  private baseURL: string;
  private platform: string = 'admin';

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Platform': this.platform,
        'X-App-Version': import.meta.env.VITE_APP_VERSION || '1.0.0',
        ...options.headers,
      },
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    return await response.json();
  }

  // Admin-specific methods
  async getStatusHistory(filters: StatusFilters = {}): Promise<StatusResponse[]> {
    const queryParams = new URLSearchParams(filters as any).toString();
    return this.request<StatusResponse[]>(`/admin/status?${queryParams}`);
  }

  async getUserManagement(): Promise<UserManagementData> {
    return this.request<UserManagementData>('/admin/users');
  }

  async getDashboardAnalytics(): Promise<AnalyticsData> {
    return this.request<AnalyticsData>('/admin/analytics/dashboard');
  }
}

// Usage in React components
const apiClient = new ApiClient();

export const useStatusHistory = () => {
  const [data, setData] = useState<StatusResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (filters?: StatusFilters) => {
    setLoading(true);
    try {
      const result = await apiClient.getStatusHistory(filters);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch status history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, fetchData };
};
```

### 2. Mobile App Communication

#### React Native API Client

```typescript
// mobile/client/src/services/api/MobileApiClient.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export class MobileApiClient {
  private baseURL: string;
  private platform: string = 'mobile';

  constructor() {
    this.baseURL = __DEV__
      ? 'http://192.168.1.100:4000/api' // Development
      : 'https://api.rescuenect.com/api'; // Production
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Platform': this.platform,
        'X-App-Version': require('../../../package.json').version,
        'X-Device-Platform': Platform.OS,
        'X-Device-Version': Platform.Version,
        ...options.headers,
      },
    };

    // Add auth token from AsyncStorage
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new MobileApiError(response.status, errorText);
    }

    return await response.json();
  }

  // Mobile-specific methods
  async getMyStatuses(): Promise<MobileStatusResponse[]> {
    return this.request<MobileStatusResponse[]>('/mobile/status');
  }

  async createStatus(statusData: CreateStatusRequest): Promise<CreateStatusResponse> {
    return this.request<CreateStatusResponse>('/mobile/status', {
      method: 'POST',
      body: JSON.stringify(statusData),
    });
  }

  async updateProfile(profileData: UpdateProfileRequest): Promise<ProfileResponse> {
    return this.request<ProfileResponse>('/mobile/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getAppConfig(): Promise<MobileAppConfig> {
    return this.request<MobileAppConfig>('/mobile/app-config');
  }
}

// React Native hook usage
import { useMobileApiClient } from './useMobileApiClient';

export const useMyStatuses = () => {
  const apiClient = useMobileApiClient();
  const [statuses, setStatuses] = useState<MobileStatusResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.getMyStatuses();
      setStatuses(result);
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  return { statuses, loading, fetchStatuses };
};
```

### 3. Real-time Communication

#### WebSocket Implementation

```typescript
// Backend/src/services/websocket/WebSocketManager.ts
import { Server as SocketIOServer } from 'socket.io';
import { authenticateSocket } from '../auth/SocketAuth';

export class WebSocketManager {
  private io: SocketIOServer;
  private connectedClients: Map<string, SocketClient> = new Map();

  constructor(server: any) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: [process.env.FRONTEND_URL!, process.env.MOBILE_APP_URL!],
        credentials: true,
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', async socket => {
      try {
        // Authenticate socket connection
        const user = await authenticateSocket(socket);

        const client: SocketClient = {
          socketId: socket.id,
          userId: user.uid,
          platform: user.platform,
          joinedAt: new Date(),
        };

        this.connectedClients.set(socket.id, client);

        // Join platform-specific room
        socket.join(`platform:${user.platform}`);
        socket.join(`user:${user.uid}`);

        console.log(`${user.platform} user ${user.uid} connected`);

        // Platform-specific event handlers
        if (user.platform === Platform.ADMIN) {
          this.setupAdminEvents(socket, user);
        } else {
          this.setupMobileEvents(socket, user);
        }

        socket.on('disconnect', () => {
          this.connectedClients.delete(socket.id);
          console.log(`User ${user.uid} disconnected`);
        });
      } catch (error) {
        socket.emit('auth_error', { message: 'Authentication failed' });
        socket.disconnect();
      }
    });
  }

  private setupAdminEvents(socket: any, user: AuthenticatedUser) {
    // Admin can listen to all status updates
    socket.on('subscribe_all_statuses', () => {
      socket.join('status:all');
    });

    socket.on('get_live_statistics', async () => {
      const stats = await this.getLiveStatistics();
      socket.emit('live_statistics', stats);
    });
  }

  private setupMobileEvents(socket: any, user: AuthenticatedUser) {
    // Mobile users only get their own updates
    socket.on('subscribe_my_statuses', () => {
      socket.join(`status:user:${user.uid}`);
    });

    socket.on('location_update', locationData => {
      this.broadcastLocationUpdate(user.uid, locationData);
    });
  }

  // Broadcast status updates
  public broadcastStatusUpdate(status: StatusEntity, eventType: 'created' | 'updated' | 'deleted') {
    // Notify admins
    this.io.to('platform:admin').emit('status_update', {
      type: eventType,
      status,
      timestamp: new Date().toISOString(),
    });

    // Notify the specific user
    this.io.to(`user:${status.uid}`).emit('my_status_update', {
      type: eventType,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastSystemAlert(alert: SystemAlert) {
    // Emergency alerts to all connected clients
    this.io.emit('system_alert', alert);
  }
}

// Frontend/src/hooks/useWebSocket.ts
export const useWebSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const newSocket = io(import.meta.env.VITE_WS_URL || 'http://localhost:4000', {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('WebSocket connected');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('WebSocket disconnected');
    });

    newSocket.on('status_update', data => {
      // Handle real-time status updates
      console.log('Status update received:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, connected };
};
```

### 4. Error Handling and Resilience

#### Circuit Breaker Pattern

```typescript
// Backend/src/utils/CircuitBreaker.ts
export class CircuitBreaker {
  private failures: number = 0;
  private nextAttempt: Date = new Date();
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.nextAttempt > new Date()) {
        throw new Error('Circuit breaker is OPEN');
      } else {
        this.state = 'HALF_OPEN';
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = new Date(Date.now() + this.recoveryTimeout);
    }
  }
}

// Usage in API calls
const circuitBreaker = new CircuitBreaker();

export const resilientApiCall = async <T>(operation: () => Promise<T>): Promise<T> => {
  return circuitBreaker.execute(operation);
};
```

This completes the comprehensive backend integration documentation. The strategy covers unified architecture, migration planning, scaling considerations, and robust communication patterns between your admin frontend and mobile applications.
