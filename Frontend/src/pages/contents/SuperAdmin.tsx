import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { useAuth } from '@/stores/useAuth';
import { Button, Card, CardBody, Chip, Input, Textarea, addToast } from '@heroui/react';
import axios from 'axios';
import { Activity, Building2, CheckCircle2, Shield, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type ClientCoverageBarangay = {
  barangayCode: string | null;
  barangayLabel: string;
  value: string;
  isActive: boolean;
};

type LguRequest = {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  lguName: string;
  officeDepartment: string;
  requesterName: string;
  requesterPosition: string;
  requesterEmail: string;
  requesterPhone: string;
  regionName: string;
  provinceName: string;
  municipalityName: string;
  municipalityType: 'municipality' | 'city';
  selectedBarangays: ClientCoverageBarangay[];
  reviewNote?: string | null;
  clientId?: string | null;
};

type ClientLgu = {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'inactive';
  provinceName: string;
  municipalityName: string;
  weatherLocationKey: string;
  weatherLatitude: number | null;
  weatherLongitude: number | null;
  barangays: ClientCoverageBarangay[];
};

type AdminUser = {
  uid: string;
  email: string;
  role: 'super_admin' | 'lgu_admin';
  clientId: string | null;
  clientName?: string | null;
  status: 'active' | 'inactive';
};

type SystemStatus = {
  status: 'healthy' | 'degraded';
  timestamp: string;
  backend: { uptime: number; memory: { heapUsed: number; heapTotal: number } };
  firebase: { connected: boolean };
  psgc: { configured: boolean; cacheEntries: number; status: string };
  weather: { configured: boolean; status: string };
  earthquake: { status: string };
};

const getToken = async () => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not authenticated');
  return token;
};

const statusColor = (status: string) => {
  if (status === 'active' || status === 'approved' || status === 'healthy') return 'success';
  if (status === 'pending' || status === 'draft') return 'warning';
  if (status === 'inactive' || status === 'rejected' || status === 'degraded') return 'danger';
  return 'default';
};

const useSuperFetch = <T,>(url: string, key: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get<T>(url, { headers: { Authorization: `Bearer ${token}` } });
      setData(response.data);
    } catch (error) {
      console.error(`[${key}]`, error);
      addToast({ title: 'Load failed', description: `Unable to load ${key}.`, color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return { data, loading, refetch: fetchData };
};

export const SuperAdminOverview = () => {
  const userData = useAuth(state => state.userData);
  const { data: requestData } = useSuperFetch<{ requests: LguRequest[] }>(
    API_ENDPOINTS.SUPER_ADMIN.LGU_REQUESTS,
    'LGU requests'
  );
  const { data: clientData } = useSuperFetch<{ clients: ClientLgu[] }>(API_ENDPOINTS.SUPER_ADMIN.CLIENTS, 'clients');

  const summary = useMemo(() => {
    const requests = requestData?.requests ?? [];
    const clients = clientData?.clients ?? [];
    return {
      pendingRequests: requests.filter(item => item.status === 'pending').length,
      activeClients: clients.filter(item => item.status === 'active').length,
      draftClients: clients.filter(item => item.status === 'draft').length,
      inactiveClients: clients.filter(item => item.status === 'inactive').length,
    };
  }, [requestData, clientData]);

  const cards = [
    { label: 'Pending Requests', value: summary.pendingRequests, icon: Building2, to: '/super/requests' },
    { label: 'Active Clients', value: summary.activeClients, icon: CheckCircle2, to: '/super/clients' },
    { label: 'Draft Clients', value: summary.draftClients, icon: Activity, to: '/super/clients' },
    { label: 'Inactive Clients', value: summary.inactiveClients, icon: XCircle, to: '/super/clients' },
  ];

  return (
    <div className="w-full space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold">Super Admin Overview</h1>
        <p className="text-sm text-default-500">Signed in as {userData?.email}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => (
          <Card key={card.label} as={Link} to={card.to} className="border border-default-200">
            <CardBody className="flex-row items-center justify-between">
              <div>
                <p className="text-sm text-default-500">{card.label}</p>
                <p className="text-3xl font-semibold">{card.value}</p>
              </div>
              <card.icon className="text-primary" size={28} />
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const SuperAdminRequests = () => {
  const { data, loading, refetch } = useSuperFetch<{ requests: LguRequest[] }>(
    API_ENDPOINTS.SUPER_ADMIN.LGU_REQUESTS,
    'LGU requests'
  );
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const updateRequest = async (id: string, action: 'approve' | 'reject') => {
    const token = await getToken();
    const endpoint =
      action === 'approve'
        ? API_ENDPOINTS.SUPER_ADMIN.APPROVE_LGU_REQUEST(id)
        : API_ENDPOINTS.SUPER_ADMIN.REJECT_LGU_REQUEST(id);
    await axios.post(endpoint, { reviewNote: reviewNotes[id] || '' }, { headers: { Authorization: `Bearer ${token}` } });
    addToast({ title: action === 'approve' ? 'Request approved' : 'Request rejected', color: 'success' });
    refetch();
  };

  return (
    <div className="w-full space-y-5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LGU Requests</h1>
          <p className="text-sm text-default-500">Review municipality and city onboarding requests.</p>
        </div>
        <Button variant="flat" onPress={refetch} isLoading={loading}>
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {(data?.requests ?? []).map(request => (
          <Card key={request.id} className="border border-default-200">
            <CardBody className="gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{request.lguName}</h2>
                    <Chip size="sm" color={statusColor(request.status) as any}>
                      {request.status}
                    </Chip>
                  </div>
                  <p className="text-sm text-default-500">
                    {request.municipalityName}, {request.provinceName} • {request.selectedBarangays.length} barangays
                  </p>
                </div>
                <div className="text-right text-sm text-default-500">
                  <p>{request.requesterName}</p>
                  <p>{request.requesterEmail}</p>
                  <p>{request.requesterPhone}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {request.selectedBarangays.slice(0, 12).map(barangay => (
                  <Chip key={barangay.barangayCode || barangay.value} size="sm" variant="flat">
                    {barangay.barangayLabel}
                  </Chip>
                ))}
                {request.selectedBarangays.length > 12 && (
                  <Chip size="sm" variant="flat">
                    +{request.selectedBarangays.length - 12}
                  </Chip>
                )}
              </div>
              {request.status === 'pending' && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
                  <Textarea
                    label="Review note"
                    minRows={1}
                    value={reviewNotes[request.id] || ''}
                    onValueChange={value => setReviewNotes(prev => ({ ...prev, [request.id]: value }))}
                  />
                  <Button color="success" onPress={() => updateRequest(request.id, 'approve')}>
                    Approve Draft
                  </Button>
                  <Button color="danger" variant="flat" onPress={() => updateRequest(request.id, 'reject')}>
                    Reject
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const SuperAdminClients = () => {
  const { data, loading, refetch } = useSuperFetch<{ clients: ClientLgu[] }>(API_ENDPOINTS.SUPER_ADMIN.CLIENTS, 'clients');
  const [coordinateDrafts, setCoordinateDrafts] = useState<Record<string, { lat: string; lng: string; key: string }>>({});

  useEffect(() => {
    const next: Record<string, { lat: string; lng: string; key: string }> = {};
    (data?.clients ?? []).forEach(client => {
      next[client.id] = {
        lat: client.weatherLatitude?.toString() ?? '',
        lng: client.weatherLongitude?.toString() ?? '',
        key: client.weatherLocationKey,
      };
    });
    setCoordinateDrafts(next);
  }, [data]);

  const saveClient = async (client: ClientLgu) => {
    const draft = coordinateDrafts[client.id];
    const token = await getToken();
    await axios.patch(
      API_ENDPOINTS.SUPER_ADMIN.UPDATE_CLIENT(client.id),
      {
        weatherLocationKey: draft?.key || client.weatherLocationKey,
        weatherLatitude: draft?.lat ? Number(draft.lat) : null,
        weatherLongitude: draft?.lng ? Number(draft.lng) : null,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    addToast({ title: 'Client updated', color: 'success' });
    refetch();
  };

  const setStatus = async (client: ClientLgu, status: 'active' | 'inactive') => {
    const token = await getToken();
    const endpoint =
      status === 'active'
        ? API_ENDPOINTS.SUPER_ADMIN.ACTIVATE_CLIENT(client.id)
        : API_ENDPOINTS.SUPER_ADMIN.DEACTIVATE_CLIENT(client.id);
    await axios.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
    addToast({ title: status === 'active' ? 'Client activated' : 'Client deactivated', color: 'success' });
    refetch();
  };

  return (
    <div className="w-full space-y-5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-sm text-default-500">Manage LGU coverage activation and weather setup.</p>
        </div>
        <Button variant="flat" onPress={refetch} isLoading={loading}>
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {(data?.clients ?? []).map(client => (
          <Card key={client.id} className="border border-default-200">
            <CardBody className="gap-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{client.name}</h2>
                    <Chip size="sm" color={statusColor(client.status) as any}>
                      {client.status}
                    </Chip>
                  </div>
                  <p className="text-sm text-default-500">
                    {client.municipalityName}, {client.provinceName} • {client.barangays.length} barangays
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="flat" onPress={() => saveClient(client)}>
                    Save
                  </Button>
                  {client.status !== 'active' ? (
                    <Button color="success" onPress={() => setStatus(client, 'active')}>
                      Activate
                    </Button>
                  ) : (
                    <Button color="danger" variant="flat" onPress={() => setStatus(client, 'inactive')}>
                      Deactivate
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Input
                  label="Weather Key"
                  value={coordinateDrafts[client.id]?.key || ''}
                  onValueChange={value =>
                    setCoordinateDrafts(prev => ({
                      ...prev,
                      [client.id]: { ...(prev[client.id] || { lat: '', lng: '', key: '' }), key: value },
                    }))
                  }
                />
                <Input
                  label="Weather Latitude"
                  value={coordinateDrafts[client.id]?.lat || ''}
                  onValueChange={value =>
                    setCoordinateDrafts(prev => ({
                      ...prev,
                      [client.id]: { ...(prev[client.id] || { lat: '', lng: '', key: '' }), lat: value },
                    }))
                  }
                />
                <Input
                  label="Weather Longitude"
                  value={coordinateDrafts[client.id]?.lng || ''}
                  onValueChange={value =>
                    setCoordinateDrafts(prev => ({
                      ...prev,
                      [client.id]: { ...(prev[client.id] || { lat: '', lng: '', key: '' }), lng: value },
                    }))
                  }
                />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const SuperAdminAdmins = () => {
  const { data, loading, refetch } = useSuperFetch<{ admins: AdminUser[] }>(API_ENDPOINTS.SUPER_ADMIN.ADMINS, 'admins');

  return (
    <div className="w-full space-y-5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LGU Admins</h1>
          <p className="text-sm text-default-500">View current admin access and client assignments.</p>
        </div>
        <Button variant="flat" onPress={refetch} isLoading={loading}>
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {(data?.admins ?? []).map(admin => (
          <Card key={admin.uid} className="border border-default-200">
            <CardBody className="flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-primary" />
                <div>
                  <p className="font-semibold">{admin.email}</p>
                  <p className="text-sm text-default-500">{admin.clientName || admin.clientId || 'System-wide'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Chip size="sm" variant="flat">
                  {admin.role}
                </Chip>
                <Chip size="sm" color={statusColor(admin.status) as any}>
                  {admin.status}
                </Chip>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const SuperAdminSystemStatus = () => {
  const { data, loading, refetch } = useSuperFetch<SystemStatus>(
    API_ENDPOINTS.SUPER_ADMIN.SYSTEM_STATUS,
    'system status'
  );
  const checks = data
    ? [
        { label: 'Backend', value: data.status, ok: data.status === 'healthy' },
        { label: 'Firebase', value: data.firebase.connected ? 'connected' : 'disconnected', ok: data.firebase.connected },
        { label: 'PSGC API', value: data.psgc.status, ok: data.psgc.configured },
        { label: 'Weather API', value: data.weather.status, ok: data.weather.configured },
        { label: 'Earthquake Monitor', value: data.earthquake.status, ok: data.earthquake.status === 'configured' },
      ]
    : [];

  return (
    <div className="w-full space-y-5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Status</h1>
          <p className="text-sm text-default-500">Backend, API, and scheduled-service readiness.</p>
        </div>
        <Button variant="flat" onPress={refetch} isLoading={loading}>
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {checks.map(check => (
          <Card key={check.label} className="border border-default-200">
            <CardBody className="flex-row items-center justify-between">
              <div>
                <p className="text-sm text-default-500">{check.label}</p>
                <p className="text-lg font-semibold">{check.value}</p>
              </div>
              <Chip color={check.ok ? 'success' : 'danger'}>{check.ok ? 'OK' : 'Needs setup'}</Chip>
            </CardBody>
          </Card>
        ))}
      </div>
      {data && (
        <Card className="border border-default-200">
          <CardBody className="text-sm text-default-500">
            <p>Last checked: {new Date(data.timestamp).toLocaleString()}</p>
            <p>Uptime: {Math.round(data.backend.uptime)} seconds</p>
            <p>PSGC cache entries: {data.psgc.cacheEntries}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
