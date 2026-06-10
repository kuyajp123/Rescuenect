import { API_ENDPOINTS } from '@/config/endPoints';
import { ClientDeleteModal } from '@/pages/contents/SuperAdmin/components/ClientDeleteModal';
import { ClientLogoAvatar } from '@/pages/contents/SuperAdmin/components/ClientLogoAvatar';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type { AdminUser, ClientDeletionPreview, ClientLgu } from '@/pages/contents/SuperAdmin/types';
import { getToken, statusColor } from '@/pages/contents/SuperAdmin/utils';
import type { SortDescriptor } from '@heroui/react';
import {
  Button,
  Chip,
  Input,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  addToast,
} from '@heroui/react';
import axios from 'axios';
import { Archive as ArchiveIcon, RefreshCcw, Search, Settings, Trash2 } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const SuperAdminClients = () => {
  const { data, loading, refetch } = useSuperFetch<{ clients: ClientLgu[] }>(
    API_ENDPOINTS.SUPER_ADMIN.CLIENTS,
    'clients'
  );
  const { data: adminData, refetch: refetchAdmins } = useSuperFetch<{ admins: AdminUser[] }>(
    API_ENDPOINTS.SUPER_ADMIN.ADMINS,
    'client admins'
  );
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [clientToDelete, setClientToDelete] = useState<ClientLgu | null>(null);
  const [deletionPreview, setDeletionPreview] = useState<ClientDeletionPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSchedulingDeletion, setIsSchedulingDeletion] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });

  const adminCounts = useMemo(() => {
    const counts = new Map<string, number>();
    (data?.clients ?? []).forEach(client => {
      if (typeof client.adminCount === 'number') {
        counts.set(client.id, client.adminCount);
      }
    });

    (adminData?.admins ?? []).forEach(admin => {
      if (!admin.clientId) return;
      if (counts.has(admin.clientId)) return;
      counts.set(admin.clientId, (counts.get(admin.clientId) ?? 0) + 1);
    });

    return counts;
  }, [adminData, data]);

  const refreshClients = () => {
    void refetch();
    void refetchAdmins();
  };

  const filteredClients = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    const clients = data?.clients ?? [];
    if (!term) return clients;

    return clients.filter(client =>
      [
        client.name,
        client.id,
        client.status,
        client.regionName,
        client.provinceName,
        client.municipalityName,
        client.weatherLocationKey,
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term))
    );
  }, [data, searchQuery]);

  const sortedClients = useMemo(() => {
    const column = String(sortDescriptor.column || 'name');
    const getValue = (client: ClientLgu): string | number => {
      if (column === 'location') return `${client.municipalityName} ${client.provinceName}`;
      if (column === 'status') return client.status;
      if (column === 'barangays') return client.barangays.length;
      if (column === 'admins') return adminCounts.get(client.id) ?? 0;
      return client.name;
    };

    return [...filteredClients].sort((a, b) => {
      const first = getValue(a);
      const second = getValue(b);
      const result =
        typeof first === 'number' && typeof second === 'number'
          ? first - second
          : String(first).toLowerCase().localeCompare(String(second).toLowerCase());
      return sortDescriptor.direction === 'descending' ? -result : result;
    });
  }, [adminCounts, filteredClients, sortDescriptor]);

  const pages = Math.max(1, Math.ceil(sortedClients.length / rowsPerPage));
  const paginatedClients = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedClients.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, sortedClients]);
  const firstRow = sortedClients.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const lastRow = Math.min(page * rowsPerPage, sortedClients.length);

  const handleRowsPerPageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(event.target.value));
    setPage(1);
  };

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (!clientToDelete) {
      setDeletionPreview(null);
      setDeletionReason('');
      return;
    }

    let isMounted = true;
    setIsLoadingPreview(true);
    void (async () => {
      try {
        const token = await getToken();
        const response = await axios.get<{ preview: ClientDeletionPreview }>(
          API_ENDPOINTS.SUPER_ADMIN.CLIENT_DELETION_PREVIEW(clientToDelete.id),
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (isMounted) setDeletionPreview(response.data.preview);
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || 'Failed to load deletion preview'
          : 'Failed to load deletion preview';
        addToast({ title: message, color: 'danger' });
        if (isMounted) setClientToDelete(null);
      } finally {
        if (isMounted) setIsLoadingPreview(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [clientToDelete]);

  const scheduleClientDeletion = async () => {
    if (!clientToDelete) return;

    try {
      setIsSchedulingDeletion(true);
      const token = await getToken();
      await axios.post(
        API_ENDPOINTS.SUPER_ADMIN.SCHEDULE_CLIENT_DELETION(clientToDelete.id),
        { reason: deletionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast({ title: 'Client deletion scheduled', color: 'success' });
      setClientToDelete(null);
      refetch();
    } catch (error) {
      let message = 'Failed to schedule client deletion';
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      addToast({ title: message, color: 'danger' });
    } finally {
      setIsSchedulingDeletion(false);
    }
  };

  const bottomContent = (
    <div className="flex flex-col gap-3 px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-small text-default-400">
        Showing {firstRow}-{lastRow} of {sortedClients.length} clients
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-sm text-default-500">Search LGU clients, review their status, and open detailed setup.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="flat"
            startContent={<ArchiveIcon size={16} />}
            onPress={() => navigate('/super/clients/archive')}
          >
            Archive
          </Button>
          <Tooltip content="Refresh clients">
            <Button isIconOnly variant="flat" aria-label="Refresh clients" onPress={refreshClients} isLoading={loading}>
              <RefreshCcw size={18} />
            </Button>
          </Tooltip>
        </div>
      </div>

      <Input
        className="max-w-xl"
        placeholder="Search clients by LGU, municipality, province, status, or weather key"
        startContent={<Search size={16} />}
        value={searchQuery}
        onValueChange={setSearchQuery}
      />

      <Table
        aria-label="LGU clients table"
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        classNames={{ wrapper: 'border border-default-200 shadow-none' }}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      >
        <TableHeader>
          <TableColumn key="name" allowsSorting>
            CLIENT
          </TableColumn>
          <TableColumn key="location" allowsSorting>
            LOCATION
          </TableColumn>
          <TableColumn key="status" allowsSorting>
            STATUS
          </TableColumn>
          <TableColumn key="barangays" allowsSorting>
            BARANGAYS
          </TableColumn>
          <TableColumn key="admins" allowsSorting>
            ADMINS
          </TableColumn>
          <TableColumn key="actions" align="center">
            ACTIONS
          </TableColumn>
        </TableHeader>
        <TableBody emptyContent={loading ? 'Loading clients...' : 'No clients found'} items={paginatedClients}>
          {client => {
            const activeBarangays = client.barangays.filter(barangay => barangay.isActive !== false).length;
            const canScheduleDeletion = client.status === 'draft' || client.status === 'inactive';

            return (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ClientLogoAvatar src={client.logoUrl} name={client.name} size="sm" />
                    <div>
                      <p className="font-semibold">{client.name}</p>
                      <p className="text-xs text-default-500">{client.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{client.municipalityName}</p>
                    <p className="text-xs text-default-500">{client.provinceName || 'No province set'}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip size="sm" color={statusColor(client.status) as any} className="text-white">
                    {client.status}
                  </Chip>
                  {Boolean(client.deletionEffectiveAt) && (
                    <p className="mt-1 text-xs text-warning-600">Effective deletion scheduled</p>
                  )}
                </TableCell>
                <TableCell>
                  <p className="text-sm">
                    {activeBarangays} of {client.barangays.length}
                  </p>
                </TableCell>
                <TableCell>{adminCounts.get(client.id) ?? 0}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      startContent={<Settings size={15} />}
                      onPress={() => navigate(`/super/clients/${client.id}`)}
                    >
                      Manage
                    </Button>
                    <Tooltip
                      content={
                        canScheduleDeletion
                          ? 'Schedule client deletion'
                          : 'Deactivate draft or inactive clients before scheduling deletion'
                      }
                    >
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        aria-label="Schedule client deletion"
                        isDisabled={!canScheduleDeletion}
                        onPress={() => setClientToDelete(client)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            );
          }}
        </TableBody>
      </Table>

      <ClientDeleteModal
        client={clientToDelete}
        preview={deletionPreview}
        isLoadingPreview={isLoadingPreview}
        isScheduling={isSchedulingDeletion}
        reason={deletionReason}
        isOpen={!!clientToDelete}
        onOpenChange={open => !open && setClientToDelete(null)}
        onReasonChange={setDeletionReason}
        onScheduleDeletion={scheduleClientDeletion}
      />
    </div>
  );
};
