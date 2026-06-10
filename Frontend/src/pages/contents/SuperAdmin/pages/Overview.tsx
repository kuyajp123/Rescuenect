import { API_ENDPOINTS } from '@/config/endPoints';
import { MonitorStatusChip } from '@/pages/contents/SuperAdmin/components/SupabaseMonitorUi';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type {
  SupabaseFunctionMonitor,
  SupabaseMonitoringOverview,
  SupabaseStorageMonitor,
  SuperAdminOverview as SuperAdminOverviewData,
} from '@/pages/contents/SuperAdmin/types';
import { formatDateTime } from '@/pages/contents/SuperAdmin/utils';
import { useAuth } from '@/stores/useAuth';
import { Button, Card, CardBody, CardHeader, Chip, Tooltip as HeroTooltip } from '@heroui/react';
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Database,
  HeartPulse,
  RefreshCcw,
  ServerCog,
  UsersRound,
} from 'lucide-react';
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
const SOFT_GRID = '#d1d5db';
const softCardShadow =
  'shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.32)]';
const softCardHoverShadow =
  'hover:shadow-[0_16px_42px_rgba(15,23,42,0.12)] dark:hover:shadow-[0_22px_52px_rgba(0,0,0,0.42)]';
const softSurfaceClass =
  'rounded-xl bg-default-100/70 p-3 transition-colors hover:bg-default-200/70 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]';

const issueCount = (items: Array<{ status?: string }>) =>
  items.filter(item => item.status === 'warning' || item.status === 'error').length;

const okCount = (items: Array<{ status?: string }>) => items.filter(item => item.status === 'ok').length;

const dashboardCardClass = `group border-none bg-content1 ${softCardShadow} ${softCardHoverShadow} transition-all duration-300 hover:-translate-y-1`;
const panelCardClass = `border-none bg-content1 ${softCardShadow} ${softCardHoverShadow} transition-shadow duration-300`;

const ChartGrid = () => <CartesianGrid stroke={SOFT_GRID} strokeOpacity={0.35} vertical={false} />;

const renderFunctionRow = (item: SupabaseFunctionMonitor) => (
  <Link
    key={item.slug}
    to={`/super/supabase/functions/${encodeURIComponent(item.slug)}`}
    className={`flex items-center justify-between gap-3 ${softSurfaceClass}`}
  >
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{item.slug}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {item.recentInvocations} runs / {item.recentErrors} errors
      </p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <MonitorStatusChip status={item.status} />
      <ChevronRight size={16} className="text-gray-400" />
    </div>
  </Link>
);

const renderBucketRow = (item: SupabaseStorageMonitor) => (
  <Link
    key={item.name}
    to={`/super/supabase/storage/${encodeURIComponent(item.name)}`}
    className={`flex items-center justify-between gap-3 ${softSurfaceClass}`}
  >
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {item.public ? 'Public' : 'Private'} / {item.recentErrors} recent errors
      </p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <MonitorStatusChip status={item.status} />
      <ChevronRight size={16} className="text-gray-400" />
    </div>
  </Link>
);

const SupabaseSummary = ({ supabase }: { supabase?: SupabaseMonitoringOverview }) => {
  const functions = supabase?.functions ?? [];
  const storage = supabase?.storage ?? [];
  const wakeup = supabase?.serverWakeup;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card className={panelCardClass}>
        <CardHeader className="pb-2">
          <div className="flex w-full items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edge Functions</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Individual Supabase function status</p>
            </div>
            <Chip size="sm" color={issueCount(functions) ? 'warning' : 'success'} variant="flat">
              {okCount(functions)}/{functions.length} OK
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="gap-3">
          {functions.length ? (
            <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">{functions.map(renderFunctionRow)}</div>
          ) : (
            <div className="rounded-xl bg-default-100/70 p-4 text-sm text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
              No functions returned. Check the Supabase Management API token.
            </div>
          )}
        </CardBody>
      </Card>

      <Card className={panelCardClass}>
        <CardHeader className="pb-2">
          <div className="flex w-full items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Storage Buckets</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Per-bucket reachability and logs</p>
            </div>
            <Chip size="sm" color={issueCount(storage) ? 'warning' : 'success'} variant="flat">
              {okCount(storage)}/{storage.length} OK
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="gap-3">
          {storage.length ? (
            <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">{storage.map(renderBucketRow)}</div>
          ) : (
            <div className="rounded-xl bg-default-100/70 p-4 text-sm text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
              No storage buckets returned.
            </div>
          )}
        </CardBody>
      </Card>

      <Card as={Link} to="/super/supabase/server-wakeup" className={dashboardCardClass}>
        <CardHeader className="pb-2">
          <div className="flex w-full items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Server Wakeup</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fixed 13-minute Render wake schedule</p>
            </div>
            <Chip size="sm" color={wakeup?.enabled ? 'success' : 'default'} variant="flat">
              {wakeup?.enabled ? 'Enabled' : 'Disabled'}
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="gap-4">
          <div className="rounded-xl bg-default-100/70 p-4 dark:bg-white/[0.04]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Backend target</p>
            <p className="mt-1 break-all text-sm font-semibold text-gray-900 dark:text-gray-100">
              {wakeup?.backendUrl || 'Not configured'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Interval</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {wakeup?.intervalMinutes ?? 13} min
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last run</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatDateTime(wakeup?.summary?.lastInvocationAt)}
              </p>
            </div>
          </div>
          {wakeup?.setupRequired && (
            <div className="flex items-start gap-2 rounded-xl bg-warning-50 p-3 text-sm text-warning-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>Wakeup control migration needs to be pushed.</span>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export const SuperAdminOverview = () => {
  const userData = useAuth(state => state.userData);
  const { data, loading, refetch } = useSuperFetch<SuperAdminOverviewData>(
    API_ENDPOINTS.SUPER_ADMIN.OVERVIEW,
    'overview',
    { cache: true, cacheKey: 'super-admin-overview' }
  );

  const summary = data?.summary;
  const system = data?.system;
  const supabase = data?.supabase;
  const cards = [
    {
      label: 'Pending Requests',
      value: summary?.lguRequests.pending ?? 0,
      change: 'Waiting for review',
      icon: Building2,
      to: '/super/requests',
      color: 'bg-blue-500/10 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Active Clients',
      value: summary?.clients.active ?? 0,
      change: `${summary?.clients.deletion_scheduled ?? 0} scheduled deletion`,
      icon: CheckCircle2,
      to: '/super/clients',
      color: 'bg-green-500/10 dark:bg-green-500/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Pending Proposals',
      value: summary?.changeRequests.pending ?? 0,
      change: 'Client setup changes',
      icon: Activity,
      to: '/super/client-requests',
      color: 'bg-orange-500/10 dark:bg-orange-500/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      label: 'LGU Admins',
      value: summary?.lguAdmins ?? 0,
      change: `${summary?.activeResidents ?? 0} active residents`,
      icon: UsersRound,
      to: '/super/admins',
      color: 'bg-purple-500/10 dark:bg-purple-500/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  const checks = system
    ? [
        { label: 'Backend', value: system.status, ok: system.status === 'healthy', icon: ServerCog },
        {
          label: 'Firebase',
          value: system.firebase.connected ? 'connected' : 'disconnected',
          ok: system.firebase.connected,
          icon: Database,
        },
        { label: 'PSGC API', value: system.psgc.status, ok: system.psgc.configured, icon: Cloud },
        { label: 'Weather API', value: system.weather.status, ok: system.weather.configured, icon: Cloud },
      ]
    : [];

  return (
    <div className="h-full w-full space-y-8 overflow-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">Super Admin Overview</h1>
          <p className="text-gray-600 dark:text-gray-400">Signed in as {userData?.email}</p>
        </div>
        <HeroTooltip content="Refresh overview data" placement="top">
          <Button isIconOnly variant="flat" onPress={refetch} isLoading={loading} aria-label="Refresh overview">
            <RefreshCcw size={18} />
          </Button>
        </HeroTooltip>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map(card => (
          <Card key={card.label} as={Link} to={card.to} className={dashboardCardClass}>
            <CardBody className="p-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">{card.label}</p>
                  <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</h3>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{card.change}</span>
                </div>
                <div className={`${card.color} rounded-xl p-3 transition-transform duration-300 group-hover:scale-110`}>
                  <card.icon className={card.iconColor} size={24} />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className={panelCardClass}>
          <CardHeader className="pb-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Client Status</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Draft, active, and inactive LGU clients</p>
            </div>
          </CardHeader>
          <CardBody className="pt-4">
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

        <Card className={panelCardClass}>
          <CardHeader className="pb-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">System Health</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Backend, APIs, and scheduled-service readiness</p>
            </div>
          </CardHeader>
          <CardBody className="gap-3">
            {checks.map(check => (
              <div
                key={check.label}
                className={`flex items-center justify-between gap-3 ${softSurfaceClass}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-xl bg-primary-500/10 p-2 text-primary">
                    <check.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{check.label}</p>
                    <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{check.value}</p>
                  </div>
                </div>
                <Chip color={check.ok ? 'success' : 'danger'} variant="flat">
                  {check.ok ? 'OK' : 'Needs setup'}
                </Chip>
              </div>
            ))}
            {system && (
              <div className="flex items-center gap-2 pt-2 text-sm text-gray-500 dark:text-gray-400">
                <HeartPulse size={16} />
                <span>Last checked: {new Date(system.timestamp).toLocaleString()}</span>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {!supabase?.managementConfigured && (
        <div className="flex items-start gap-2 rounded-xl bg-warning-50 p-4 text-sm text-warning-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>
            Supabase function logs and deployment status need a backend Management API token. Storage checks can still
            use the service-role key when available.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className={panelCardClass}>
          <CardHeader className="pb-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">LGU Requests</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Request review queue by status</p>
            </div>
          </CardHeader>
          <CardBody className="pt-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.charts.lguRequestStatus ?? []}>
                  <ChartGrid />
                  <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis allowDecimals={false} stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(14, 165, 233, 0.08)' }} />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card className={panelCardClass}>
          <CardHeader className="pb-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Client Proposals</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">LGU-submitted changes waiting for review</p>
            </div>
          </CardHeader>
          <CardBody className="pt-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.charts.changeRequestStatus ?? []}>
                  <ChartGrid />
                  <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis allowDecimals={false} stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(34, 197, 94, 0.08)' }} />
                  <Bar dataKey="value" fill="#22c55e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <SupabaseSummary supabase={supabase} />
    </div>
  );
};
