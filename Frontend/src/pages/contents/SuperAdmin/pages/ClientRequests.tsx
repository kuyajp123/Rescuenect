import { API_ENDPOINTS } from '@/config/endPoints';
import { ClientChangeSummary } from '@/pages/contents/SuperAdmin/components/ClientChangeSummary';
import { ClientLogoAvatar } from '@/pages/contents/SuperAdmin/components/ClientLogoAvatar';
import { MapSettingsPreview } from '@/pages/contents/SuperAdmin/components/MapSettingsPreview';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type { ClientChangeRequest, ClientLgu } from '@/pages/contents/SuperAdmin/types';
import {
  formatClientChangeRequestType,
  formatDateTime,
  getToken,
  statusColor,
  type MapSettingsDraft,
} from '@/pages/contents/SuperAdmin/utils';
import {
  Button,
  Card,
  CardBody,
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
  Textarea,
  Tooltip,
  addToast,
} from '@heroui/react';
import axios from 'axios';
import { Check, Search, Trash2, X } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

type ReviewTarget = {
  request: ClientChangeRequest;
  action: 'approve' | 'reject';
};

const REVIEW_NOTE_WORD_LIMIT = 300;
const STATUS_FILTERS: Array<ClientChangeRequest['status'] | 'all'> = [
  'all',
  'pending',
  'approved',
  'cancelled',
  'rejected',
];

const stringify = (value: unknown) => (value === null || value === undefined ? '' : String(value));

const getWordCount = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

const limitWords = (value: string, maxWords: number) => {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return value;
  return words.slice(0, maxWords).join(' ');
};

const getMapPreviewDraft = (request: ClientChangeRequest | null): MapSettingsDraft | null => {
  if (!request || (request.type !== 'map_settings' && request.type !== 'weather_coordinates')) return null;

  const proposedChanges = request.proposedChanges || {};
  const settings =
    proposedChanges.mapSettings && typeof proposedChanges.mapSettings === 'object'
      ? (proposedChanges.mapSettings as Record<string, any>)
      : {};
  const bounds =
    settings.maxBounds && typeof settings.maxBounds === 'object' ? (settings.maxBounds as Record<string, unknown>) : {};

  return {
    centerLatitude: stringify(settings.centerLatitude ?? proposedChanges.weatherLatitude),
    centerLongitude: stringify(settings.centerLongitude ?? proposedChanges.weatherLongitude),
    minZoom: stringify(settings.minZoom ?? 13),
    zoom: stringify(settings.zoom ?? 15),
    maxZoom: stringify(settings.maxZoom ?? 18),
    north: stringify(bounds.north),
    south: stringify(bounds.south),
    east: stringify(bounds.east),
    west: stringify(bounds.west),
  };
};

export const SuperAdminClientRequests = () => {
  const { data, loading, refetch } = useSuperFetch<{ requests: ClientChangeRequest[] }>(
    API_ENDPOINTS.SUPER_ADMIN.CLIENT_CHANGE_REQUESTS,
    'client change requests'
  );
  const { data: clientData } = useSuperFetch<{ clients: ClientLgu[] }>(
    API_ENDPOINTS.SUPER_ADMIN.CLIENTS,
    'clients for request logos'
  );
  const requests = data?.requests ?? [];
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientChangeRequest['status'] | 'all'>('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientChangeRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const reviewPreviewDraft = getMapPreviewDraft(reviewTarget?.request ?? null);
  const reviewNoteWordCount = getWordCount(reviewNote);
  const clientsById = useMemo(
    () => new Map((clientData?.clients ?? []).map(client => [client.id, client])),
    [clientData]
  );

  const filteredRequests = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();

    return requests.filter(request => {
      if (statusFilter !== 'all' && request.status !== statusFilter) return false;
      if (!term) return true;

      return [request.clientName, request.clientId, request.requestedByEmail, request.requestedBy]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term));
    });
  }, [requests, searchQuery, statusFilter]);

  const pages = Math.max(1, Math.ceil(filteredRequests.length / rowsPerPage));
  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredRequests.slice(start, start + rowsPerPage);
  }, [filteredRequests, page, rowsPerPage]);
  const firstRow = filteredRequests.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const lastRow = Math.min(page * rowsPerPage, filteredRequests.length);

  const handleRowsPerPageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(event.target.value));
    setPage(1);
  };

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const openReview = (request: ClientChangeRequest, action: ReviewTarget['action']) => {
    setReviewTarget({ request, action });
    setReviewNote(limitWords(request.reviewNote || '', REVIEW_NOTE_WORD_LIMIT));
  };

  const closeReview = () => {
    setReviewTarget(null);
    setReviewNote('');
  };

  const review = async () => {
    if (!reviewTarget) return;

    setIsReviewing(true);
    const { request, action } = reviewTarget;
    const endpoint =
      action === 'approve'
        ? API_ENDPOINTS.SUPER_ADMIN.APPROVE_CLIENT_CHANGE_REQUEST(request.id)
        : API_ENDPOINTS.SUPER_ADMIN.REJECT_CLIENT_CHANGE_REQUEST(request.id);

    try {
      const token = await getToken();
      await axios.post(
        endpoint,
        { reviewNote: limitWords(reviewNote, REVIEW_NOTE_WORD_LIMIT).trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast({ title: action === 'approve' ? 'Proposal approved' : 'Proposal rejected', color: 'success' });
      closeReview();
      refetch();
    } finally {
      setIsReviewing(false);
    }
  };

  const bottomContent = (
    <div className="flex flex-col gap-3 px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-small text-default-400">
        Showing {firstRow}-{lastRow} of {filteredRequests.length} client requests
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

  const deleteRequest = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      const token = await getToken();
      await axios.delete(API_ENDPOINTS.SUPER_ADMIN.DELETE_CLIENT_CHANGE_REQUEST(deleteTarget.id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      addToast({ title: 'Client request deleted', color: 'success' });
      setDeleteTarget(null);
      refetch();
    } catch (error: any) {
      addToast({
        title: 'Failed to delete client request',
        description: error?.response?.data?.message || error?.message || 'Please try again.',
        color: 'danger',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-5 p-4">
      <div>
        <h1 className="text-3xl font-bold">Client Requests</h1>
        <p className="text-sm text-default-500">LGU client proposals for Super Admin review.</p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Input
          className="max-w-xl"
          placeholder="Search by client or requester"
          startContent={<Search size={16} />}
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <Select
          className="max-w-xs"
          label="Status"
          selectedKeys={[statusFilter]}
          onChange={event => setStatusFilter((event.target.value || 'all') as ClientChangeRequest['status'] | 'all')}
        >
          {STATUS_FILTERS.map(status => (
            <SelectItem key={status}>{status === 'all' ? 'All statuses' : status}</SelectItem>
          ))}
        </Select>
      </div>

      <Card className="border border-default-200">
        <CardBody className="gap-3">
          <div className="max-h-[620px] overflow-auto">
            <Table aria-label="Client change requests" isHeaderSticky removeWrapper>
              <TableHeader>
                <TableColumn>Client</TableColumn>
                <TableColumn>Date</TableColumn>
                <TableColumn>Requested By</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Type</TableColumn>
                <TableColumn>Summary</TableColumn>
                <TableColumn>Review Note</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody emptyContent={loading ? 'Loading proposals...' : 'No client requests.'}>
                {paginatedRequests.map(request => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex min-w-48 items-center gap-3">
                        <ClientLogoAvatar
                          src={request.clientLogoUrl ?? clientsById.get(request.clientId)?.logoUrl}
                          name={request.clientName || clientsById.get(request.clientId)?.name || request.clientId}
                          size="sm"
                        />
                        <div>
                          <p className="font-semibold">{request.clientName || request.clientId}</p>
                          <p className="text-xs text-default-500">{request.clientId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(request.createdAt || request.requestedAt)}</TableCell>
                    <TableCell>{request.requestedByEmail || request.requestedBy}</TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={statusColor(request.status) as any}
                        className={`${request.status === 'cancelled' ? '' : 'text-white'}`}
                      >
                        {request.status}
                      </Chip>
                    </TableCell>
                    <TableCell>{formatClientChangeRequestType(request.type)}</TableCell>
                    <TableCell>
                      <ClientChangeSummary request={request} />
                    </TableCell>
                    <TableCell>
                      {request.reviewNote ? (
                        <div className="max-h-44 max-w-xs overflow-auto whitespace-pre-wrap rounded-md border border-default-200 bg-default-50 p-2 text-sm text-default-600">
                          {request.reviewNote}
                        </div>
                      ) : (
                        <span className="text-sm text-default-400">
                          {request.status === 'pending' ? 'Add during review' : 'None'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Tooltip
                          content={
                            request.status === 'pending' ? 'Accept proposal' : 'Only pending proposals can be accepted'
                          }
                        >
                          <span className="inline-flex">
                            <Button
                              isIconOnly
                              size="sm"
                              color="success"
                              variant="flat"
                              aria-label="Accept proposal"
                              isDisabled={request.status !== 'pending'}
                              onPress={() => openReview(request, 'approve')}
                            >
                              <Check size={16} />
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip
                          content={
                            request.status === 'pending' ? 'Reject proposal' : 'Only pending proposals can be rejected'
                          }
                        >
                          <span className="inline-flex">
                            <Button
                              isIconOnly
                              size="sm"
                              color="danger"
                              variant="flat"
                              aria-label="Reject proposal"
                              isDisabled={request.status !== 'pending'}
                              onPress={() => openReview(request, 'reject')}
                            >
                              <X size={16} />
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip content="Delete request">
                          <span className="inline-flex">
                            <Button
                              isIconOnly
                              size="sm"
                              color="danger"
                              variant="light"
                              aria-label="Delete request"
                              onPress={() => setDeleteTarget(request)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </span>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {bottomContent}
        </CardBody>
      </Card>

      <Modal isOpen={Boolean(reviewTarget)} onOpenChange={open => !open && closeReview()} size="lg">
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {reviewTarget?.action === 'approve' ? 'Approve proposal' : 'Reject proposal'}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-2 text-sm text-default-500">
                  <p>
                    {reviewTarget?.request.clientName || reviewTarget?.request.clientId} -{' '}
                    {reviewTarget ? formatClientChangeRequestType(reviewTarget.request.type) : 'Client request'}
                  </p>
                  <p>
                    This note will be saved in the LGU admin Request History and included in the review notification.
                  </p>
                </div>
                {reviewPreviewDraft && (
                  <MapSettingsPreview
                    draft={reviewPreviewDraft}
                    isReadOnly
                    title="Proposed Map Preview"
                    height="300px"
                  />
                )}
                <Textarea
                  label="Review note"
                  description={`${reviewNoteWordCount}/${REVIEW_NOTE_WORD_LIMIT} words`}
                  minRows={4}
                  placeholder="Add approval instructions, rejection reason, or follow-up details."
                  value={reviewNote}
                  onValueChange={value => setReviewNote(limitWords(value, REVIEW_NOTE_WORD_LIMIT))}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color={reviewTarget?.action === 'approve' ? 'success' : 'danger'}
                  onPress={review}
                  isLoading={isReviewing}
                >
                  {reviewTarget?.action === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={Boolean(deleteTarget)} onOpenChange={open => !open && setDeleteTarget(null)} size="md">
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">Delete client request</ModalHeader>
              <ModalBody>
                <p className="text-sm text-default-500">
                  Delete the {deleteTarget ? formatClientChangeRequestType(deleteTarget.type) : 'client'} request from{' '}
                  {deleteTarget?.clientName || deleteTarget?.clientId}? This only removes the request record. Changes
                  that were already approved remain applied.
                </p>
                {deleteTarget?.status === 'pending' && (
                  <p className="text-sm text-danger-500">
                    This request is still pending, so deleting it will prevent Super Admin review.
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="danger" onPress={deleteRequest} isLoading={isDeleting}>
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
