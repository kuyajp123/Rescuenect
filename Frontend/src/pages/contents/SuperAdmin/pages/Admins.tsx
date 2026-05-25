import { API_ENDPOINTS } from '@/config/endPoints';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type { AdminUser, ClientLgu } from '@/pages/contents/SuperAdmin/types';
import { getToken, statusColor } from '@/pages/contents/SuperAdmin/utils';
import { useAuth } from '@/stores/useAuth';
import type { SortDescriptor } from '@heroui/react';
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Select,
  SelectItem,
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
import { Plus, RefreshCcw, Shield, Trash2, UserCheck, UserX } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

export const SuperAdminAdmins = () => {
  const { data, loading, refetch } = useSuperFetch<{ admins: AdminUser[] }>(API_ENDPOINTS.SUPER_ADMIN.ADMINS, 'admins');
  const { data: clientData } = useSuperFetch<{ clients: ClientLgu[] }>(
    API_ENDPOINTS.SUPER_ADMIN.CLIENTS,
    'clients for admin invites'
  );
  const userData = useAuth(state => state.userData);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteClientId, setInviteClientId] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'email',
    direction: 'ascending',
  });
  const admins = useMemo(() => (data?.admins ?? []).filter(admin => admin.role === 'lgu_admin'), [data]);
  const pages = Math.max(1, Math.ceil(admins.length / rowsPerPage));

  const sortedAdmins = useMemo(() => {
    const column = String(sortDescriptor.column || 'email');
    const getValue = (admin: AdminUser) => {
      if (column === 'client') return admin.clientName || admin.clientId || '';
      if (column === 'status') return admin.status;
      return admin.email;
    };

    return [...admins].sort((a, b) => {
      const first = getValue(a).toLowerCase();
      const second = getValue(b).toLowerCase();
      const result = first.localeCompare(second);
      return sortDescriptor.direction === 'descending' ? -result : result;
    });
  }, [admins, sortDescriptor]);

  const paginatedAdmins = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedAdmins.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, sortedAdmins]);
  const firstRow = admins.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const lastRow = Math.min(page * rowsPerPage, admins.length);

  const handleRowsPerPageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(event.target.value));
    setPage(1);
  };

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  useEffect(() => {
    const firstClientId = clientData?.clients?.[0]?.id;
    if (!inviteClientId && firstClientId) setInviteClientId(firstClientId);
  }, [clientData, inviteClientId]);

  const inviteAdmin = async () => {
    if (!inviteEmail.trim() || !inviteClientId) {
      addToast({ title: 'Invite details required', description: 'Select a client and enter an email.', color: 'warning' });
      return;
    }

    const token = await getToken();
    await axios.post(
      API_ENDPOINTS.SUPER_ADMIN.INVITE_ADMIN,
      { email: inviteEmail.trim(), role: 'lgu_admin', clientId: inviteClientId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    addToast({ title: 'LGU admin invited', color: 'success' });
    setInviteEmail('');
    setIsInviteOpen(false);
    refetch();
  };

  const updateAdminStatus = async (admin: AdminUser, status: 'active' | 'inactive') => {
    const token = await getToken();
    await axios.patch(
      API_ENDPOINTS.SUPER_ADMIN.UPDATE_ADMIN(admin.uid),
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    addToast({ title: status === 'active' ? 'Admin activated' : 'Admin deactivated', color: 'success' });
    refetch();
  };

  const deleteAdmin = async () => {
    if (!adminToDelete) return;

    const token = await getToken();
    await axios.delete(API_ENDPOINTS.SUPER_ADMIN.DELETE_ADMIN(adminToDelete.uid), {
      headers: { Authorization: `Bearer ${token}` },
    });
    addToast({ title: 'LGU admin deleted', color: 'success' });
    setAdminToDelete(null);
    refetch();
  };

  const renderAdminActions = (admin: AdminUser) => {
    const isSelf = admin.uid === userData?.uid;
    const canDelete = admin.role === 'lgu_admin' && !isSelf;
    const isActive = admin.status === 'active';

    return (
      <div className="flex items-center justify-center gap-1">
        <Tooltip content={isActive ? 'Deactivate admin' : 'Activate admin'}>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color={isActive ? 'warning' : 'success'}
            aria-label={isActive ? 'Deactivate admin' : 'Activate admin'}
            isDisabled={isSelf && isActive}
            onPress={() => updateAdminStatus(admin, isActive ? 'inactive' : 'active')}
          >
            {isActive ? <UserX size={16} /> : <UserCheck size={16} />}
          </Button>
        </Tooltip>
        <Tooltip content={canDelete ? 'Delete LGU admin' : 'Only LGU admins can be deleted'}>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="danger"
            aria-label="Delete LGU admin"
            isDisabled={!canDelete}
            onPress={() => setAdminToDelete(admin)}
          >
            <Trash2 size={16} />
          </Button>
        </Tooltip>
      </div>
    );
  };

  const bottomContent = (
    <div className="flex flex-col gap-3 px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-small text-default-400">
        Showing {firstRow}-{lastRow} of {admins.length} LGU admins
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
          <h1 className="text-3xl font-bold">LGU Admins</h1>
          <p className="text-sm text-default-500">Invite LGU admins and manage active access.</p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip content="Refresh admins">
            <Button isIconOnly variant="flat" aria-label="Refresh admins" onPress={refetch} isLoading={loading}>
              <RefreshCcw size={18} />
            </Button>
          </Tooltip>
          <Button color="primary" startContent={<Plus size={16} />} onPress={() => setIsInviteOpen(true)}>
            Add LGU Admin
          </Button>
        </div>
      </div>

      <Table
        aria-label="LGU admin accounts table"
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        classNames={{
          wrapper: 'border border-default-200 shadow-none',
        }}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      >
        <TableHeader>
          <TableColumn key="email" allowsSorting>
            EMAIL
          </TableColumn>
          <TableColumn key="client" allowsSorting>
            CLIENT
          </TableColumn>
          <TableColumn key="status" allowsSorting>
            STATUS
          </TableColumn>
          <TableColumn key="actions" align="center">
            ACTIONS
          </TableColumn>
        </TableHeader>
        <TableBody emptyContent={loading ? 'Loading admins...' : 'No LGU admin accounts found'} items={paginatedAdmins}>
          {admin => (
            <TableRow key={admin.uid}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Shield size={18} />
                  </div>
                  <div>
                    <p className="font-semibold">{admin.email}</p>
                    <p className="text-xs text-default-500">{admin.uid}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{admin.clientName || admin.clientId || 'System-wide'}</TableCell>
              <TableCell>
                <Chip size="sm" color={statusColor(admin.status) as any}>
                  {admin.status}
                </Chip>
              </TableCell>
              <TableCell>{renderAdminActions(admin)}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal isOpen={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span>Add LGU Admin</span>
                <span className="text-sm font-normal text-default-500">
                  The email can sign in with Google after the invite is saved.
                </span>
              </ModalHeader>
              <ModalBody className="gap-4">
                <Input label="Email" type="email" value={inviteEmail} onValueChange={setInviteEmail} />
                <Select
                  label="Client"
                  selectedKeys={inviteClientId ? [inviteClientId] : []}
                  onSelectionChange={keys => setInviteClientId(Array.from(keys)[0]?.toString() || '')}
                >
                  {(clientData?.clients ?? []).map(client => (
                    <SelectItem key={client.id}>{client.name}</SelectItem>
                  ))}
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={inviteAdmin}>
                  Save Invite
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={!!adminToDelete} onOpenChange={open => !open && setAdminToDelete(null)} size="sm">
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">Delete LGU admin?</ModalHeader>
              <ModalBody>
                <p className="text-sm text-default-600">
                  This removes <span className="font-semibold">{adminToDelete?.email}</span> from admin access and
                  revokes the matching invite.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="danger" onPress={deleteAdmin}>
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};
