import { API_ENDPOINTS } from '@/config/endPoints';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type { SystemStatus } from '@/pages/contents/SuperAdmin/types';
import { Button, Card, CardBody, Chip } from '@heroui/react';

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
