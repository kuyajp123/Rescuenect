import type { AdminUser } from '@/pages/contents/SuperAdmin/types';
import { statusColor } from '@/pages/contents/SuperAdmin/utils';
import { Card, CardBody, Chip, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';

type ClientAdminsTableProps = {
  admins: AdminUser[];
};

export const ClientAdminsTable = ({ admins }: ClientAdminsTableProps) => (
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
            </TableRow>
          )}
        </TableBody>
      </Table>
    </CardBody>
  </Card>
);
