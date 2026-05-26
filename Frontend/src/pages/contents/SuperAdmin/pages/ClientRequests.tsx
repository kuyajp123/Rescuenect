import { API_ENDPOINTS } from '@/config/endPoints';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type { ClientChangeRequest } from '@/pages/contents/SuperAdmin/types';
import { formatDateTime, getToken, statusColor } from '@/pages/contents/SuperAdmin/utils';
import { Button, Card, CardBody, Chip, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, addToast } from '@heroui/react';
import axios from 'axios';
import { Check, X } from 'lucide-react';

export const SuperAdminClientRequests = () => {
  const { data, loading, refetch } = useSuperFetch<{ requests: ClientChangeRequest[] }>(
    API_ENDPOINTS.SUPER_ADMIN.CLIENT_CHANGE_REQUESTS,
    'client change requests'
  );
  const requests = data?.requests ?? [];

  const review = async (request: ClientChangeRequest, action: 'approve' | 'reject') => {
    const token = await getToken();
    const endpoint =
      action === 'approve'
        ? API_ENDPOINTS.SUPER_ADMIN.APPROVE_CLIENT_CHANGE_REQUEST(request.id)
        : API_ENDPOINTS.SUPER_ADMIN.REJECT_CLIENT_CHANGE_REQUEST(request.id);

    await axios.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
    addToast({ title: action === 'approve' ? 'Proposal approved' : 'Proposal rejected', color: 'success' });
    refetch();
  };

  return (
    <div className="w-full space-y-5 p-4">
      <div>
        <h1 className="text-3xl font-bold">Client Requests</h1>
        <p className="text-sm text-default-500">LGU client proposals for Super Admin review.</p>
      </div>

      <Card className="border border-default-200">
        <CardBody>
          <Table aria-label="Client change requests" removeWrapper>
            <TableHeader>
              <TableColumn>Client</TableColumn>
              <TableColumn>Type</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Requested By</TableColumn>
              <TableColumn>Date</TableColumn>
              <TableColumn>Summary</TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableHeader>
            <TableBody emptyContent={loading ? 'Loading proposals...' : 'No client requests.'}>
              {requests.map(request => (
                <TableRow key={request.id}>
                  <TableCell>{request.clientName || request.clientId}</TableCell>
                  <TableCell className="capitalize">{request.type.replace(/_/g, ' ')}</TableCell>
                  <TableCell>
                    <Chip size="sm" color={statusColor(request.status) as any}>
                      {request.status}
                    </Chip>
                  </TableCell>
                  <TableCell>{request.requestedByEmail || request.requestedBy}</TableCell>
                  <TableCell>{formatDateTime(request.createdAt || request.requestedAt)}</TableCell>
                  <TableCell>
                    <pre className="max-h-24 max-w-sm overflow-auto whitespace-pre-wrap rounded-md bg-default-100 p-2 text-xs">
                      {JSON.stringify(request.proposedChanges, null, 2)}
                    </pre>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        color="success"
                        variant="flat"
                        aria-label="Approve"
                        isDisabled={request.status !== 'pending'}
                        onPress={() => review(request, 'approve')}
                      >
                        <Check size={16} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="flat"
                        aria-label="Reject"
                        isDisabled={request.status !== 'pending'}
                        onPress={() => review(request, 'reject')}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
};
