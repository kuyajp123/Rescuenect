import { API_ENDPOINTS } from '@/config/endPoints';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type { LguRequest } from '@/pages/contents/SuperAdmin/types';
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
  Pagination,
  Textarea,
  Tooltip,
  addToast,
} from '@heroui/react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];
const canDeleteRequest = (request: LguRequest) => request.status === 'approved' || request.status === 'rejected';

export const SuperAdminRequests = () => {
  const { data, loading, refetch } = useSuperFetch<{ requests: LguRequest[] }>(
    API_ENDPOINTS.SUPER_ADMIN.LGU_REQUESTS,
    'LGU requests'
  );
  const requests = data?.requests ?? [];
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<LguRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const pages = Math.max(1, Math.ceil(requests.length / rowsPerPage));
  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return requests.slice(start, start + rowsPerPage);
  }, [page, requests, rowsPerPage]);
  const firstRow = requests.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const lastRow = Math.min(page * rowsPerPage, requests.length);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const handleRowsPerPageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(event.target.value));
    setPage(1);
  };

  const updateRequest = async (id: string, action: 'approve' | 'reject') => {
    const token = await getToken();
    const endpoint =
      action === 'approve'
        ? API_ENDPOINTS.SUPER_ADMIN.APPROVE_LGU_REQUEST(id)
        : API_ENDPOINTS.SUPER_ADMIN.REJECT_LGU_REQUEST(id);
    await axios.post(endpoint, { reviewNote: reviewNotes[id] || '' }, { headers: { Authorization: `Bearer ${token}` } });
    addToast({ title: action === 'approve' ? 'Request approved' : 'Request rejected', color: 'success' });
    refetch();
  };

  const deleteRequest = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const token = await getToken();
      await axios.delete(API_ENDPOINTS.SUPER_ADMIN.DELETE_LGU_REQUEST(deleteTarget.id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      addToast({ title: 'LGU request deleted', color: 'success' });
      setDeleteTarget(null);
      refetch();
    } catch (error: any) {
      addToast({
        title: 'Failed to delete LGU request',
        description: error?.response?.data?.message || error?.message || 'Please try again.',
        color: 'danger',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const bottomContent = (
    <div className="flex flex-col gap-3 px-1 py-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-small text-default-400">
        Showing {firstRow}-{lastRow} of {requests.length} LGU requests
      </span>
      <Pagination showControls showShadow color="primary" page={page} total={pages} onChange={setPage} />
      <label className="flex items-center gap-2 text-small text-default-400">
        Rows per page:
        <select
          className="rounded-md border border-default-200 bg-transparent px-2 py-1 text-small text-default-600 outline-none"
          value={rowsPerPage}
          onChange={handleRowsPerPageChange}
        >
          {ROWS_PER_PAGE_OPTIONS.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  return (
    <div className="w-full space-y-5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LGU Requests</h1>
          <p className="text-sm text-default-500">Review municipality and city onboarding requests.</p>
        </div>
        <Button variant="flat" onPress={refetch} isLoading={loading}>
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {paginatedRequests.length === 0 && (
          <Card className="border border-default-200">
            <CardBody className="items-center py-12 text-center text-default-500">
              No LGU requests found.
            </CardBody>
          </Card>
        )}

        {paginatedRequests.map(request => (
          <Card key={request.id} className="border border-default-200">
            <CardBody className="gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{request.lguName}</h2>
                    <Chip size="sm" color={statusColor(request.status) as any}>
                      {request.status}
                    </Chip>
                  </div>
                  <p className="text-sm text-default-500">
                    {request.municipalityName}, {request.provinceName} - {request.selectedBarangays.length} barangays
                  </p>
                </div>
                <div className="text-right text-sm text-default-500">
                  <p>{request.requesterName}</p>
                  <p>{request.requesterEmail}</p>
                  <p>{request.requesterPhone}</p>
                  {canDeleteRequest(request) && (
                    <div className="mt-3 flex justify-end">
                      <Tooltip content="Delete finalized request">
                        <Button
                          isIconOnly
                          size="sm"
                          color="danger"
                          variant="flat"
                          aria-label={`Delete ${request.lguName} request`}
                          onPress={() => setDeleteTarget(request)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {request.selectedBarangays.slice(0, 12).map(barangay => (
                  <Chip key={barangay.barangayCode || barangay.value} size="sm" variant="flat">
                    {barangay.barangayLabel}
                  </Chip>
                ))}
                {request.selectedBarangays.length > 12 && (
                  <Chip size="sm" variant="flat">
                    +{request.selectedBarangays.length - 12}
                  </Chip>
                )}
              </div>
              {request.status === 'pending' && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
                  <Textarea
                    label="Review note"
                    minRows={1}
                    value={reviewNotes[request.id] || ''}
                    onValueChange={value => setReviewNotes(prev => ({ ...prev, [request.id]: value }))}
                  />
                  <Button color="success" onPress={() => updateRequest(request.id, 'approve')}>
                    Approve Draft
                  </Button>
                  <Button color="danger" variant="flat" onPress={() => updateRequest(request.id, 'reject')}>
                    Reject
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      {bottomContent}

      <Modal isOpen={Boolean(deleteTarget)} onOpenChange={isOpen => !isOpen && setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>Delete LGU Request</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              Delete the {deleteTarget?.status} request from {deleteTarget?.lguName}? This removes it from the Super
              Admin request history. Pending requests cannot be deleted.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button color="danger" isLoading={isDeleting} onPress={deleteRequest}>
              Delete Request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};
