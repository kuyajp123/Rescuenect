import { API_ENDPOINTS } from '@/config/endPoints';
import type { AdminUser } from '@/pages/contents/SuperAdmin/types';
import type { ClientLguStatus } from '@/pages/contents/SuperAdmin/types';
import { getToken, statusColor } from '@/pages/contents/SuperAdmin/utils';
import {
  Button,
  Card,
  CardBody,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
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
import { UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';

type ClientAdminsTableProps = {
  admins: AdminUser[];
  clientStatus?: ClientLguStatus;
  onAdminStatusChanged?: () => void;
};

type AdminStatusTarget = {
  admin: AdminUser;
  status: 'active' | 'inactive';
};

export const ClientAdminsTable = ({ admins, clientStatus, onAdminStatusChanged }: ClientAdminsTableProps) => {
  const [statusTarget, setStatusTarget] = useState<AdminStatusTarget | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const confirmAdminStatusChange = async () => {
    if (!statusTarget) return;

    try {
      setIsUpdatingStatus(true);
      const token = await getToken();
      await axios.patch(
        API_ENDPOINTS.SUPER_ADMIN.UPDATE_ADMIN(statusTarget.admin.uid),
        { status: statusTarget.status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast({
        title: statusTarget.status === 'active' ? 'Admin activated' : 'Admin deactivated',
        color: 'success',
      });
      setStatusTarget(null);
      onAdminStatusChanged?.();
    } catch (error) {
      addToast({
        title: statusTarget.status === 'active' ? 'Activation blocked' : 'Update failed',
        description: axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to update admin status',
        color: 'danger',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const renderAdminAction = (admin: AdminUser) => {
    const isActive = admin.status === 'active';
    const nextStatus = isActive ? 'inactive' : 'active';
    const canActivate = isActive || clientStatus === 'active';
    const activationTooltip =
      clientStatus === 'deleted'
        ? 'Deleted client admins cannot be activated'
        : clientStatus
          ? 'Assigned client must be active before activation'
          : 'Assigned client status is unavailable';

    return (
      <Tooltip content={isActive ? 'Deactivate admin' : canActivate ? 'Activate admin' : activationTooltip}>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          color={isActive ? 'warning' : 'success'}
          aria-label={isActive ? 'Deactivate admin' : 'Activate admin'}
          isDisabled={!canActivate}
          onPress={() => setStatusTarget({ admin, status: nextStatus })}
        >
          {isActive ? <UserX size={16} /> : <UserCheck size={16} />}
        </Button>
      </Tooltip>
    );
  };

  return (
    <>
      <Card className="border border-default-200">
        <CardBody className="gap-4">
          <div>
            <h2 className="text-xl font-semibold">LGU Admins</h2>
            <p className="text-sm text-default-500">Admins currently assigned to this client.</p>
          </div>
          <Table aria-label="Client LGU admins table" classNames={{ wrapper: 'border border-default-200 shadow-none' }}>
            <TableHeader>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>UID</TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No LGU admins assigned to this client" items={admins}>
              {admin => (
                <TableRow key={admin.uid}>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Chip size="sm" color={statusColor(admin.status) as any}>
                      {admin.status}
                    </Chip>
                  </TableCell>
                  <TableCell className="text-xs text-default-500">{admin.uid}</TableCell>
                  <TableCell>{renderAdminAction(admin)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal isOpen={Boolean(statusTarget)} onOpenChange={open => !open && setStatusTarget(null)} size="sm">
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {statusTarget?.status === 'active' ? 'Activate LGU admin?' : 'Deactivate LGU admin?'}
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-default-600">
                  {statusTarget?.status === 'active' ? 'Restore admin access for ' : 'Temporarily remove admin access for '}
                  <span className="font-semibold">{statusTarget?.admin.email}</span>?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color={statusTarget?.status === 'active' ? 'success' : 'warning'}
                  isLoading={isUpdatingStatus}
                  onPress={confirmAdminStatusChange}
                >
                  {statusTarget?.status === 'active' ? 'Activate Admin' : 'Deactivate Admin'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
