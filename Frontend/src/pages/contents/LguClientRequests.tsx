import { API_ENDPOINTS } from '@/config/endPoints';
import { ClientCoverageEditor } from '@/pages/contents/SuperAdmin/components/ClientCoverageEditor';
import { MapSettingsPreview } from '@/pages/contents/SuperAdmin/components/MapSettingsPreview';
import { MapSettingsHelpModal } from '@/pages/contents/SuperAdmin/components/MapSettingsHelpModal';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type {
  ClientChangeRequest,
  ClientCoverageBarangay,
  ClientMapSettings,
  LguClientResponse,
} from '@/pages/contents/SuperAdmin/types';
import {
  formatDateTime,
  formatClientChangeRequestType,
  getToken,
  hasMapSettingsErrors,
  mapSettingPlaceholders,
  statusColor,
  validateMapSettingsDraft,
} from '@/pages/contents/SuperAdmin/utils';
import { Button, Card, CardBody, Chip, Input, Tab, Tabs, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, addToast } from '@heroui/react';
import axios from 'axios';
import { Send, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const stringify = (value: unknown) => (value === null || value === undefined ? '' : String(value));

export const LguClientRequests = () => {
  const { data: clientData, refetch: refetchClient } = useSuperFetch<LguClientResponse>(
    API_ENDPOINTS.LGU_ADMIN.CLIENT,
    'LGU client'
  );
  const { data: requestData, loading, refetch } = useSuperFetch<{ requests: ClientChangeRequest[] }>(
    API_ENDPOINTS.LGU_ADMIN.CHANGE_REQUESTS,
    'LGU client requests'
  );

  const client = clientData?.client;
  const isWriteLocked = client?.status === 'deletion_scheduled' || client?.status === 'deleting' || client?.status === 'deleted';
  const [clientName, setClientName] = useState('');
  const [weatherDraft, setWeatherDraft] = useState({ key: '', lat: '', lng: '' });
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
  const [coverageDraft, setCoverageDraft] = useState<ClientCoverageBarangay[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [mapErrors, setMapErrors] = useState<ReturnType<typeof validateMapSettingsDraft>>({});

  useEffect(() => {
    if (!client) return;
    setClientName(client.name);
    setWeatherDraft({
      key: client.weatherLocationKey,
      lat: stringify(client.weatherLatitude),
      lng: stringify(client.weatherLongitude),
    });
    const settings = client.mapSettings;
    setMapDraft({
      centerLatitude: stringify(settings?.centerLatitude ?? client.weatherLatitude),
      centerLongitude: stringify(settings?.centerLongitude ?? client.weatherLongitude),
      minZoom: stringify(settings?.minZoom ?? 13),
      zoom: stringify(settings?.zoom ?? 15),
      maxZoom: stringify(settings?.maxZoom ?? 18),
      north: stringify(settings?.maxBounds?.north),
      south: stringify(settings?.maxBounds?.south),
      east: stringify(settings?.maxBounds?.east),
      west: stringify(settings?.maxBounds?.west),
    });
    setCoverageDraft(client.barangays);
    setMapErrors({});
  }, [client]);

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

  const submitProposal = async (type: ClientChangeRequest['type'], proposedChanges: Record<string, unknown>) => {
    if (isWriteLocked) {
      addToast({ title: 'Client changes are locked', description: 'Deletion is scheduled for this client.', color: 'warning' });
      return;
    }

    const token = await getToken();
    await axios.post(
      API_ENDPOINTS.LGU_ADMIN.CREATE_CHANGE_REQUEST,
      { type, proposedChanges },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    addToast({ title: 'Proposal submitted', color: 'success' });
    refetch();
    refetchClient();
  };

  const cancelProposal = async (request: ClientChangeRequest) => {
    if (isWriteLocked) {
      addToast({ title: 'Client changes are locked', description: 'Deletion is scheduled for this client.', color: 'warning' });
      return;
    }

    const token = await getToken();
    await axios.post(
      API_ENDPOINTS.LGU_ADMIN.CANCEL_CHANGE_REQUEST(request.id),
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    addToast({ title: 'Proposal cancelled', color: 'success' });
    refetch();
  };

  const submitMapSettings = () => {
    const errors = validateMapSettingsDraft(mapDraft);
    setMapErrors(errors);
    if (hasMapSettingsErrors(errors)) {
      addToast({
        title: 'Review map settings',
        description: Object.values(errors)[0],
        color: 'warning',
      });
      return;
    }

    const mapSettings: ClientMapSettings = {
      centerLatitude: Number(mapDraft.centerLatitude),
      centerLongitude: Number(mapDraft.centerLongitude),
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
      boundarySource: client?.mapSettings?.boundarySource ?? null,
      boundaryVerified: client?.mapSettings?.boundaryVerified ?? false,
    };
    submitProposal('map_settings', { mapSettings });
  };

  return (
    <div className="w-full space-y-5 p-4">
      <div>
        <h1 className="text-3xl font-bold">LGU Coordination</h1>
        <p className="text-sm text-default-500">
          Submit client setup proposals for Super Admin review. Changes apply only after approval.
        </p>
      </div>

      {isWriteLocked && (
        <div className="rounded-md border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800">
          Client deletion is scheduled for {formatDateTime(client?.deletionEffectiveAt)}. LGU proposals are read-only
          during the deletion grace period.
        </div>
      )}

      <Tabs aria-label="LGU coordination tabs">
        <Tab key="settings" title="Client Settings">
          <div className="grid gap-4 pt-4 xl:grid-cols-2">
            <Card className="border border-default-200">
              <CardBody className="gap-4">
                <h2 className="text-xl font-semibold">Center Coordinates</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    label="Weather Key"
                    value={weatherDraft.key}
                    isDisabled={isWriteLocked}
                    onValueChange={key => setWeatherDraft(prev => ({ ...prev, key }))}
                  />
                  <Input
                    label="Latitude"
                    value={weatherDraft.lat}
                    isDisabled={isWriteLocked}
                    onValueChange={lat => setWeatherDraft(prev => ({ ...prev, lat }))}
                  />
                  <Input
                    label="Longitude"
                    value={weatherDraft.lng}
                    isDisabled={isWriteLocked}
                    onValueChange={lng => setWeatherDraft(prev => ({ ...prev, lng }))}
                  />
                </div>
                <Button
                  color="primary"
                  startContent={<Send size={16} />}
                  isDisabled={isWriteLocked}
                  onPress={() =>
                    submitProposal('weather_coordinates', {
                      weatherLocationKey: weatherDraft.key,
                      weatherLatitude: Number(weatherDraft.lat),
                      weatherLongitude: Number(weatherDraft.lng),
                    })
                  }
                >
                  Submit Center Proposal
                </Button>
              </CardBody>
            </Card>

            <Card className="border border-default-200">
              <CardBody className="gap-4">
                <h2 className="text-xl font-semibold">Client Information</h2>
                <Input label="LGU Name" value={clientName} isDisabled={isWriteLocked} onValueChange={setClientName} />
                <Button
                  color="primary"
                  startContent={<Send size={16} />}
                  isDisabled={isWriteLocked}
                  onPress={() => submitProposal('client_info', { name: clientName })}
                >
                  Submit Info Proposal
                </Button>
              </CardBody>
            </Card>

            <Card className="border border-default-200 xl:col-span-2">
              <CardBody className="gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Map Settings</h2>
                    <p className="text-sm text-default-500">
                      Submit preferred map center, zoom, and city boundary limits for Super Admin review.
                    </p>
                  </div>
                  <MapSettingsHelpModal />
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="md:col-span-3">
                    <MapSettingsPreview
                      draft={mapDraft}
                      onDraftChange={updateMapDraft}
                      onDraftPatch={updateMapDraftPatch}
                    />
                  </div>
                  <Input
                    label="Center Latitude"
                    type="number"
                    step="any"
                    placeholder={mapSettingPlaceholders.centerLatitude}
                    value={mapDraft.centerLatitude}
                    isDisabled={isWriteLocked}
                    isInvalid={Boolean(mapErrors.centerLatitude)}
                    errorMessage={mapErrors.centerLatitude}
                    onValueChange={centerLatitude => updateMapDraft('centerLatitude', centerLatitude)}
                  />
                  <Input
                    label="Center Longitude"
                    type="number"
                    step="any"
                    placeholder={mapSettingPlaceholders.centerLongitude}
                    value={mapDraft.centerLongitude}
                    isDisabled={isWriteLocked}
                    isInvalid={Boolean(mapErrors.centerLongitude)}
                    errorMessage={mapErrors.centerLongitude}
                    onValueChange={centerLongitude => updateMapDraft('centerLongitude', centerLongitude)}
                  />
                  <Input
                    label="Minimum Zoom"
                    type="number"
                    step="1"
                    placeholder={mapSettingPlaceholders.minZoom}
                    value={mapDraft.minZoom}
                    isDisabled={isWriteLocked}
                    isInvalid={Boolean(mapErrors.minZoom)}
                    errorMessage={mapErrors.minZoom}
                    onValueChange={minZoom => updateMapDraft('minZoom', minZoom)}
                  />
                  <Input
                    label="Default Zoom"
                    type="number"
                    step="1"
                    placeholder={mapSettingPlaceholders.zoom}
                    value={mapDraft.zoom}
                    isDisabled={isWriteLocked}
                    isInvalid={Boolean(mapErrors.zoom)}
                    errorMessage={mapErrors.zoom}
                    onValueChange={zoom => updateMapDraft('zoom', zoom)}
                  />
                  <Input
                    label="Maximum Zoom"
                    type="number"
                    step="1"
                    placeholder={mapSettingPlaceholders.maxZoom}
                    value={mapDraft.maxZoom}
                    isDisabled={isWriteLocked}
                    isInvalid={Boolean(mapErrors.maxZoom)}
                    errorMessage={mapErrors.maxZoom}
                    onValueChange={maxZoom => updateMapDraft('maxZoom', maxZoom)}
                  />
                  <Input
                    label="North Bound"
                    type="number"
                    step="any"
                    placeholder={mapSettingPlaceholders.north}
                    value={mapDraft.north}
                    isDisabled={isWriteLocked}
                    isInvalid={Boolean(mapErrors.north)}
                    errorMessage={mapErrors.north}
                    onValueChange={north => updateMapDraft('north', north)}
                  />
                  <Input
                    label="South Bound"
                    type="number"
                    step="any"
                    placeholder={mapSettingPlaceholders.south}
                    value={mapDraft.south}
                    isDisabled={isWriteLocked}
                    isInvalid={Boolean(mapErrors.south)}
                    errorMessage={mapErrors.south}
                    onValueChange={south => updateMapDraft('south', south)}
                  />
                  <Input
                    label="East Bound"
                    type="number"
                    step="any"
                    placeholder={mapSettingPlaceholders.east}
                    value={mapDraft.east}
                    isDisabled={isWriteLocked}
                    isInvalid={Boolean(mapErrors.east)}
                    errorMessage={mapErrors.east}
                    onValueChange={east => updateMapDraft('east', east)}
                  />
                  <Input
                    label="West Bound"
                    type="number"
                    step="any"
                    placeholder={mapSettingPlaceholders.west}
                    value={mapDraft.west}
                    isDisabled={isWriteLocked}
                    isInvalid={Boolean(mapErrors.west)}
                    errorMessage={mapErrors.west}
                    onValueChange={west => updateMapDraft('west', west)}
                  />
                </div>
                <Button color="primary" startContent={<Send size={16} />} isDisabled={isWriteLocked} onPress={submitMapSettings}>
                  Submit Map Proposal
                </Button>
              </CardBody>
            </Card>

            <Card className="border border-default-200 xl:col-span-2">
              <CardBody className="gap-4">
                <h2 className="text-xl font-semibold">Barangay Coverage</h2>
                <ClientCoverageEditor
                  coverage={coverageDraft}
                  onCoverageChange={nextCoverage => {
                    if (!isWriteLocked) setCoverageDraft(nextCoverage);
                  }}
                />
                <Button
                  color="primary"
                  startContent={<Send size={16} />}
                  isDisabled={isWriteLocked}
                  onPress={() => submitProposal('barangay_coverage', { barangays: coverageDraft })}
                >
                  Submit Coverage Proposal
                </Button>
              </CardBody>
            </Card>

            <Card className="border border-default-200">
              <CardBody className="gap-4">
                <h2 className="text-xl font-semibold">Invite LGU Admin</h2>
                <Input label="Email" type="email" value={inviteEmail} isDisabled={isWriteLocked} onValueChange={setInviteEmail} />
                <Button
                  color="primary"
                  startContent={<Send size={16} />}
                  isDisabled={isWriteLocked}
                  onPress={() => submitProposal('admin_invite', { email: inviteEmail })}
                >
                  Submit Invite Proposal
                </Button>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="history" title="Request History">
          <Card className="mt-4 border border-default-200">
            <CardBody>
              <Table aria-label="LGU client request history" removeWrapper>
                <TableHeader>
                  <TableColumn>Type</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn>Date</TableColumn>
                  <TableColumn>Review Note</TableColumn>
                  <TableColumn>Actions</TableColumn>
                </TableHeader>
                <TableBody emptyContent={loading ? 'Loading requests...' : 'No proposals yet.'}>
                  {(requestData?.requests ?? []).map(request => (
                    <TableRow key={request.id}>
                      <TableCell>{formatClientChangeRequestType(request.type)}</TableCell>
                      <TableCell>
                        <Chip size="sm" color={statusColor(request.status) as any}>
                          {request.status}
                        </Chip>
                      </TableCell>
                      <TableCell>{formatDateTime(request.createdAt || request.requestedAt)}</TableCell>
                      <TableCell>{request.reviewNote || 'None'}</TableCell>
                      <TableCell>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          color="danger"
                          aria-label="Cancel proposal"
                          isDisabled={request.status !== 'pending' || isWriteLocked}
                          onPress={() => cancelProposal(request)}
                        >
                          <X size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default LguClientRequests;
