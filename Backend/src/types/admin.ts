export type AdminRole = 'super_admin' | 'lgu_admin';
export type AdminStatus = 'active' | 'inactive';
export type ClientLguStatus = 'draft' | 'active' | 'inactive';
export type ClientLguType = 'municipality' | 'city';
export type LguRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface AdminUser {
  uid: string;
  email: string;
  role: AdminRole;
  clientId: string | null;
  clientName?: string | null;
  municipalityName?: string | null;
  weatherLocationKey?: string | null;
  weatherLatitude?: number | null;
  weatherLongitude?: number | null;
  clientBarangays?: ClientCoverageBarangay[];
  status: AdminStatus;
  permissionsVersion: number;
  permissions: string[];
  onboardingComplete: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  barangay?: string;
  address?: string;
  fcmToken?: string | null;
}

export interface ClientCoverageBarangay {
  barangayCode: string | null;
  barangayLabel: string;
  value: string;
  isActive: boolean;
  latitude?: number | null;
  longitude?: number | null;
  verified?: boolean;
}

export interface ClientLgu {
  id: string;
  name: string;
  type: ClientLguType;
  status: ClientLguStatus;
  regionCode?: string | null;
  regionName?: string | null;
  provinceCode: string;
  provinceName: string;
  municipalityCode: string;
  municipalityName: string;
  municipalityType: ClientLguType;
  weatherLocationKey: string;
  weatherLatitude: number | null;
  weatherLongitude: number | null;
  barangays: ClientCoverageBarangay[];
  requestId?: string | null;
}

export interface LguRequest {
  id: string;
  status: LguRequestStatus;
  lguName: string;
  officeDepartment: string;
  requesterName: string;
  requesterPosition: string;
  requesterEmail: string;
  requesterPhone: string;
  regionCode: string;
  regionName: string;
  provinceCode: string;
  provinceName: string;
  municipalityCode: string;
  municipalityName: string;
  municipalityType: ClientLguType;
  selectedBarangays: ClientCoverageBarangay[];
  barangaysVerified: boolean;
  notes?: string;
  reviewedBy?: string | null;
  reviewedAt?: unknown;
  reviewNote?: string | null;
  clientId?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SystemStatus {
  status: 'healthy' | 'degraded';
  timestamp: string;
  backend: {
    status: 'ok';
    uptime: number;
    memory: NodeJS.MemoryUsage;
  };
  firebase: {
    connected: boolean;
  };
  psgc: {
    configured: boolean;
    cacheEntries: number;
    status: 'ok' | 'fallback_rootscratch';
  };
  weather: {
    configured: boolean;
    status: 'configured' | 'missing_key';
  };
  earthquake: {
    status: 'configured' | 'unknown';
  };
}
