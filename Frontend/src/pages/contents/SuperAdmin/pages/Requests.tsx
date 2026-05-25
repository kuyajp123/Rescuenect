import { API_ENDPOINTS } from '@/config/endPoints';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type { LguRequest } from '@/pages/contents/SuperAdmin/types';
import { getToken, statusColor } from '@/pages/contents/SuperAdmin/utils';
import { Button, Card, CardBody, Chip, Textarea, addToast } from '@heroui/react';
import axios from 'axios';
import { useState } from 'react';

export const SuperAdminRequests = () => {
  const { data, loading, refetch } = useSuperFetch<{ requests: LguRequest[] }>(
    API_ENDPOINTS.SUPER_ADMIN.LGU_REQUESTS,
    'LGU requests'
  );
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

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
        {(data?.requests ?? []).map(request => (
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
    </div>
  );
};
