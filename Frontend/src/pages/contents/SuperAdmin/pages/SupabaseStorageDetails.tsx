import { API_ENDPOINTS } from '@/config/endPoints';
import {
  InfoTile,
  LogList,
  MonitorStatusChip,
  softPanelCardClass,
  softSurfaceClass,
} from '@/pages/contents/SuperAdmin/components/SupabaseMonitorUi';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type { SupabaseStorageDetail } from '@/pages/contents/SuperAdmin/types';
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

const asText = (value: unknown, fallback = 'Not available') =>
  value === null || value === undefined || value === ''
    ? fallback
    : String(value);

export const SupabaseStorageDetails = () => {
  const navigate = useNavigate();
  const { bucket = '' } = useParams();
  const { data, loading, refetch } = useSuperFetch<SupabaseStorageDetail>(
    API_ENDPOINTS.SUPER_ADMIN.SUPABASE_STORAGE_BUCKET(bucket),
    'Supabase storage details',
  );
  const bucketData = data?.bucket;
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
                  {bucket}
                </h1>
                <MonitorStatusChip status={data?.status} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Supabase Storage bucket details and recent logs
              </p>
            </div>
          </div>
          <Tooltip content="Refresh storage details">
            <Button
              isIconOnly
              variant="flat"
              onPress={refetch}
              isLoading={loading}
              aria-label="Refresh storage details"
            >
              <RefreshCcw size={18} />
            </Button>
          </Tooltip>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoTile
            label="Reachability"
            value={data?.reachable ? 'Reachable' : 'Failed'}
            helper={data?.checkError || 'Service-role list check'}
          />
          <InfoTile
            label="Recent Requests"
            value={summary?.recentRequests ?? 0}
            helper="Last 24 hours when logs are available"
          />
          <InfoTile
            label="Recent Errors"
            value={summary?.recentErrors ?? 0}
            helper="4xx and 5xx responses"
          />
          <InfoTile
            label="Last Status"
            value={summary?.lastStatusCode ?? 'No request'}
            helper={formatDateTime(summary?.lastRequestAt)}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className={softPanelCardClass}>
            <CardHeader className="pb-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Bucket Configuration
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Visibility and bucket metadata
                </p>
              </div>
            </CardHeader>
            <CardBody className="gap-4">
              <div className="grid gap-3 text-sm">
                <div
                  className={`flex items-center justify-between gap-3 ${softSurfaceClass}`}
                >
                  <span className="text-gray-500">Bucket ID</span>
                  <span className="max-w-[65%] break-all text-right font-medium">
                    {asText(bucketData?.id, bucket)}
                  </span>
                </div>
                <div
                  className={`flex items-center justify-between gap-3 ${softSurfaceClass}`}
                >
                  <span className="text-gray-500">Access</span>
                  <Chip
                    size="sm"
                    color={bucketData?.public ? 'success' : 'default'}
                    variant="flat"
                  >
                    {bucketData?.public ? 'Public' : 'Private'}
                  </Chip>
                </div>
                <div
                  className={`flex items-center justify-between gap-3 ${softSurfaceClass}`}
                >
                  <span className="text-gray-500">Owner</span>
                  <span className="max-w-[65%] break-all text-right font-medium">
                    {asText(bucketData?.owner)}
                  </span>
                </div>
                <div
                  className={`flex items-center justify-between gap-3 ${softSurfaceClass}`}
                >
                  <span className="text-gray-500">Updated</span>
                  <span className="font-medium">
                    {formatDateTime(
                      bucketData?.updated_at || bucketData?.updatedAt,
                    )}
                  </span>
                </div>
                <div
                  className={`flex items-center justify-between gap-3 ${softSurfaceClass}`}
                >
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium">
                    {formatDateTime(
                      bucketData?.created_at || bucketData?.createdAt,
                    )}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className={softPanelCardClass}>
            <CardHeader className="pb-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Storage Config
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Project-level storage settings from Supabase
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <pre className="max-h-[360px] overflow-auto rounded-xl bg-default-100/70 p-4 text-xs text-gray-700 dark:bg-white/[0.04] dark:text-gray-300">
                {JSON.stringify(
                  data?.storageConfig ?? 'No storage config returned',
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
                Latest storage requests from the last 24 hours, up to 100 rows
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
