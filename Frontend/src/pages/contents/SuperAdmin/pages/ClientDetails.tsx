import { API_ENDPOINTS } from '@/config/endPoints';
import { ClientAdminsTable } from '@/pages/contents/SuperAdmin/components/ClientAdminsTable';
import { ClientCoverageEditor } from '@/pages/contents/SuperAdmin/components/ClientCoverageEditor';
import { ClientDeleteModal } from '@/pages/contents/SuperAdmin/components/ClientDeleteModal';
import { ClientRequestDetails } from '@/pages/contents/SuperAdmin/components/ClientRequestDetails';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type { ClientCoverageBarangay, ClientDetailResponse } from '@/pages/contents/SuperAdmin/types';
import { getToken, statusColor } from '@/pages/contents/SuperAdmin/utils';
import { Button, Card, CardBody, Chip, Input, Tooltip, addToast } from '@heroui/react';
import axios from 'axios';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const SuperAdminClientDetails = () => {
  const navigate = useNavigate();
  const { clientId = '' } = useParams();
  const { data, loading, refetch } = useSuperFetch<ClientDetailResponse>(
    API_ENDPOINTS.SUPER_ADMIN.CLIENT_DETAIL(clientId),
    'client details'
  );
  const [coordinateDraft, setCoordinateDraft] = useState({ key: '', lat: '', lng: '' });
  const [coverageDraft, setCoverageDraft] = useState<ClientCoverageBarangay[]>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const client = data?.client;
  const request = data?.request ?? null;
  const admins = data?.admins ?? [];

  useEffect(() => {
    if (!client) return;

    setCoordinateDraft({
      key: client.weatherLocationKey || '',
      lat: client.weatherLatitude?.toString() ?? '',
      lng: client.weatherLongitude?.toString() ?? '',
    });
    setCoverageDraft(client.barangays);
  }, [client]);

  const saveClient = async () => {
    if (!client) return;

    const token = await getToken();
    await axios.patch(
      API_ENDPOINTS.SUPER_ADMIN.UPDATE_CLIENT(client.id),
      {
        weatherLocationKey: coordinateDraft.key || client.weatherLocationKey,
        weatherLatitude: coordinateDraft.lat ? Number(coordinateDraft.lat) : null,
        weatherLongitude: coordinateDraft.lng ? Number(coordinateDraft.lng) : null,
        barangays: coverageDraft,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    addToast({ title: 'Client updated', color: 'success' });
    refetch();
  };

  const setStatus = async (status: 'active' | 'inactive') => {
    if (!client) return;

    const token = await getToken();
    const endpoint =
      status === 'active'
        ? API_ENDPOINTS.SUPER_ADMIN.ACTIVATE_CLIENT(client.id)
        : API_ENDPOINTS.SUPER_ADMIN.DEACTIVATE_CLIENT(client.id);
    await axios.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
    addToast({ title: status === 'active' ? 'Client activated' : 'Client deactivated', color: 'success' });
    refetch();
  };

  const deleteClient = async () => {
    if (!client) return;

    const token = await getToken();
    await axios.delete(API_ENDPOINTS.SUPER_ADMIN.DELETE_CLIENT(client.id), {
      headers: { Authorization: `Bearer ${token}` },
    });
    addToast({ title: 'Client deleted', color: 'success' });
    navigate('/super/clients');
  };

  const activeBarangayCount = coverageDraft.filter(barangay => barangay.isActive !== false).length;
  const canDelete = Boolean(client && client.id !== 'naic');

  if (loading && !client) {
    return (
      <div className="w-full p-4">
        <p className="text-sm text-default-500">Loading client details...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="w-full space-y-4 p-4">
        <Button variant="flat" startContent={<ArrowLeft size={16} />} onPress={() => navigate('/super/clients')}>
          Back to Clients
        </Button>
        <Card className="border border-default-200">
          <CardBody>
            <p className="text-sm text-default-500">Client not found.</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Button variant="flat" startContent={<ArrowLeft size={16} />} onPress={() => navigate('/super/clients')}>
            Back to Clients
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold">{client.name}</h1>
              <Chip size="sm" color={statusColor(client.status) as any}>
                {client.status}
              </Chip>
            </div>
            <p className="text-sm text-default-500">
              {client.municipalityName}, {client.provinceName} - {activeBarangayCount} of {coverageDraft.length}{' '}
              barangays enabled
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="flat" startContent={<Save size={16} />} onPress={saveClient}>
            Save
          </Button>
          {client.status !== 'active' ? (
            <Button color="success" onPress={() => setStatus('active')}>
              Activate
            </Button>
          ) : (
            <Button color="danger" variant="flat" onPress={() => setStatus('inactive')}>
              Deactivate
            </Button>
          )}
          <Tooltip content={canDelete ? 'Delete client' : 'Default client cannot be deleted'}>
            <Button
              isIconOnly
              color="danger"
              variant="light"
              aria-label="Delete client"
              isDisabled={!canDelete}
              onPress={() => setIsDeleteOpen(true)}
            >
              <Trash2 size={18} />
            </Button>
          </Tooltip>
        </div>
      </div>

      <ClientRequestDetails client={client} request={request} />

      <Card className="border border-default-200">
        <CardBody className="gap-4">
          <div>
            <h2 className="text-xl font-semibold">Client Setup</h2>
            <p className="text-sm text-default-500">Weather settings and active barangay coverage for resident signup.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input
              label="Weather Key"
              value={coordinateDraft.key}
              onValueChange={value => setCoordinateDraft(prev => ({ ...prev, key: value }))}
            />
            <Input
              label="Weather Latitude"
              value={coordinateDraft.lat}
              onValueChange={value => setCoordinateDraft(prev => ({ ...prev, lat: value }))}
            />
            <Input
              label="Weather Longitude"
              value={coordinateDraft.lng}
              onValueChange={value => setCoordinateDraft(prev => ({ ...prev, lng: value }))}
            />
          </div>
          <ClientCoverageEditor coverage={coverageDraft} onCoverageChange={setCoverageDraft} />
        </CardBody>
      </Card>

      <ClientAdminsTable admins={admins} />

      <ClientDeleteModal
        client={client}
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onDelete={deleteClient}
      />
    </div>
  );
};
