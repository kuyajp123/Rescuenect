import { API_ENDPOINTS } from '@/config/endPoints';
import { OperationLogDiff } from '@/pages/contents/SuperAdmin/components/OperationLogDiff';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type { OperationLog } from '@/pages/contents/SuperAdmin/types';
import { formatDateTime, statusColor } from '@/pages/contents/SuperAdmin/utils';
import {
  Card,
  CardBody,
  Chip,
  Button,
  Input,
  Pagination,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { RefreshCw, Search } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  lgu_admin: 'LGU Admin',
  system: 'System',
};

const formatTargetType = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, match => match.toUpperCase());

export const SuperAdminLogs = () => {
  const { data, loading, refetch } = useSuperFetch<{ logs: OperationLog[] }>(
    API_ENDPOINTS.SUPER_ADMIN.LOGS,
    'operation logs'
  );
  const logs = data?.logs ?? [];
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OperationLog['status']>('all');
  const [targetFilter, setTargetFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const targetTypes = useMemo(
    () => Array.from(new Set(logs.map(log => log.targetType).filter(Boolean))).sort(),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();

    return logs.filter(log => {
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;
      if (targetFilter !== 'all' && log.targetType !== targetFilter) return false;
      if (!term) return true;

      return [
        log.actionLabel,
        log.action,
        log.message,
        log.actorEmail,
        log.actorUid,
        log.clientName,
        log.clientId,
        log.targetName,
        log.targetId,
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term));
    });
  }, [logs, searchQuery, statusFilter, targetFilter]);

  const pages = Math.max(1, Math.ceil(filteredLogs.length / rowsPerPage));
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredLogs.slice(start, start + rowsPerPage);
  }, [filteredLogs, page, rowsPerPage]);
  const firstRow = filteredLogs.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const lastRow = Math.min(page * rowsPerPage, filteredLogs.length);

  const handleRowsPerPageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(event.target.value));
    setPage(1);
  };

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, targetFilter]);

  const bottomContent = (
    <div className="flex flex-col gap-3 px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-small text-default-400">
        Showing {firstRow}-{lastRow} of {filteredLogs.length} logs
      </span>
      <Pagination showControls showShadow color="primary" page={page} total={pages} onChange={setPage} />
      <label className="flex items-center gap-2 text-small text-default-400">
        Rows per page:
        <select
          className="rounded-md border border-default-200 bg-transparent px-2 py-1 text-small text-default-600 outline-none"
          value={rowsPerPage}
          onChange={handleRowsPerPageChange}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </label>
    </div>
  );

  return (
    <div className="w-full space-y-5 p-4">
      <div>
        <h1 className="text-3xl font-bold">Logs</h1>
        <p className="text-sm text-default-500">Audit trail for Super Admin and LGU admin operations.</p>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <Input
            className="max-w-xl"
            placeholder="Search by action, actor, client, or target"
            startContent={<Search size={16} />}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <Select
            className="max-w-xs"
            label="Status"
            selectedKeys={[statusFilter]}
            onChange={event => setStatusFilter((event.target.value || 'all') as 'all' | OperationLog['status'])}
          >
            <SelectItem key="all">All statuses</SelectItem>
            <SelectItem key="success">Success</SelectItem>
            <SelectItem key="failed">Failed</SelectItem>
          </Select>
          <Select
            className="max-w-xs"
            label="Target"
            selectedKeys={[targetFilter]}
            onChange={event => setTargetFilter(event.target.value || 'all')}
          >
            {['all', ...targetTypes].map(type => (
              <SelectItem key={type}>{type === 'all' ? 'All targets' : formatTargetType(type)}</SelectItem>
            ))}
          </Select>
        </div>
        <Button isIconOnly variant="flat" aria-label="Refresh logs" isLoading={loading} onPress={refetch}>
          <RefreshCw size={16} />
        </Button>
      </div>

      <Card className="border border-default-200">
        <CardBody className="gap-3">
          <div className="max-h-[650px] overflow-auto">
            <Table aria-label="Operation logs" isHeaderSticky removeWrapper>
              <TableHeader>
                <TableColumn>Date</TableColumn>
                <TableColumn>Actor</TableColumn>
                <TableColumn>Action</TableColumn>
                <TableColumn>Target</TableColumn>
                <TableColumn>Client</TableColumn>
                <TableColumn>Changes</TableColumn>
                <TableColumn>Status</TableColumn>
              </TableHeader>
              <TableBody emptyContent={loading ? 'Loading logs...' : 'No operation logs found.'}>
                {paginatedLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDateTime(log.createdAt || log.timestamp)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="max-w-[220px] truncate font-medium">{log.actorEmail || log.actorUid}</p>
                        <p className="text-xs text-default-400">{ROLE_LABELS[log.actorRole] || log.actorRole}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{log.actionLabel}</p>
                        <p className="max-w-[260px] whitespace-normal text-xs text-default-400">{log.message}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{log.targetName || log.targetId || formatTargetType(log.targetType)}</p>
                        <p className="text-xs text-default-400">{formatTargetType(log.targetType)}</p>
                      </div>
                    </TableCell>
                    <TableCell>{log.clientName || log.clientId || 'System'}</TableCell>
                    <TableCell>
                      <OperationLogDiff log={log} />
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" color={statusColor(log.status) as any}>
                        {log.status}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {bottomContent}
        </CardBody>
      </Card>
    </div>
  );
};
