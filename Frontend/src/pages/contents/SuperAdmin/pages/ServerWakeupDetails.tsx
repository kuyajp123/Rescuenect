import { API_ENDPOINTS } from '@/config/endPoints';
import {
  InfoTile,
  LogList,
  softPanelCardClass,
  softSurfaceClass,
} from '@/pages/contents/SuperAdmin/components/SupabaseMonitorUi';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type { ServerWakeupStatus } from '@/pages/contents/SuperAdmin/types';
import { formatDateTime, getToken } from '@/pages/contents/SuperAdmin/utils';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Switch,
  Tooltip,
  addToast,
} from '@heroui/react';
import axios from 'axios';
import { ArrowLeft, Play, RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const ServerWakeupDetails = () => {
  const navigate = useNavigate();
  const { data, loading, refetch } = useSuperFetch<ServerWakeupStatus>(
    API_ENDPOINTS.SUPER_ADMIN.SERVER_WAKEUP,
    'server wakeup status',
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const updateWakeup = async (enabled: boolean) => {
    try {
      setIsUpdating(true);
      const token = await getToken();
      await axios.patch(
        API_ENDPOINTS.SUPER_ADMIN.SERVER_WAKEUP,
        { enabled },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      addToast({
        title: enabled ? 'Server wakeup enabled' : 'Server wakeup disabled',
        color: 'success',
      });
      refetch();
    } catch (error) {
      addToast({
        title: 'Update failed',
        description: axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to update server wakeup',
        color: 'danger',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const runWakeup = async () => {
    try {
      setIsRunning(true);
      const token = await getToken();
      await axios.post(API_ENDPOINTS.SUPER_ADMIN.RUN_SERVER_WAKEUP, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      addToast({ title: 'Server wakeup triggered', color: 'success' });
      refetch();
    } catch (error) {
      addToast({
        title: 'Run failed',
        description: axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to run server wakeup',
        color: 'danger',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const summary = data?.summary;

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
                  Server Wakeup
                </h1>
                <Chip
                  color={data?.enabled ? 'success' : 'default'}
                  variant="flat"
                >
                  {data?.enabled ? 'Enabled' : 'Disabled'}
                </Chip>
                {data?.setupRequired && (
                  <Chip color="warning" variant="flat">
                    Setup required
                  </Chip>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fixed 13-minute Supabase schedule for keeping the Render backend
                warm
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content="Run server wakeup now">
              <Button
                color="primary"
                variant="flat"
                startContent={<Play size={16} />}
                isLoading={isRunning}
                onPress={runWakeup}
              >
                Run Now
              </Button>
            </Tooltip>
            <Tooltip content="Refresh server wakeup status">
              <Button
                isIconOnly
                variant="flat"
                onPress={refetch}
                isLoading={loading}
                aria-label="Refresh wakeup status"
              >
                <RefreshCcw size={18} />
              </Button>
            </Tooltip>
          </div>
        </div>

        <Card className={softPanelCardClass}>
          <CardBody className="gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Wakeup Schedule
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Render sleeps after about 15 minutes of inactivity, so this
                  remains fixed at 13 minutes.
                </p>
              </div>
              <Switch
                isSelected={Boolean(data?.enabled)}
                isDisabled={isUpdating || Boolean(data?.setupRequired)}
                onValueChange={updateWakeup}
                classNames={{
                  label: 'font-semibold text-gray-900 dark:text-gray-100',
                }}
              >
                {data?.enabled ? 'Enabled' : 'Disabled'}
              </Switch>
            </div>
            {data?.setupRequired && (
              <div className="rounded-xl bg-warning-50 p-4 text-sm text-warning-700 dark:bg-warning-900/20 dark:text-warning-300">
                {data.message ||
                  'Run the server wakeup Supabase migration before enabling this schedule.'}
              </div>
            )}
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoTile
            label="Interval"
            value={`${data?.intervalMinutes ?? 13} minutes`}
            helper={data?.cron || '*/13 * * * *'}
          />
          <InfoTile
            label="Backend URL"
            value={
              <span className="break-all text-base leading-snug">
                {data?.backendUrl || '-'}
              </span>
            }
            helper="Render backend target"
          />
          <InfoTile
            label="Recent Runs"
            value={summary?.recentInvocations ?? 0}
            helper="Supabase function logs"
          />
          <InfoTile
            label="Recent Errors"
            value={summary?.recentErrors ?? 0}
            helper={summary?.lastErrorMessage || 'No recent error'}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className={softPanelCardClass}>
            <CardHeader className="pb-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Details
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current schedule configuration
                </p>
              </div>
            </CardHeader>
            <CardBody className="gap-3 text-sm">
              <div
                className={`flex items-center justify-between gap-3 ${softSurfaceClass}`}
              >
                <span className="text-gray-500">Job name</span>
                <span className="max-w-[65%] break-all text-right font-medium">
                  {data?.jobName || '-'}
                </span>
              </div>
              <div
                className={`flex items-center justify-between gap-3 ${softSurfaceClass}`}
              >
                <span className="text-gray-500">Job ID</span>
                <span className="font-medium">
                  {data?.jobId ?? 'Not scheduled'}
                </span>
              </div>
              <div
                className={`flex items-center justify-between gap-3 ${softSurfaceClass}`}
              >
                <span className="text-gray-500">RPC available</span>
                <Chip
                  size="sm"
                  color={data?.rpcAvailable ? 'success' : 'warning'}
                  variant="flat"
                >
                  {data?.rpcAvailable ? 'Ready' : 'Needs setup'}
                </Chip>
              </div>
              <div
                className={`flex items-center justify-between gap-3 ${softSurfaceClass}`}
              >
                <span className="text-gray-500">Last run</span>
                <span className="font-medium">
                  {formatDateTime(summary?.lastInvocationAt)}
                </span>
              </div>
              <div className={softSurfaceClass}>
                <p className="text-gray-500">Endpoints</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(data?.endpoints ?? ['/health']).map((endpoint) => (
                    <Chip key={endpoint} size="sm" variant="flat">
                      {endpoint}
                    </Chip>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className={softPanelCardClass}>
            <CardHeader className="pb-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Latest Function Logs
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Latest server-wakeup function activity from the last 24 hours,
                  up to 100 rows
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <LogList logs={data?.logs ?? []} maxHeightClass="max-h-[520px]" />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
