import { API_ENDPOINTS } from '@/config/endPoints';
import { ClientCoverageEditor } from '@/pages/contents/SuperAdmin/components/ClientCoverageEditor';
import { MapSettingsHelpModal } from '@/pages/contents/SuperAdmin/components/MapSettingsHelpModal';
import { MapSettingsPreview } from '@/pages/contents/SuperAdmin/components/MapSettingsPreview';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type {
  ClientChangeRequest,
  ClientCoverageBarangay,
  ClientLgu,
  ClientMapSettings,
  LguClientResponse,
} from '@/pages/contents/SuperAdmin/types';
import type { MapSettingsDraft, WeatherCoordinateDraft } from '@/pages/contents/SuperAdmin/utils';
import {
  formatClientChangeRequestType,
  formatDateTime,
  getToken,
  hasMapSettingsErrors,
  hasWeatherCoordinateErrors,
  mapSettingPlaceholders,
  statusColor,
  validateMapSettingsDraft,
  validateWeatherCoordinateDraft,
  weatherCoordinatePlaceholders,
} from '@/pages/contents/SuperAdmin/utils';
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  addToast,
} from '@heroui/react';
import axios from 'axios';
import { Send, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const stringify = (value: unknown) => (value === null || value === undefined ? '' : String(value));

const FIELD_LIMITS = {
  clientName: 120,
  weatherLocationKey: 80,
  inviteEmail: 254,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ClientInfoErrors = Partial<Record<'name', string>>;
type InviteErrors = Partial<Record<'email', string>>;
type CoverageErrors = Partial<Record<'barangays', string>>;

const parseDraftNumber = (value: string): number | null => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeComparableValue = (value: unknown): unknown => {
  if (value === undefined || value === null || value === '') return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return Number.isFinite(value) ? Number(value.toFixed(6)) : null;
  if (Array.isArray(value)) return value.map(normalizeComparableValue);
  if (typeof value === 'object' && value) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeComparableValue(entry)])
    );
  }

  return typeof value === 'string' ? value.trim() : value;
};

const areValuesEqual = (left: unknown, right: unknown) =>
  JSON.stringify(normalizeComparableValue(left)) === JSON.stringify(normalizeComparableValue(right));

const getWeatherDraftFromClient = (client: ClientLgu): WeatherCoordinateDraft => ({
  key: client.weatherLocationKey || '',
  lat: stringify(client.weatherLatitude),
  lng: stringify(client.weatherLongitude),
});

const getMapDraftFromClient = (client: ClientLgu): MapSettingsDraft => {
  const settings = client.mapSettings;

  return {
    centerLatitude: stringify(settings?.centerLatitude ?? client.weatherLatitude),
    centerLongitude: stringify(settings?.centerLongitude ?? client.weatherLongitude),
    minZoom: stringify(settings?.minZoom ?? 13),
    zoom: stringify(settings?.zoom ?? 15),
    maxZoom: stringify(settings?.maxZoom ?? 18),
    north: stringify(settings?.maxBounds?.north),
    south: stringify(settings?.maxBounds?.south),
    east: stringify(settings?.maxBounds?.east),
    west: stringify(settings?.maxBounds?.west),
  };
};

const getWeatherProposal = (draft: WeatherCoordinateDraft) => ({
  weatherLocationKey: draft.key.trim(),
  weatherLatitude: parseDraftNumber(draft.lat),
  weatherLongitude: parseDraftNumber(draft.lng),
});

const getCurrentWeatherSnapshot = (client: ClientLgu) => ({
  weatherLocationKey: client.weatherLocationKey || '',
  weatherLatitude: client.weatherLatitude,
  weatherLongitude: client.weatherLongitude,
});

const getMapSettingsProposal = (draft: MapSettingsDraft, client?: ClientLgu | null): ClientMapSettings => ({
  centerLatitude: parseDraftNumber(draft.centerLatitude),
  centerLongitude: parseDraftNumber(draft.centerLongitude),
  minZoom: Number(draft.minZoom),
  zoom: Number(draft.zoom),
  maxZoom: Number(draft.maxZoom),
  maxBounds:
    draft.north.trim() && draft.south.trim() && draft.east.trim() && draft.west.trim()
      ? {
          north: Number(draft.north),
          south: Number(draft.south),
          east: Number(draft.east),
          west: Number(draft.west),
        }
      : null,
  boundarySource: client?.mapSettings?.boundarySource ?? null,
  boundaryVerified: client?.mapSettings?.boundaryVerified ?? false,
});

const getComparableMapSettings = (settings?: ClientMapSettings | null): ClientMapSettings => ({
  centerLatitude: settings?.centerLatitude ?? null,
  centerLongitude: settings?.centerLongitude ?? null,
  minZoom: settings?.minZoom ?? 13,
  zoom: settings?.zoom ?? 15,
  maxZoom: settings?.maxZoom ?? 18,
  maxBounds: settings?.maxBounds ?? null,
  boundarySource: settings?.boundarySource ?? null,
  boundaryVerified: settings?.boundaryVerified ?? false,
});

const getComparableCoverage = (coverage: ClientCoverageBarangay[]) =>
  coverage.map(barangay => ({
    barangayCode: barangay.barangayCode ?? null,
    barangayLabel: barangay.barangayLabel,
    value: barangay.value,
    isActive: barangay.isActive !== false,
    latitude: barangay.latitude ?? null,
    longitude: barangay.longitude ?? null,
    verified: barangay.verified !== false,
  }));

const validateWeatherDraft = (draft: WeatherCoordinateDraft): ReturnType<typeof validateWeatherCoordinateDraft> => {
  const errors = validateWeatherCoordinateDraft(draft);
  const weatherKey = draft.key.trim();

  if (weatherKey.length > FIELD_LIMITS.weatherLocationKey) {
    errors.key = `Weather key should not exceed ${FIELD_LIMITS.weatherLocationKey} characters.`;
  }

  return errors;
};

const validateClientInfoDraft = (name: string): ClientInfoErrors => {
  const trimmedName = name.trim();
  if (!trimmedName) return { name: 'LGU name is required.' };
  if (trimmedName.length > FIELD_LIMITS.clientName) {
    return { name: `LGU name should not exceed ${FIELD_LIMITS.clientName} characters.` };
  }
  return {};
};

const validateInviteDraft = (email: string): InviteErrors => {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) return { email: 'Email is required.' };
  if (trimmedEmail.length > FIELD_LIMITS.inviteEmail) {
    return { email: `Email should not exceed ${FIELD_LIMITS.inviteEmail} characters.` };
  }
  if (!EMAIL_PATTERN.test(trimmedEmail)) return { email: 'Enter a valid email address.' };
  return {};
};

const validateCoverageDraft = (coverage: ClientCoverageBarangay[]): CoverageErrors => {
  if (coverage.length === 0) return { barangays: 'Barangay coverage is required.' };
  if (!coverage.some(barangay => barangay.isActive !== false)) {
    return { barangays: 'Keep at least one barangay enabled.' };
  }
  return {};
};

const hasErrors = (errors: object) => Object.keys(errors).length > 0;

const COORDINATION_SECTIONS = [
  { id: 'center-coordinates', title: 'Center Coordinates' },
  { id: 'client-information', title: 'Client Information' },
  { id: 'map-settings', title: 'Map Settings' },
  { id: 'barangay-coverage', title: 'Barangay Coverage' },
  { id: 'invite-admin', title: 'Invite LGU Admin' },
  { id: 'request-history', title: 'Request History' },
] as const;

type CoordinationSectionId = (typeof COORDINATION_SECTIONS)[number]['id'];

const submitButtonClassName = 'self-end w-fit min-w-0 max-w-full px-5';

export const LguClientRequests = () => {
  const { data: clientData, refetch: refetchClient } = useSuperFetch<LguClientResponse>(
    API_ENDPOINTS.LGU_ADMIN.CLIENT,
    'LGU client'
  );
  const {
    data: requestData,
    loading,
    refetch,
  } = useSuperFetch<{ requests: ClientChangeRequest[] }>(
    API_ENDPOINTS.LGU_ADMIN.CHANGE_REQUESTS,
    'LGU client requests'
  );

  const client = clientData?.client;
  const isWriteLocked =
    client?.status === 'deletion_scheduled' || client?.status === 'deleting' || client?.status === 'deleted';
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
  const [weatherErrors, setWeatherErrors] = useState<ReturnType<typeof validateWeatherDraft>>({});
  const [clientInfoErrors, setClientInfoErrors] = useState<ClientInfoErrors>({});
  const [inviteErrors, setInviteErrors] = useState<InviteErrors>({});
  const [coverageErrors, setCoverageErrors] = useState<CoverageErrors>({});
  const [mapErrors, setMapErrors] = useState<ReturnType<typeof validateMapSettingsDraft>>({});
  const [activeSection, setActiveSection] = useState<CoordinationSectionId>('center-coordinates');
  const highlightTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!client) return;
    setClientName(client.name);
    setWeatherDraft(getWeatherDraftFromClient(client));
    setMapDraft(getMapDraftFromClient(client));
    setCoverageDraft(client.barangays);
    setWeatherErrors({});
    setClientInfoErrors({});
    setCoverageErrors({});
    setMapErrors({});
  }, [client]);

  useEffect(() => {
    const sectionElements = COORDINATION_SECTIONS.map(section => document.getElementById(section.id)).filter(
      (section): section is HTMLElement => Boolean(section)
    );

    if (sectionElements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      entries => {
        const visibleEntry = entries
          .filter(entry => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visibleEntry?.target.id) {
          setActiveSection(visibleEntry.target.id as CoordinationSectionId);
        }
      },
      {
        rootMargin: '-18% 0px -58% 0px',
        threshold: [0.05, 0.2, 0.4, 0.65],
      }
    );

    sectionElements.forEach(section => observer.observe(section));

    return () => {
      observer.disconnect();
      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const weatherValidationForChanges = useMemo(() => validateWeatherDraft(weatherDraft), [weatherDraft]);
  const mapValidationForChanges = useMemo(() => validateMapSettingsDraft(mapDraft), [mapDraft]);
  const hasWeatherChanges = useMemo(() => {
    if (!client) return false;
    if (hasWeatherCoordinateErrors(weatherValidationForChanges)) {
      return !areValuesEqual(weatherDraft, getWeatherDraftFromClient(client));
    }
    return !areValuesEqual(getCurrentWeatherSnapshot(client), getWeatherProposal(weatherDraft));
  }, [client, weatherDraft, weatherValidationForChanges]);
  const hasClientInfoChanges = useMemo(
    () => Boolean(client) && clientName.trim() !== (client?.name || '').trim(),
    [client, clientName]
  );
  const hasMapChanges = useMemo(() => {
    if (!client) return false;
    if (hasMapSettingsErrors(mapValidationForChanges)) {
      return !areValuesEqual(mapDraft, getMapDraftFromClient(client));
    }
    return !areValuesEqual(getComparableMapSettings(client.mapSettings), getMapSettingsProposal(mapDraft, client));
  }, [client, mapDraft, mapValidationForChanges]);
  const hasCoverageChanges = useMemo(
    () =>
      Boolean(client) &&
      !areValuesEqual(getComparableCoverage(client?.barangays ?? []), getComparableCoverage(coverageDraft)),
    [client, coverageDraft]
  );
  const hasInviteChanges = inviteEmail.trim().length > 0;

  const updateWeatherDraft = (key: keyof WeatherCoordinateDraft, value: string) => {
    setWeatherDraft(prev => {
      const nextDraft = { ...prev, [key]: value };
      if (hasErrors(weatherErrors)) setWeatherErrors(validateWeatherDraft(nextDraft));
      return nextDraft;
    });
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

  const readServerErrorDescription = (error: unknown) => {
    if (!axios.isAxiosError(error)) return 'Failed to submit proposal';

    const data = error.response?.data as { message?: unknown; errors?: unknown; fieldErrors?: unknown } | undefined;
    const fieldErrors = data?.fieldErrors;

    if (fieldErrors && typeof fieldErrors === 'object' && !Array.isArray(fieldErrors)) {
      const messages = Object.values(fieldErrors).filter(
        (message): message is string => typeof message === 'string' && message.trim().length > 0
      );
      if (messages.length > 0) return messages.join(' ');
    }

    if (Array.isArray(data?.errors)) {
      const messages = data.errors.filter(
        (message): message is string => typeof message === 'string' && message.trim().length > 0
      );
      if (messages.length > 0) return messages.join(' ');
    }

    return typeof data?.message === 'string' && data.message.trim() ? data.message : 'Failed to submit proposal';
  };

  const submitProposal = async (
    type: ClientChangeRequest['type'],
    proposedChanges: Record<string, unknown>
  ): Promise<boolean> => {
    if (isWriteLocked) {
      addToast({
        title: 'Client changes are locked',
        description: 'Deletion is scheduled for this client.',
        color: 'warning',
      });
      return false;
    }

    try {
      const token = await getToken();
      await axios.post(
        API_ENDPOINTS.LGU_ADMIN.CREATE_CHANGE_REQUEST,
        { type, proposedChanges },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast({ title: 'Proposal submitted', color: 'success' });
      refetch();
      refetchClient();
      return true;
    } catch (error) {
      const message = readServerErrorDescription(error);
      addToast({
        title: 'Proposal failed',
        description: message,
        color: message.includes('No changes') ? 'warning' : 'danger',
      });
      return false;
    }
  };

  const cancelProposal = async (request: ClientChangeRequest) => {
    if (isWriteLocked) {
      addToast({
        title: 'Client changes are locked',
        description: 'Deletion is scheduled for this client.',
        color: 'warning',
      });
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

  const submitWeatherCoordinates = () => {
    const errors = validateWeatherDraft(weatherDraft);
    setWeatherErrors(errors);
    if (hasWeatherCoordinateErrors(errors)) return;

    submitProposal('weather_coordinates', {
      weatherLocationKey: weatherDraft.key.trim(),
      weatherLatitude: Number(weatherDraft.lat),
      weatherLongitude: Number(weatherDraft.lng),
    });
  };

  const submitClientInfo = () => {
    const errors = validateClientInfoDraft(clientName);
    setClientInfoErrors(errors);
    if (hasErrors(errors)) return;

    submitProposal('client_info', { name: clientName.trim() });
  };

  const submitMapSettings = () => {
    const errors = validateMapSettingsDraft(mapDraft);
    setMapErrors(errors);
    if (hasMapSettingsErrors(errors)) return;

    submitProposal('map_settings', { mapSettings: getMapSettingsProposal(mapDraft, client) });
  };

  const submitCoverage = () => {
    const errors = validateCoverageDraft(coverageDraft);
    setCoverageErrors(errors);
    if (hasErrors(errors)) return;

    submitProposal('barangay_coverage', { barangays: coverageDraft });
  };

  const submitInvite = async () => {
    const errors = validateInviteDraft(inviteEmail);
    setInviteErrors(errors);
    if (hasErrors(errors)) return;

    const submitted = await submitProposal('admin_invite', { email: inviteEmail.trim().toLowerCase() });
    if (submitted) {
      setInviteEmail('');
      setInviteErrors({});
    }
  };

  const scrollToSection = (sectionId: CoordinationSectionId) => {
    setActiveSection(sectionId);
    if (highlightTimeoutRef.current !== null) {
      window.clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = window.setTimeout(() => {
      highlightTimeoutRef.current = null;
    }, 900);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getSectionCardClassName = (sectionId: CoordinationSectionId) =>
    [
      'border border-default-200 transition-[border-color,box-shadow,transform] duration-300 ease-out',
      activeSection === sectionId ? 'border-primary/40 shadow-md shadow-primary/10' : '',
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div className="w-full p-4 lg:p-6 scroll-smooth">
      <div className="mx-auto grid max-w-[1120px] gap-5 xl:grid-cols-[240px_minmax(0,860px)] xl:items-start pb-120">
        <aside className="xl:sticky xl:top-4 xl:self-start">
          <nav
            aria-label="LGU coordination sections"
            className="rounded-lg border border-default-200 bg-content1 p-3 shadow-sm transition-shadow duration-300"
          >
            <p className="px-2 pb-2 text-xs font-semibold uppercase text-default-500">Table of Contents</p>
            <div className="flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible xl:pb-0">
              {COORDINATION_SECTIONS.map(section => {
                const isActive = activeSection === section.id;

                return (
                  <Button
                    key={section.id}
                    size="sm"
                    variant={isActive ? 'flat' : 'light'}
                    aria-current={isActive ? 'location' : undefined}
                    startContent={
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full transition-all duration-300 ${
                          isActive ? 'scale-100 bg-primary opacity-100' : 'scale-75 bg-default-300 opacity-60'
                        }`}
                      />
                    }
                    className={`shrink-0 justify-start px-3 text-default-700 transition-all duration-300 xl:w-full ${
                      isActive ? 'font-semibold text-primary' : ''
                    }`}
                    onPress={() => scrollToSection(section.id)}
                  >
                    {section.title}
                  </Button>
                );
              })}
            </div>
          </nav>
        </aside>

        <div className="mx-auto min-w-0 w-full max-w-[860px] space-y-5 xl:mx-0 scroll-smooth">
          <div>
            <h1 className="text-3xl font-bold">LGU Coordination</h1>
            <p className="text-sm text-default-500">
              Submit client setup proposals for Super Admin review. Changes apply only after approval.
            </p>
          </div>

          <section id="center-coordinates" className="scroll-mt-5">
            <Card className={getSectionCardClassName('center-coordinates')}>
              <CardBody className="gap-4">
                <h2 className="text-xl font-semibold">Center Coordinates</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    isRequired
                    label="Weather Key"
                    placeholder={weatherCoordinatePlaceholders.key}
                    value={weatherDraft.key}
                    isDisabled={isWriteLocked}
                    isInvalid={Boolean(weatherErrors.key)}
                    errorMessage={weatherErrors.key}
                    onBlur={() => setWeatherErrors(validateWeatherDraft(weatherDraft))}
                    onValueChange={key => updateWeatherDraft('key', key)}
                  />
                  <Input
                    isRequired
                    label="Latitude"
                    type="number"
                    step="any"
                    placeholder={weatherCoordinatePlaceholders.lat}
                    value={weatherDraft.lat}
                    isDisabled={isWriteLocked}
                    isInvalid={Boolean(weatherErrors.lat)}
                    errorMessage={weatherErrors.lat}
                    onBlur={() => setWeatherErrors(validateWeatherDraft(weatherDraft))}
                    onValueChange={lat => updateWeatherDraft('lat', lat)}
                  />
                  <Input
                    isRequired
                    label="Longitude"
                    type="number"
                    step="any"
                    placeholder={weatherCoordinatePlaceholders.lng}
                    value={weatherDraft.lng}
                    isDisabled={isWriteLocked}
                    isInvalid={Boolean(weatherErrors.lng)}
                    errorMessage={weatherErrors.lng}
                    onBlur={() => setWeatherErrors(validateWeatherDraft(weatherDraft))}
                    onValueChange={lng => updateWeatherDraft('lng', lng)}
                  />
                </div>
                <Button
                  color="primary"
                  startContent={<Send size={16} />}
                  className={submitButtonClassName}
                  isDisabled={isWriteLocked || !hasWeatherChanges}
                  onPress={submitWeatherCoordinates}
                >
                  Submit Center Proposal
                </Button>
              </CardBody>
            </Card>
          </section>

          <section id="client-information" className="scroll-mt-5">
            <Card className={getSectionCardClassName('client-information')}>
              <CardBody className="gap-4">
                <h2 className="text-xl font-semibold">Client Information</h2>
                <Input
                  isRequired
                  label="LGU Name"
                  value={clientName}
                  maxLength={FIELD_LIMITS.clientName}
                  isDisabled={isWriteLocked}
                  isInvalid={Boolean(clientInfoErrors.name)}
                  errorMessage={clientInfoErrors.name}
                  onBlur={() => setClientInfoErrors(validateClientInfoDraft(clientName))}
                  onValueChange={value => {
                    setClientName(value);
                    if (hasErrors(clientInfoErrors)) setClientInfoErrors(validateClientInfoDraft(value));
                  }}
                />
                <Button
                  color="primary"
                  startContent={<Send size={16} />}
                  className={submitButtonClassName}
                  isDisabled={isWriteLocked || !hasClientInfoChanges}
                  onPress={submitClientInfo}
                >
                  Submit Info Proposal
                </Button>
              </CardBody>
            </Card>
          </section>

          <section id="map-settings" className="scroll-mt-5">
            <Card className={getSectionCardClassName('map-settings')}>
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
                    isRequired
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
                    isRequired
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
                    isRequired
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
                    isRequired
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
                    isRequired
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
                    isRequired
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
                    isRequired
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
                    isRequired
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
                    isRequired
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
                <Button
                  color="primary"
                  startContent={<Send size={16} />}
                  className={submitButtonClassName}
                  isDisabled={isWriteLocked || !hasMapChanges}
                  onPress={submitMapSettings}
                >
                  Submit Map Proposal
                </Button>
              </CardBody>
            </Card>
          </section>

          <section id="barangay-coverage" className="scroll-mt-5">
            <Card className={getSectionCardClassName('barangay-coverage')}>
              <CardBody className="gap-4">
                <h2 className="text-xl font-semibold">Barangay Coverage</h2>
                <ClientCoverageEditor
                  coverage={coverageDraft}
                  onCoverageChange={nextCoverage => {
                    if (!isWriteLocked) {
                      setCoverageDraft(nextCoverage);
                      if (hasErrors(coverageErrors)) setCoverageErrors(validateCoverageDraft(nextCoverage));
                    }
                  }}
                />
                {coverageErrors.barangays && <p className="text-sm text-danger">{coverageErrors.barangays}</p>}
                <Button
                  color="primary"
                  startContent={<Send size={16} />}
                  className={submitButtonClassName}
                  isDisabled={isWriteLocked || !hasCoverageChanges}
                  onPress={submitCoverage}
                >
                  Submit Coverage Proposal
                </Button>
              </CardBody>
            </Card>
          </section>

          <section id="invite-admin" className="scroll-mt-5">
            <Card className={getSectionCardClassName('invite-admin')}>
              <CardBody className="gap-4">
                <h2 className="text-xl font-semibold">Invite LGU Admin</h2>
                <Input
                  isRequired
                  label="Email"
                  type="email"
                  value={inviteEmail}
                  maxLength={FIELD_LIMITS.inviteEmail}
                  isDisabled={isWriteLocked}
                  isInvalid={Boolean(inviteErrors.email)}
                  errorMessage={inviteErrors.email}
                  onBlur={() => setInviteErrors(validateInviteDraft(inviteEmail))}
                  onValueChange={value => {
                    setInviteEmail(value);
                    if (hasErrors(inviteErrors)) setInviteErrors(validateInviteDraft(value));
                  }}
                />
                <Button
                  color="primary"
                  startContent={<Send size={16} />}
                  className={submitButtonClassName}
                  isDisabled={isWriteLocked || !hasInviteChanges}
                  onPress={submitInvite}
                >
                  Submit Invite Proposal
                </Button>
              </CardBody>
            </Card>
          </section>

          <section id="request-history" className="scroll-mt-5">
            <Card className={getSectionCardClassName('request-history')}>
              <CardBody>
                <h2 className="mb-4 text-xl font-semibold">Request History</h2>
                <div className="overflow-x-auto">
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
                </div>
              </CardBody>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LguClientRequests;
