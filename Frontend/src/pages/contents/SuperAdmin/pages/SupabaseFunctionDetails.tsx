import { API_ENDPOINTS } from '@/config/endPoints';
import {
  InfoTile,
  LogList,
  MonitorStatusChip,
  softPanelCardClass,
  softSurfaceClass,
} from '@/pages/contents/SuperAdmin/components/SupabaseMonitorUi';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type { SupabaseFunctionDetail } from '@/pages/contents/SuperAdmin/types';
import { formatDateTime } from '@/pages/contents/SuperAdmin/utils';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Tooltip,
} from '@heroui/react';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export const SupabaseFunctionDetails = () => {
  const navigate = useNavigate();
  const { slug = '' } = useParams();
  const { data, loading, refetch } = useSuperFetch<SupabaseFunctionDetail>(
    API_ENDPOINTS.SUPER_ADMIN.SUPABASE_FUNCTION(slug),
    'Supabase function details',
  );
  const fn = data?.function;
  const summary = data?.summary;
  const analyticsResult = data?.analytics?.result;

  return (
    <div className="h-full w-full overflow-auto p-4">
      <div className="mx-auto w-full max-w-[1510px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Button
              variant="flat"
              startContent={<ArrowLeft size={16} />}
              onPress={() => navigate('/super')}
            >
              Back to Overview
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {fn?.slug || slug}
                </h1>
                <MonitorStatusChip status={data?.status} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Supabase Edge Function details and recent logs
              </p>
            </div>
          </div>
          <Tooltip content="Refresh function details">
            <Button
              isIconOnly
              variant="flat"
              onPress={refetch}
              isLoading={loading}
              aria-label="Refresh function details"
            >
              <RefreshCcw size={18} />
            </Button>
          </Tooltip>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoTile
            label="Platform Status"
            value={fn?.platformStatus || 'Unknown'}
            helper={`Version ${fn?.version ?? '-'}`}
          />
          <InfoTile
            label="Recent Invocations"
            value={summary?.recentInvocations ?? 0}
            helper="Last 24 hours when logs are available"
          />
          <InfoTile
            label="Recent Errors"
            value={summary?.recentErrors ?? 0}
            helper="4xx and 5xx responses"
          />
          <InfoTile
            label="Last Status"
            value={summary?.lastStatusCode ?? 'No run'}
            helper={formatDateTime(summary?.lastInvocationAt)}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className={softPanelCardClass}>
            <CardHeader className="pb-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Configuration
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Deployment metadata from Supabase
                </p>
              </div>
            </CardHeader>
            <CardBody className="gap-4">
              <div className="grid gap-3 text-sm">
                <div
                  className={`flex items-center justify-between gap-3 ${softSurfaceClass}`}
                >
                  <span className="text-gray-500">Function ID</span>
                  <span className="max-w-[65%] break-all text-right font-medium">
                    {fn?.id || 'Not available'}
                  </span>
                </div>
                <div
                  className={`flex items-center justify-between gap-3 ${softSurfaceClass}`}
                >
                  <span className="text-gray-500">JWT Verification</span>
                  <Chip
                    size="sm"
                    color={fn?.verifyJwt ? 'success' : 'warning'}
                    variant="flat"
                  >
                    {fn?.verifyJwt ? 'Enabled' : 'Disabled'}
                  </Chip>
                </div>
                <div
                  className={`flex items-center justify-between gap-3 ${softSurfaceClass}`}
                >
                  <span className="text-gray-500">Entrypoint</span>
                  <span className="max-w-[65%] break-all text-right font-medium">
                    {fn?.entrypointPath || 'Default'}
                  </span>
                </div>
                <div
                  className={`flex items-center justify-between gap-3 ${softSurfaceClass}`}
                >
                  <span className="text-gray-500">Updated</span>
                  <span className="font-medium">
                    {formatDateTime(fn?.updatedAt)}
                  </span>
                </div>
                <div
                  className={`flex items-center justify-between gap-3 ${softSurfaceClass}`}
                >
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium">
                    {formatDateTime(fn?.createdAt)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className={softPanelCardClass}>
            <CardHeader className="pb-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Analytics
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Supabase function combined stats, when available
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <pre className="max-h-[360px] overflow-auto rounded-xl bg-default-100/70 p-4 text-xs text-gray-700 dark:bg-white/[0.04] dark:text-gray-300">
                {JSON.stringify(
                  analyticsResult ?? data?.analytics ?? 'No analytics returned',
                  null,
                  2,
                )}
              </pre>
            </CardBody>
          </Card>
        </div>

        <Card className={softPanelCardClass}>
          <CardHeader className="pb-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Logs
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Latest function requests from the last 24 hours, up to 100 rows
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <LogList logs={data?.logs ?? []} maxHeightClass="max-h-[520px]" />
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
