import { API_ENDPOINTS } from '@/config/endPoints';
import { ClientAdminsTable } from '@/pages/contents/SuperAdmin/components/ClientAdminsTable';
import { ClientCoverageEditor } from '@/pages/contents/SuperAdmin/components/ClientCoverageEditor';
import { ClientDeleteModal } from '@/pages/contents/SuperAdmin/components/ClientDeleteModal';
import { MapSettingsHelpModal } from '@/pages/contents/SuperAdmin/components/MapSettingsHelpModal';
import { MapSettingsPreview } from '@/pages/contents/SuperAdmin/components/MapSettingsPreview';
import { ClientRequestDetails } from '@/pages/contents/SuperAdmin/components/ClientRequestDetails';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type { ClientCoverageBarangay, ClientDeletionPreview, ClientDetailResponse } from '@/pages/contents/SuperAdmin/types';
import {
  formatDateTime,
  formatStatusLabel,
  getToken,
  hasWeatherCoordinateErrors,
  hasMapSettingsErrors,
  mapSettingPlaceholders,
  statusColor,
  validateWeatherCoordinateDraft,
  validateMapSettingsDraft,
  weatherCoordinatePlaceholders,
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
  Textarea,
  Tooltip,
  addToast,
} from '@heroui/react';
import axios from 'axios';
import { ArrowLeft, Save, Trash2, Upload } from 'lucide-react';
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
  const [mapDraft, setMapDraft] = useState({
    centerLatitude: '',
    centerLongitude: '',
    minZoom: '13',
    zoom: '15',
    maxZoom: '18',
    north: '',
    south: '',
    east: '',
    west: '',
  });
  const [boundarySource, setBoundarySource] = useState('');
  const [boundaryGeoJson, setBoundaryGeoJson] = useState('');
  const [coverageDraft, setCoverageDraft] = useState<ClientCoverageBarangay[]>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletionPreview, setDeletionPreview] = useState<ClientDeletionPreview | null>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSchedulingDeletion, setIsSchedulingDeletion] = useState(false);
  const [isCancellingDeletion, setIsCancellingDeletion] = useState(false);
  const [statusTarget, setStatusTarget] = useState<'active' | 'inactive' | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isInviteAdminOpen, setIsInviteAdminOpen] = useState(false);
  const [inviteAdminEmail, setInviteAdminEmail] = useState('');
  const [isInvitingAdmin, setIsInvitingAdmin] = useState(false);
  const [coordinateErrors, setCoordinateErrors] = useState<ReturnType<typeof validateWeatherCoordinateDraft>>({});
  const [mapErrors, setMapErrors] = useState<ReturnType<typeof validateMapSettingsDraft>>({});

  const client = data?.client;
  const request = data?.request ?? null;
  const admins = data?.admins ?? [];
  const isDeletionLocked = Boolean(
    client && ['deletion_scheduled', 'deleting', 'deleted'].includes(client.status)
  );
  const canScheduleDeletion = Boolean(client && (client.status === 'draft' || client.status === 'inactive'));
  const canCancelDeletion = client?.status === 'deletion_scheduled';

  useEffect(() => {
    if (!client) return;

    setCoordinateDraft({
      key: client.weatherLocationKey || '',
      lat: client.weatherLatitude?.toString() ?? '',
      lng: client.weatherLongitude?.toString() ?? '',
    });
    setMapDraft({
      centerLatitude: (client.mapSettings?.centerLatitude ?? client.weatherLatitude)?.toString() ?? '',
      centerLongitude: (client.mapSettings?.centerLongitude ?? client.weatherLongitude)?.toString() ?? '',
      minZoom: client.mapSettings?.minZoom?.toString() ?? '13',
      zoom: client.mapSettings?.zoom?.toString() ?? '15',
      maxZoom: client.mapSettings?.maxZoom?.toString() ?? '18',
      north: client.mapSettings?.maxBounds?.north?.toString() ?? '',
      south: client.mapSettings?.maxBounds?.south?.toString() ?? '',
      east: client.mapSettings?.maxBounds?.east?.toString() ?? '',
      west: client.mapSettings?.maxBounds?.west?.toString() ?? '',
    });
    setBoundarySource(client.mapSettings?.boundarySource || '');
    setCoverageDraft(client.barangays);
    setCoordinateErrors({});
    setMapErrors({});
  }, [client]);

  useEffect(() => {
    if (!client || !isDeleteOpen) {
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
          API_ENDPOINTS.SUPER_ADMIN.CLIENT_DELETION_PREVIEW(client.id),
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (isMounted) setDeletionPreview(response.data.preview);
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || 'Failed to load deletion preview'
          : 'Failed to load deletion preview';
        addToast({ title: message, color: 'danger' });
        if (isMounted) setIsDeleteOpen(false);
      } finally {
        if (isMounted) setIsLoadingPreview(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [client, isDeleteOpen]);

  const updateCoordinateDraft = (key: keyof typeof coordinateDraft, value: string) => {
    const nextDraft = { ...coordinateDraft, [key]: value };
    setCoordinateDraft(nextDraft);
    setCoordinateErrors(validateWeatherCoordinateDraft(nextDraft));
  };

  const updateMapDraftPatch = (patch: Partial<typeof mapDraft>) => {
    setMapDraft(prev => {
      const nextDraft = { ...prev, ...patch };
      setMapErrors(validateMapSettingsDraft(nextDraft));
      return nextDraft;
    });
  };

  const updateMapDraft = (key: keyof typeof mapDraft, value: string) => {
    updateMapDraftPatch({ [key]: value });
  };

  const saveClient = async (options: { showToast?: boolean; refetchAfter?: boolean } = {}) => {
    const { showToast = true, refetchAfter = true } = options;
    if (!client) return false;
    if (isDeletionLocked) {
      addToast({ title: 'Client deletion is locked', description: 'Cancel scheduled deletion before editing.', color: 'warning' });
      return false;
    }

    const coordinateValidation = validateWeatherCoordinateDraft(coordinateDraft);
    const errors = validateMapSettingsDraft(mapDraft);
    setCoordinateErrors(coordinateValidation);
    setMapErrors(errors);
    if (hasWeatherCoordinateErrors(coordinateValidation)) {
      addToast({
        title: 'Review center coordinates',
        description: Object.values(coordinateValidation)[0],
        color: 'warning',
      });
      return false;
    }

    if (hasMapSettingsErrors(errors)) {
      addToast({
        title: 'Review map settings',
        description: Object.values(errors)[0],
        color: 'warning',
      });
      return false;
    }

    const token = await getToken();
    await axios.patch(
      API_ENDPOINTS.SUPER_ADMIN.UPDATE_CLIENT(client.id),
      {
        weatherLocationKey: coordinateDraft.key || client.weatherLocationKey,
        weatherLatitude: coordinateDraft.lat ? Number(coordinateDraft.lat) : null,
        weatherLongitude: coordinateDraft.lng ? Number(coordinateDraft.lng) : null,
        mapSettings: {
          centerLatitude: mapDraft.centerLatitude ? Number(mapDraft.centerLatitude) : null,
          centerLongitude: mapDraft.centerLongitude ? Number(mapDraft.centerLongitude) : null,
          minZoom: Number(mapDraft.minZoom),
          zoom: Number(mapDraft.zoom),
          maxZoom: Number(mapDraft.maxZoom),
          maxBounds:
            mapDraft.north && mapDraft.south && mapDraft.east && mapDraft.west
              ? {
                  north: Number(mapDraft.north),
                  south: Number(mapDraft.south),
                  east: Number(mapDraft.east),
                  west: Number(mapDraft.west),
                }
              : null,
          boundarySource: boundarySource || null,
          boundaryVerified: client.mapSettings?.boundaryVerified ?? false,
        },
        barangays: coverageDraft,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (showToast) addToast({ title: 'Client updated', color: 'success' });
    if (refetchAfter) refetch();
    return true;
  };

  const uploadBoundary = async () => {
    if (!client) return;
    if (isDeletionLocked) return;
    try {
      const geoJson = JSON.parse(boundaryGeoJson);
      const token = await getToken();
      await axios.post(
        API_ENDPOINTS.SUPER_ADMIN.CLIENT_BOUNDARY(client.id),
        { geoJson, source: boundarySource },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast({ title: 'Boundary uploaded', color: 'success' });
      setBoundaryGeoJson('');
      refetch();
    } catch (error) {
      addToast({ title: 'Invalid boundary GeoJSON', color: 'danger' });
    }
  };

  const setStatus = async (status: 'active' | 'inactive') => {
    if (!client) return;
    if (isDeletionLocked) return;

    try {
      setIsUpdatingStatus(true);
      if (status === 'active') {
        const saved = await saveClient({ showToast: false, refetchAfter: false });
        if (!saved) return;
      }

      const token = await getToken();
      const endpoint =
        status === 'active'
          ? API_ENDPOINTS.SUPER_ADMIN.ACTIVATE_CLIENT(client.id)
          : API_ENDPOINTS.SUPER_ADMIN.DEACTIVATE_CLIENT(client.id);
      await axios.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
      addToast({ title: status === 'active' ? 'Client activated' : 'Client deactivated', color: 'success' });
      setStatusTarget(null);
      refetch();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || 'Failed to update client status'
        : 'Failed to update client status';
      addToast({ title: message, color: 'danger' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const scheduleClientDeletion = async () => {
    if (!client) return;

    try {
      setIsSchedulingDeletion(true);
      const token = await getToken();

      await axios.post(
        API_ENDPOINTS.SUPER_ADMIN.SCHEDULE_CLIENT_DELETION(client.id),
        { reason: deletionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      addToast({ title: 'Client deletion scheduled', color: 'success' });
      setIsDeleteOpen(false);
      refetch();
    } catch (error) {
      let message = 'Failed to schedule client deletion';

      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
        console.log('Failed to delete client:', error.response?.data);
      } else {
        console.log('Unexpected error:', error);
      }

      addToast({ title: message, color: 'danger' });
    } finally {
      setIsSchedulingDeletion(false);
    }
  };

  const cancelClientDeletion = async () => {
    if (!client) return;

    try {
      setIsCancellingDeletion(true);
      const token = await getToken();
      await axios.post(
        API_ENDPOINTS.SUPER_ADMIN.CANCEL_CLIENT_DELETION(client.id),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast({ title: 'Client deletion cancelled', color: 'success' });
      refetch();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || 'Failed to cancel client deletion'
        : 'Failed to cancel client deletion';
      addToast({ title: message, color: 'danger' });
    } finally {
      setIsCancellingDeletion(false);
    }
  };

  const inviteClientAdmin = async () => {
    if (!client) return;

    const email = inviteAdminEmail.trim().toLowerCase();
    if (!email) {
      addToast({ title: 'Email is required', description: 'Enter the LGU admin email address.', color: 'warning' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addToast({ title: 'Valid email is required', color: 'warning' });
      return;
    }
    if (isDeletionLocked) {
      addToast({ title: 'LGU admin invites are disabled for this client', color: 'warning' });
      return;
    }

    try {
      setIsInvitingAdmin(true);
      const token = await getToken();
      await axios.post(
        API_ENDPOINTS.SUPER_ADMIN.INVITE_ADMIN,
        { email, role: 'lgu_admin', clientId: client.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast({ title: 'LGU admin invited', color: 'success' });
      setInviteAdminEmail('');
      setIsInviteAdminOpen(false);
      refetch();
    } catch (error) {
      addToast({
        title: 'Invite failed',
        description: axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to invite LGU admin',
        color: 'danger',
      });
    } finally {
      setIsInvitingAdmin(false);
    }
  };

  const activeBarangayCount = coverageDraft.filter(barangay => barangay.isActive !== false).length;

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
                {formatStatusLabel(client.status)}
              </Chip>
            </div>
            <p className="text-sm text-default-500">
              {client.municipalityName}, {client.provinceName} - {activeBarangayCount} of {coverageDraft.length}{' '}
              barangays enabled
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="flat"
            startContent={<Save size={16} />}
            isDisabled={isDeletionLocked}
            onPress={() => void saveClient()}
          >
            Save
          </Button>
          {client.status !== 'active' ? (
            <Button color="success" isDisabled={isDeletionLocked} onPress={() => setStatusTarget('active')}>
              Activate
            </Button>
          ) : (
            <Button color="danger" variant="flat" isDisabled={isDeletionLocked} onPress={() => setStatusTarget('inactive')}>
              Deactivate
            </Button>
          )}
          {canCancelDeletion && (
            <Button color="warning" variant="flat" isLoading={isCancellingDeletion} onPress={cancelClientDeletion}>
              Cancel Deletion
            </Button>
          )}
          <Tooltip content={canScheduleDeletion ? 'Schedule client deletion' : 'Only draft or inactive clients can be scheduled'}>
            <Button
              isIconOnly
              color="danger"
              variant="light"
              aria-label="Schedule client deletion"
              isDisabled={!canScheduleDeletion}
              onPress={() => setIsDeleteOpen(true)}
            >
              <Trash2 size={18} />
            </Button>
          </Tooltip>
        </div>
      </div>

      {client.status === 'deletion_scheduled' && (
        <div className="rounded-md border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800">
          Deletion is scheduled for {formatDateTime(client.deletionEffectiveAt)}. LGU admin and resident writes are
          locked until deletion is cancelled or processed.
        </div>
      )}

      <ClientRequestDetails client={client} request={request} />

      <Card className="border border-default-200">
        <CardBody className="gap-4">
          <div>
            <h2 className="text-xl font-semibold">Client Setup</h2>
            <p className="text-sm text-default-500">
              Center coordinate settings and active barangay coverage for resident signup.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input
              label="Weather Key"
              placeholder={weatherCoordinatePlaceholders.key}
              value={coordinateDraft.key}
              isInvalid={Boolean(coordinateErrors.key)}
              errorMessage={coordinateErrors.key}
              onValueChange={value => updateCoordinateDraft('key', value)}
              isDisabled={isDeletionLocked}
            />
            <Input
              label="Center Latitude"
              type="number"
              step="any"
              placeholder={weatherCoordinatePlaceholders.lat}
              value={coordinateDraft.lat}
              isInvalid={Boolean(coordinateErrors.lat)}
              errorMessage={coordinateErrors.lat}
              onValueChange={value => updateCoordinateDraft('lat', value)}
              isDisabled={isDeletionLocked}
            />
            <Input
              label="Center Longitude"
              type="number"
              step="any"
              placeholder={weatherCoordinatePlaceholders.lng}
              value={coordinateDraft.lng}
              isInvalid={Boolean(coordinateErrors.lng)}
              errorMessage={coordinateErrors.lng}
              onValueChange={value => updateCoordinateDraft('lng', value)}
              isDisabled={isDeletionLocked}
            />
          </div>
          <ClientCoverageEditor
            coverage={coverageDraft}
            onCoverageChange={nextCoverage => {
              if (!isDeletionLocked) setCoverageDraft(nextCoverage);
            }}
          />
        </CardBody>
      </Card>

      <Card className="border border-default-200">
        <CardBody className="gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Map Settings</h2>
              <p className="text-sm text-default-500">
                LGU admin map defaults and verified municipality/city bounds.
              </p>
            </div>
            <MapSettingsHelpModal />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-3">
              <MapSettingsPreview
                draft={mapDraft}
                onDraftChange={updateMapDraft}
                onDraftPatch={updateMapDraftPatch}
                description="Click the map or drag the marker to update the client map center before saving."
              />
            </div>
            <Input
              label="Center Latitude"
              type="number"
              step="any"
              placeholder={mapSettingPlaceholders.centerLatitude}
              value={mapDraft.centerLatitude}
              isInvalid={Boolean(mapErrors.centerLatitude)}
              errorMessage={mapErrors.centerLatitude}
              onValueChange={centerLatitude => updateMapDraft('centerLatitude', centerLatitude)}
              isDisabled={isDeletionLocked}
            />
            <Input
              label="Center Longitude"
              type="number"
              step="any"
              placeholder={mapSettingPlaceholders.centerLongitude}
              value={mapDraft.centerLongitude}
              isInvalid={Boolean(mapErrors.centerLongitude)}
              errorMessage={mapErrors.centerLongitude}
              onValueChange={centerLongitude => updateMapDraft('centerLongitude', centerLongitude)}
              isDisabled={isDeletionLocked}
            />
            <Input
              label="Minimum Zoom"
              type="number"
              step="1"
              placeholder={mapSettingPlaceholders.minZoom}
              value={mapDraft.minZoom}
              isInvalid={Boolean(mapErrors.minZoom)}
              errorMessage={mapErrors.minZoom}
              onValueChange={minZoom => updateMapDraft('minZoom', minZoom)}
              isDisabled={isDeletionLocked}
            />
            <Input
              label="Default Zoom"
              type="number"
              step="1"
              placeholder={mapSettingPlaceholders.zoom}
              value={mapDraft.zoom}
              isInvalid={Boolean(mapErrors.zoom)}
              errorMessage={mapErrors.zoom}
              onValueChange={zoom => updateMapDraft('zoom', zoom)}
              isDisabled={isDeletionLocked}
            />
            <Input
              label="Maximum Zoom"
              type="number"
              step="1"
              placeholder={mapSettingPlaceholders.maxZoom}
              value={mapDraft.maxZoom}
              isInvalid={Boolean(mapErrors.maxZoom)}
              errorMessage={mapErrors.maxZoom}
              onValueChange={maxZoom => updateMapDraft('maxZoom', maxZoom)}
              isDisabled={isDeletionLocked}
            />
            <Input
              label="Boundary Source"
              placeholder={mapSettingPlaceholders.boundarySource}
              value={boundarySource}
              onValueChange={setBoundarySource}
              isDisabled={isDeletionLocked}
            />
            <Input
              label="North Bound"
              type="number"
              step="any"
              placeholder={mapSettingPlaceholders.north}
              value={mapDraft.north}
              isInvalid={Boolean(mapErrors.north)}
              errorMessage={mapErrors.north}
              onValueChange={north => updateMapDraft('north', north)}
              isDisabled={isDeletionLocked}
            />
            <Input
              label="South Bound"
              type="number"
              step="any"
              placeholder={mapSettingPlaceholders.south}
              value={mapDraft.south}
              isInvalid={Boolean(mapErrors.south)}
              errorMessage={mapErrors.south}
              onValueChange={south => updateMapDraft('south', south)}
              isDisabled={isDeletionLocked}
            />
            <Input
              label="East Bound"
              type="number"
              step="any"
              placeholder={mapSettingPlaceholders.east}
              value={mapDraft.east}
              isInvalid={Boolean(mapErrors.east)}
              errorMessage={mapErrors.east}
              onValueChange={east => updateMapDraft('east', east)}
              isDisabled={isDeletionLocked}
            />
            <Input
              label="West Bound"
              type="number"
              step="any"
              placeholder={mapSettingPlaceholders.west}
              value={mapDraft.west}
              isInvalid={Boolean(mapErrors.west)}
              errorMessage={mapErrors.west}
              onValueChange={west => updateMapDraft('west', west)}
              isDisabled={isDeletionLocked}
            />
          </div>
          <Textarea
            label="Boundary GeoJSON"
            placeholder={mapSettingPlaceholders.boundaryGeoJson}
            minRows={4}
            value={boundaryGeoJson}
            onValueChange={setBoundaryGeoJson}
            isDisabled={isDeletionLocked}
          />
          <Button
            variant="flat"
            startContent={<Upload size={16} />}
            onPress={uploadBoundary}
            isDisabled={!boundaryGeoJson.trim() || isDeletionLocked}
          >
            Upload Boundary
          </Button>
        </CardBody>
      </Card>

      <ClientAdminsTable
        admins={admins}
        clientStatus={client.status}
        onAdminStatusChanged={refetch}
        onAddAdmin={() => setIsInviteAdminOpen(true)}
        isAddAdminDisabled={isDeletionLocked}
      />

      <ClientDeleteModal
        client={client}
        preview={deletionPreview}
        isLoadingPreview={isLoadingPreview}
        isScheduling={isSchedulingDeletion}
        reason={deletionReason}
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onReasonChange={setDeletionReason}
        onScheduleDeletion={scheduleClientDeletion}
      />

      <Modal isOpen={Boolean(statusTarget)} onOpenChange={open => !open && setStatusTarget(null)} size="sm">
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {statusTarget === 'active' ? 'Activate LGU client?' : 'Deactivate LGU client?'}
              </ModalHeader>
              <ModalBody>
                {statusTarget === 'active' ? (
                  <p className="text-sm text-default-600">
                    Activate <span className="font-semibold">{client.name}</span>? Current setup changes on this page
                    will be saved before activation.
                  </p>
                ) : (
                  <p className="text-sm text-default-600">
                    Deactivate <span className="font-semibold">{client.name}</span>? LGU admins and residents will no
                    longer use this client while it is inactive.
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color={statusTarget === 'active' ? 'success' : 'danger'}
                  variant={statusTarget === 'active' ? 'solid' : 'flat'}
                  isLoading={isUpdatingStatus}
                  onPress={() => statusTarget && setStatus(statusTarget)}
                >
                  {statusTarget === 'active' ? 'Activate Client' : 'Deactivate Client'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isInviteAdminOpen}
        onOpenChange={open => {
          setIsInviteAdminOpen(open);
          if (!open) setInviteAdminEmail('');
        }}
        size="sm"
        isDismissable={!isInvitingAdmin}
      >
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span>Add LGU Admin</span>
                <span className="text-sm font-normal text-default-500">
                  Invite an admin for {client.name}. They can sign in with Google after the invite is saved.
                </span>
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Email"
                  type="email"
                  value={inviteAdminEmail}
                  onValueChange={setInviteAdminEmail}
                  isDisabled={isInvitingAdmin}
                  autoFocus
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose} isDisabled={isInvitingAdmin}>
                  Cancel
                </Button>
                <Button color="primary" isLoading={isInvitingAdmin} onPress={inviteClientAdmin}>
                  Send Invite
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};
