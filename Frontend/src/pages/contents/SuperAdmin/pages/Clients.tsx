import { API_ENDPOINTS } from '@/config/endPoints';
import { ClientDeleteModal } from '@/pages/contents/SuperAdmin/components/ClientDeleteModal';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type { AdminUser, ClientLgu } from '@/pages/contents/SuperAdmin/types';
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
import { Building2, RefreshCcw, Search, Settings, Trash2 } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const SuperAdminClients = () => {
  const { data, loading, refetch } = useSuperFetch<{ clients: ClientLgu[] }>(
    API_ENDPOINTS.SUPER_ADMIN.CLIENTS,
    'clients'
  );
  const { data: adminData } = useSuperFetch<{ admins: AdminUser[] }>(API_ENDPOINTS.SUPER_ADMIN.ADMINS, 'client admins');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [clientToDelete, setClientToDelete] = useState<ClientLgu | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });

  const adminCounts = useMemo(() => {
    const counts = new Map<string, number>();
    (adminData?.admins ?? []).forEach(admin => {
      if (!admin.clientId) return;
      counts.set(admin.clientId, (counts.get(admin.clientId) ?? 0) + 1);
    });
    return counts;
  }, [adminData]);

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

  const deleteClient = async () => {
    if (!clientToDelete) return;

    try {
      const token = await getToken();
      await axios.delete(API_ENDPOINTS.SUPER_ADMIN.DELETE_CLIENT(clientToDelete.id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      addToast({ title: 'Client deleted', color: 'success' });
      setClientToDelete(null);
      refetch();
    } catch (error) {
      let message = 'Failed to delete client';
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      addToast({ title: message, color: 'danger' });
      setClientToDelete(null);
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
        <Tooltip content="Refresh clients">
          <Button isIconOnly variant="flat" aria-label="Refresh clients" onPress={refetch} isLoading={loading}>
            <RefreshCcw size={18} />
          </Button>
        </Tooltip>
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
            const canDelete = client.id !== 'naic';

            return (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Building2 size={18} />
                    </div>
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
                  <Chip size="sm" color={statusColor(client.status) as any}>
                    {client.status}
                  </Chip>
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
                    <Tooltip content={canDelete ? 'Delete client' : 'Default client cannot be deleted'}>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        aria-label="Delete client"
                        isDisabled={!canDelete}
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
        isOpen={!!clientToDelete}
        onOpenChange={open => !open && setClientToDelete(null)}
        onDelete={deleteClient}
      />
    </div>
  );
};
