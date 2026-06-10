import type {
  SupabaseHealthStatus,
  SupabaseLogRow,
} from '@/pages/contents/SuperAdmin/types';
import { formatDateTime } from '@/pages/contents/SuperAdmin/utils';
import { Card, CardBody, Chip } from '@heroui/react';
import type { ChipProps } from '@heroui/react';
import type { ReactNode } from 'react';

export const softCardShadow =
  'shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.32)]';
export const softCardHoverShadow =
  'hover:shadow-[0_16px_42px_rgba(15,23,42,0.12)] dark:hover:shadow-[0_22px_52px_rgba(0,0,0,0.42)]';
export const softPanelCardClass = `border-none bg-content1 ${softCardShadow} ${softCardHoverShadow} transition-shadow duration-300`;
export const softInteractiveCardClass = `group border-none bg-content1 ${softCardShadow} ${softCardHoverShadow} transition-all duration-300 hover:-translate-y-1`;
export const softSurfaceClass =
  'rounded-xl bg-default-100/70 p-3 transition-colors hover:bg-default-200/70 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]';

export const monitorStatusColor = (
  status?: SupabaseHealthStatus | string,
): ChipProps['color'] => {
  if (status === 'ok' || status === 'ACTIVE_HEALTHY') return 'success';
  if (status === 'warning' || status === 'COMING_UP' || status === 'unknown')
    return 'warning';
  if (status === 'error' || status === 'UNHEALTHY') return 'danger';
  return 'default';
};

export const monitorStatusLabel = (status?: SupabaseHealthStatus | string) => {
  if (status === 'unknown') return 'No recent status';
  if (status === 'not_configured') return 'Not configured';
  if (!status) return 'Unknown';
  return status
    .split('_')
    .join(' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

export const MonitorStatusChip = ({
  status,
}: {
  status?: SupabaseHealthStatus | string;
}) => (
  <Chip size="sm" color={monitorStatusColor(status)} variant="flat">
    {monitorStatusLabel(status)}
  </Chip>
);

const logStatusColor = (status?: number | string): ChipProps['color'] => {
  const statusCode = Number(status);
  if (!Number.isFinite(statusCode)) return 'default';
  if (statusCode >= 500) return 'danger';
  if (statusCode >= 400) return 'warning';
  return 'success';
};

const logStatusValue = (log: SupabaseLogRow): string | number | undefined => {
  if (log.status_code) return log.status_code;

  const message = String(log.event_message || '');
  const statusMatch =
    message.match(/\|\s*([1-5]\d{2})\s*\|/) ||
    message.match(/\bHTTP\s+([1-5]\d{2})\b/i) ||
    message.match(/\bstatus(?:_code)?\s*[:=]\s*([1-5]\d{2})\b/i);
  return statusMatch?.[1];
};

export const InfoTile = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
}) => (
  <Card className={softPanelCardClass}>
    <CardBody className="p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </div>
      {helper && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {helper}
        </p>
      )}
    </CardBody>
  </Card>
);

export const LogList = ({
  logs,
  maxHeightClass = 'max-h-[480px]',
  limit = 100,
}: {
  logs: SupabaseLogRow[];
  maxHeightClass?: string;
  limit?: number;
}) => {
  const visibleLogs = logs.slice(0, limit);

  return (
    <div className={`${maxHeightClass} overflow-y-auto pr-1`}>
      <div className="space-y-3">
        {visibleLogs.length === 0 ? (
          <div className="rounded-xl bg-default-100/70 p-4 text-sm text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
            No recent logs found for this item.
          </div>
        ) : (
          visibleLogs.map((log, index) => {
            const status = logStatusValue(log);

            return (
              <div
                key={`${log.timestamp || 'log'}-${index}`}
                className="rounded-xl bg-default-100/70 p-4 dark:bg-white/[0.04]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {status ? 'HTTP response' : 'Log event'}
                    </p>
                    {status && (
                      <Chip
                        size="sm"
                        color={logStatusColor(status)}
                        variant="flat"
                      >
                        {status}
                      </Chip>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(log.timestamp)}
                  </p>
                </div>
                {log.path && (
                  <p className="mt-1 break-all text-xs text-gray-500 dark:text-gray-400">
                    {log.path}
                  </p>
                )}
                {log.event_message && (
                  <p className="mt-2 break-words text-sm text-gray-600 dark:text-gray-300">
                    {log.event_message}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
