# Backend Integration Strategy

## Overview

This document outlines the comprehensive strategy for integrating your mobile backend with the main backend to create a unified, scalable server architecture that serves both admin (web) and client (mobile) platforms.

## Table of Contents

1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Target Unified Architecture](#target-unified-architecture)
3. [Project Structure](#project-structure)
4. [Platform-Specific Routing](#platform-specific-routing)
5. [Authentication & Authorization](#authentication--authorization)
6. [Database Architecture](#database-architecture)
7. [API Design Patterns](#api-design-patterns)
8. [Migration Plan](#migration-plan)
9. [Scaling Considerations](#scaling-considerations)
10. [Communication Strategies](#communication-strategies)

## Current Architecture Analysis

### Existing Structure

```
Backend/                    # Admin/Web Backend
├── src/
│   ├── server.ts
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── router/
│   └── services/

mobile/backend/            # Mobile Backend (to be integrated)
├── src/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   └── router/
```

### Issues with Current Setup

- **Code Duplication**: Similar controllers and models in both backends
- **Maintenance Overhead**: Two separate codebases to maintain
- **Deployment Complexity**: Multiple deployment pipelines
- **Data Consistency**: Potential conflicts between different backend implementations

## Target Unified Architecture

### Single Backend Approach

```
Backend/                   # Unified Backend
├── src/
│   ├── server.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── cors.ts
│   │   └── environment.ts
│   ├── controllers/
│   │   ├── admin/         # Admin-specific controllers
│   │   ├── mobile/        # Mobile-specific controllers
│   │   └── shared/        # Shared controllers
│   ├── middlewares/
│   │   ├── auth/
│   │   ├── validation/
│   │   ├── platform/      # Platform detection
│   │   └── security/
│   ├── models/
│   │   ├── entities/      # Database models
│   │   ├── dto/           # Data Transfer Objects
│   │   └── validation/    # Input validation schemas
│   ├── routes/
│   │   ├── admin/         # Admin routes (/api/admin/*)
│   │   ├── mobile/        # Mobile routes (/api/mobile/*)
│   │   └── shared/        # Shared routes (/api/shared/*)
│   ├── services/
│   │   ├── auth/
│   │   ├── notifications/
│   │   ├── weather/
│   │   └── status/
│   ├── utils/
│   ├── types/
│   └── jobs/
├── docs/                  # API Documentation
├── tests/
└── deployment/
```

## Project Structure

### Recommended Directory Structure

```typescript
// Backend/src/types/platform.ts
export enum Platform {
  ADMIN = 'admin',
  MOBILE = 'mobile',
  SHARED = 'shared',
}

export interface PlatformContext {
  platform: Platform;
  version?: string;
  userAgent?: string;
}
```

### Configuration Management

```typescript
// Backend/src/config/environment.ts
export interface Config {
  // Server
  port: number;
  nodeEnv: string;

  // Database
  firebase: {
    credentials: string;
    projectId: string;
  };

  // CORS
  allowedOrigins: {
    admin: string;
    mobile: string;
  };

  // Authentication
  jwt: {
    secret: string;
    expiresIn: string;
  };

  // External APIs
  weather: {
    apiKey: string;
  };
}

export const config: Config = {
  port: parseInt(process.env.PORT || '4000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  firebase: {
    credentials: process.env.FIREBASE_ADMIN_CREDENTIALS!,
    projectId: process.env.FIREBASE_PROJECT_ID!,
  },
  allowedOrigins: {
    admin: process.env.FRONTEND_URL!,
    mobile: process.env.MOBILE_APP_URL!,
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: '24h',
  },
  weather: {
    apiKey: process.env.WEATHER_API_KEY!,
  },
};
```

### CORS Configuration

```typescript
// Backend/src/config/cors.ts
import cors from 'cors';
import { config } from './environment';

export const corsOptions = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      config.allowedOrigins.admin,
      config.allowedOrigins.mobile,
      'http://localhost:3000', // Development
      'http://localhost:5173', // Vite dev server
      'http://192.168.1.0/24', // Local network range for mobile
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.some(allowed => origin.includes(allowed) || allowed.includes('localhost'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Platform', // Custom header for platform detection
    'X-App-Version', // Custom header for version tracking
  ],
});
```

## Platform-Specific Routing

### Route Organization

```typescript
// Backend/src/routes/index.ts
import express from 'express';
import { platformDetection } from '../middlewares/platform/platformDetection';
import adminRoutes from './admin';
import mobileRoutes from './mobile';
import sharedRoutes from './shared';

const router = express.Router();

// Apply platform detection middleware
router.use(platformDetection);

// Health check (no authentication required)
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    platform: req.platform,
  });
});

// Platform-specific routes
router.use('/admin', adminRoutes);
router.use('/mobile', mobileRoutes);
router.use('/shared', sharedRoutes);

export default router;
```

### Admin Routes Example

```typescript
// Backend/src/routes/admin/index.ts
import express from 'express';
import { requireAdminAuth } from '../../middlewares/auth/adminAuth';
import statusRoutes from './statusRoutes';
import userManagementRoutes from './userManagement';
import analyticsRoutes from './analytics';

const router = express.Router();

// Apply admin authentication to all admin routes
router.use(requireAdminAuth);

// Admin-specific routes
router.use('/status', statusRoutes);
router.use('/users', userManagementRoutes);
router.use('/analytics', analyticsRoutes);

// Admin dashboard endpoints
router.get('/dashboard/stats', async (req, res) => {
  // Admin dashboard statistics
});

export default router;
```

### Mobile Routes Example

```typescript
// Backend/src/routes/mobile/index.ts
import express from 'express';
import { requireMobileAuth } from '../../middlewares/auth/mobileAuth';
import statusRoutes from './statusRoutes';
import profileRoutes from './profileRoutes';
import notificationRoutes from './notifications';

const router = express.Router();

// Apply mobile authentication middleware
router.use(requireMobileAuth);

// Mobile-specific routes
router.use('/status', statusRoutes);
router.use('/profile', profileRoutes);
router.use('/notifications', notificationRoutes);

// Mobile app endpoints
router.get('/app-config', async (req, res) => {
  // Mobile app configuration
});

export default router;
```

## Authentication & Authorization

### Unified Authentication Strategy

```typescript
// Backend/src/services/auth/AuthService.ts
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MOBILE_USER = 'mobile_user',
  GUEST = 'guest',
}

export enum Platform {
  ADMIN = 'admin',
  MOBILE = 'mobile',
}

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: UserRole;
  platform: Platform;
  permissions: string[];
  lastLogin: Date;
}

export class AuthService {
  // Verify Firebase token and determine user role/platform
  async verifyToken(token: string, platform: Platform): Promise<AuthenticatedUser> {
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Determine user role based on platform and email
    const role = await this.determineUserRole(decodedToken.email, platform);
    const permissions = await this.getUserPermissions(role, platform);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email!,
      role,
      platform,
      permissions,
      lastLogin: new Date(),
    };
  }

  private async determineUserRole(email: string, platform: Platform): Promise<UserRole> {
    // Check if user is admin (for admin platform)
    if (platform === Platform.ADMIN) {
      const adminEmails = JSON.parse(process.env.ADMIN_EMAILS || '{}');
      if (Object.values(adminEmails).includes(email)) {
        return UserRole.ADMIN;
      }
      throw new Error('Unauthorized: Not an admin user');
    }

    // For mobile platform, default to mobile user
    return UserRole.MOBILE_USER;
  }

  private async getUserPermissions(role: UserRole, platform: Platform): Promise<string[]> {
    const permissionMap = {
      [UserRole.SUPER_ADMIN]: ['*'], // All permissions
      [UserRole.ADMIN]: [
        'status:read',
        'status:write',
        'status:delete',
        'users:read',
        'users:manage',
        'analytics:read',
      ],
      [UserRole.MODERATOR]: ['status:read', 'status:write', 'users:read'],
      [UserRole.MOBILE_USER]: [
        'status:read',
        'status:create',
        'status:update_own',
        'profile:read',
        'profile:update_own',
      ],
    };

    return permissionMap[role] || [];
  }
}
```

### Authentication Middlewares

```typescript
// Backend/src/middlewares/auth/adminAuth.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService, Platform } from '../../services/auth/AuthService';

export const requireAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const authService = new AuthService();
    const user = await authService.verifyToken(token, Platform.ADMIN);

    // Attach user to request
    req.user = user;
    req.platform = Platform.ADMIN;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Backend/src/middlewares/auth/mobileAuth.ts
export const requireMobileAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const authService = new AuthService();
    const user = await authService.verifyToken(token, Platform.MOBILE);

    req.user = user;
    req.platform = Platform.MOBILE;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

## Database Architecture

### Unified Data Models

```typescript
// Backend/src/models/entities/Status.ts
export interface StatusEntity {
  // Core fields
  id: string;
  parentId: string;
  versionId: string;

  // User information
  uid: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profileImage?: string;

  // Status details
  condition: 'safe' | 'evacuated' | 'affected' | 'missing';
  statusType: 'current' | 'history' | 'deleted';
  location: string;
  lat: number;
  lng: number;

  // Content
  note: string;
  image?: string;

  // Settings
  shareLocation: boolean;
  shareContact: boolean;

  // Timestamps
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  expiresAt?: Timestamp;
  retentionUntil?: Timestamp;

  // Platform tracking
  createdFrom: 'admin' | 'mobile';
  lastModifiedFrom: 'admin' | 'mobile';
}

// Backend/src/models/dto/StatusDTO.ts
export class StatusCreateDTO {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsPhoneNumber()
  phoneNumber: string;

  @IsIn(['safe', 'evacuated', 'affected', 'missing'])
  condition: string;

  @IsString()
  location: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsBoolean()
  shareLocation: boolean;

  @IsBoolean()
  shareContact: boolean;
}

export class StatusResponseDTO {
  id: string;
  versionId: string;
  firstName: string;
  lastName: string;
  condition: string;
  location: string;
  createdAt: string;
  statusType: string;

  // Platform-specific fields
  phoneNumber?: string; // Only for admin or owner
  lat?: number; // Only if shareLocation is true
  lng?: number; // Only if shareLocation is true
}
```

### Repository Pattern

```typescript
// Backend/src/services/status/StatusRepository.ts
export class StatusRepository {
  private db = admin.firestore();

  async create(status: StatusEntity): Promise<string> {
    const docRef = await this.db.collection('statuses').add(status);
    return docRef.id;
  }

  async findByParentId(parentId: string): Promise<StatusEntity[]> {
    const snapshot = await this.db
      .collection('statuses')
      .where('parentId', '==', parentId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as StatusEntity
    );
  }

  async findLatestByUid(uid: string): Promise<StatusEntity | null> {
    const snapshot = await this.db
      .collection('statuses')
      .where('uid', '==', uid)
      .where('statusType', '==', 'current')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as StatusEntity;
  }

  // Platform-specific queries
  async findForAdmin(filters: AdminStatusFilters): Promise<StatusEntity[]> {
    let query = this.db.collection('statuses');

    if (filters.condition) {
      query = query.where('condition', '==', filters.condition);
    }

    if (filters.statusType) {
      query = query.where('statusType', '==', filters.statusType);
    }

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(filters.limit || 50)
      .get();

    return snapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as StatusEntity
    );
  }

  async findForMobileUser(uid: string): Promise<StatusEntity[]> {
    const snapshot = await this.db.collection('statuses').where('uid', '==', uid).orderBy('createdAt', 'desc').get();

    return snapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as StatusEntity
    );
  }
}
```

## API Design Patterns

### RESTful API Structure

```typescript
// Backend/src/controllers/shared/StatusController.ts
export class StatusController {
  private statusService = new StatusService();

  // GET /api/admin/status - Admin view (all statuses)
  async getStatusesForAdmin(req: Request, res: Response) {
    try {
      const filters = req.query as AdminStatusFilters;
      const statuses = await this.statusService.getStatusesForAdmin(filters);

      // Transform for admin view (include all fields)
      const response = statuses.map(status => ({
        ...status,
        phoneNumber: status.phoneNumber, // Admin can see phone numbers
        lat: status.lat,
        lng: status.lng,
      }));

      res.json({ data: response, total: response.length });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch statuses' });
    }
  }

  // GET /api/mobile/status - Mobile view (user's own statuses)
  async getStatusesForMobile(req: Request, res: Response) {
    try {
      const { uid } = req.user!;
      const statuses = await this.statusService.getStatusesForUser(uid);

      // Transform for mobile view
      const response = statuses.map(status => ({
        id: status.id,
        versionId: status.versionId,
        condition: status.condition,
        location: status.location,
        createdAt: status.createdAt,
        statusType: status.statusType,
        // Include location only if sharing is enabled
        ...(status.shareLocation && {
          lat: status.lat,
          lng: status.lng,
        }),
      }));

      res.json({ data: response });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch statuses' });
    }
  }

  // POST /api/mobile/status - Create status (mobile only)
  async createStatus(req: Request, res: Response) {
    try {
      const { uid, platform } = req.user!;
      const statusData = req.body as StatusCreateDTO;

      // Validate input
      const validationErrors = await validate(statusData);
      if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
      }

      const statusId = await this.statusService.createStatus({
        ...statusData,
        uid,
        createdFrom: platform,
        statusType: 'current',
        createdAt: admin.firestore.Timestamp.now(),
      });

      res.status(201).json({ id: statusId, message: 'Status created successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create status' });
    }
  }
}
```

### Response Standardization

```typescript
// Backend/src/utils/ApiResponse.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: string;
  };
}

export class ResponseBuilder {
  static success<T>(data: T, meta?: Partial<ApiResponse['meta']>): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }

  static error(message: string, errors?: ValidationError[]): ApiResponse {
    return {
      success: false,
      error: message,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Usage in controllers
res.json(ResponseBuilder.success(statuses, { total: statuses.length }));
res.status(400).json(ResponseBuilder.error('Validation failed', validationErrors));
```

This is Part 1 of the documentation. Would you like me to continue with the remaining sections covering Migration Plan, Scaling Considerations, and Communication Strategies?
