export type ClientCoverageBarangay = {
  barangayCode: string | null;
  barangayLabel: string;
  value: string;
  isActive: boolean;
};

export type LguRequest = {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  lguName: string;
  officeDepartment: string;
  requesterName: string;
  requesterPosition: string;
  requesterEmail: string;
  requesterPhone: string;
  regionCode?: string;
  regionName: string;
  provinceCode?: string;
  provinceName: string;
  municipalityCode?: string;
  municipalityName: string;
  municipalityType: 'municipality' | 'city';
  selectedBarangays: ClientCoverageBarangay[];
  barangaysVerified?: boolean;
  notes?: string;
  reviewedBy?: string | null;
  reviewedAt?: unknown;
  reviewNote?: string | null;
  clientId?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ClientLgu = {
  id: string;
  name: string;
  type?: 'municipality' | 'city';
  status: 'draft' | 'active' | 'inactive';
  regionCode?: string | null;
  regionName?: string | null;
  provinceCode?: string;
  provinceName: string;
  municipalityCode?: string;
  municipalityName: string;
  municipalityType?: 'municipality' | 'city';
  weatherLocationKey: string;
  weatherLatitude: number | null;
  weatherLongitude: number | null;
  barangays: ClientCoverageBarangay[];
  requestId?: string | null;
};

export type AdminUser = {
  uid: string;
  email: string;
  role: 'super_admin' | 'lgu_admin';
  clientId: string | null;
  clientName?: string | null;
  status: 'active' | 'inactive';
};

export type SystemStatus = {
  status: 'healthy' | 'degraded';
  timestamp: string;
  backend: { uptime: number; memory: { heapUsed: number; heapTotal: number } };
  firebase: { connected: boolean };
  psgc: { configured: boolean; cacheEntries: number; status: string };
  weather: { configured: boolean; status: string };
  earthquake: { status: string };
};

export type ClientDetailResponse = {
  client: ClientLgu;
  request: LguRequest | null;
  admins: AdminUser[];
};
