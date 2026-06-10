import { API_ENDPOINTS } from '@/config/endPoints';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type { SuperAdminOverview as SuperAdminOverviewData } from '@/pages/contents/SuperAdmin/types';
import { useAuth } from '@/stores/useAuth';
import { Button, Card, CardBody, Chip, Tooltip as HeroTooltip } from '@heroui/react';
import { Activity, Building2, CheckCircle2, HeartPulse, RefreshCcw, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export const SuperAdminOverview = () => {
  const userData = useAuth(state => state.userData);
  const { data, loading, refetch } = useSuperFetch<SuperAdminOverviewData>(
    API_ENDPOINTS.SUPER_ADMIN.OVERVIEW,
    'overview'
  );

  const summary = data?.summary;
  const system = data?.system;
  const cards = [
    {
      label: 'Pending Requests',
      value: summary?.lguRequests.pending ?? 0,
      icon: Building2,
      to: '/super/requests',
    },
    { label: 'Active Clients', value: summary?.clients.active ?? 0, icon: CheckCircle2, to: '/super/clients' },
    {
      label: 'Pending Proposals',
      value: summary?.changeRequests.pending ?? 0,
      icon: Activity,
      to: '/super/client-requests',
    },
    { label: 'LGU Admins', value: summary?.lguAdmins ?? 0, icon: UsersRound, to: '/super/admins' },
  ];

  const checks = system
    ? [
        { label: 'Backend', value: system.status, ok: system.status === 'healthy' },
        {
          label: 'Firebase',
          value: system.firebase.connected ? 'connected' : 'disconnected',
          ok: system.firebase.connected,
        },
        { label: 'PSGC API', value: system.psgc.status, ok: system.psgc.configured },
        { label: 'Weather API', value: system.weather.status, ok: system.weather.configured },
        { label: 'Earthquake Monitor', value: system.earthquake.status, ok: system.earthquake.status === 'configured' },
      ]
    : [];

  return (
    <div className="w-full space-y-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Overview</h1>
          <p className="text-sm text-default-500">Signed in as {userData?.email}</p>
        </div>
        <HeroTooltip content="Refresh overview data" placement="top">
          <Button isIconOnly variant="flat" onPress={refetch} isLoading={loading} aria-label="Refresh overview">
            <RefreshCcw size={18} />
          </Button>
        </HeroTooltip>
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border border-default-200">
          <CardBody className="gap-4">
            <div>
              <h2 className="text-xl font-semibold">Client Status</h2>
              <p className="text-sm text-default-500">Draft, active, and inactive LGU clients.</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.charts.clientStatus ?? []}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={96}
                  >
                    {(data?.charts.clientStatus ?? []).map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200">
          <CardBody className="gap-4">
            <div>
              <h2 className="text-xl font-semibold">System Health</h2>
              <p className="text-sm text-default-500">Backend, API, and scheduled-service readiness.</p>
            </div>
            <div className="grid gap-3">
              {checks.map(check => (
                <div
                  key={check.label}
                  className="flex items-center justify-between rounded-lg border border-default-200 p-3"
                >
                  <div>
                    <p className="text-sm text-default-500">{check.label}</p>
                    <p className="font-semibold">{check.value}</p>
                  </div>
                  <Chip color={check.ok ? 'success' : 'danger'}>{check.ok ? 'OK' : 'Needs setup'}</Chip>
                </div>
              ))}
            </div>
            {system && (
              <div className="flex items-center gap-2 text-sm text-default-500">
                <HeartPulse size={16} />
                <span>Last checked: {new Date(system.timestamp).toLocaleString()}</span>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border border-default-200">
          <CardBody className="gap-4">
            <div>
              <h2 className="text-xl font-semibold">LGU Requests</h2>
              <p className="text-sm text-default-500">Request review queue by status.</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.charts.lguRequestStatus ?? []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200">
          <CardBody className="gap-4">
            <div>
              <h2 className="text-xl font-semibold">Client Proposals</h2>
              <p className="text-sm text-default-500">LGU-submitted changes waiting for review.</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.charts.changeRequestStatus ?? []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
