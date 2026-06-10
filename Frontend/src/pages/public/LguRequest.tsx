import { API_ENDPOINTS } from '@/config/endPoints';
import { formatContactNumber } from '@/helper/commonHelpers';
import { CenterCoordinatePicker } from '@/pages/public/components/CenterCoordinatePicker';
import { Button, Card, CardBody, Checkbox, Chip, Input, Select, SelectItem, Textarea, addToast } from '@heroui/react';
import axios from 'axios';
import { ChevronLeft, Building2, CheckCircle2, Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

type PsgcOption = {
  code: string;
  name: string;
  type?: 'municipality' | 'city';
};

type LguRequestForm = {
  lguName: string;
  officeDepartment: string;
  requesterName: string;
  requesterPosition: string;
  requesterEmail: string;
  requesterPhone: string;
  proposedWeatherLatitude: string;
  proposedWeatherLongitude: string;
  notes: string;
};

type LguRequestErrorKey =
  | keyof LguRequestForm
  | 'regionCode'
  | 'provinceCode'
  | 'municipalityCode'
  | 'selectedBarangays'
  | 'barangaysVerified';

type LguRequestErrors = Partial<Record<LguRequestErrorKey, string>>;

const FIELD_LIMITS = {
  lguName: 120,
  officeDepartment: 120,
  requesterName: 100,
  requesterPosition: 100,
  requesterEmail: 254,
  requesterPhone: 13,
  notes: 500,
} as const;

const FIELD_LABELS: Record<keyof typeof FIELD_LIMITS, string> = {
  lguName: 'LGU name',
  officeDepartment: 'Office or department',
  requesterName: 'Requester name',
  requesterPosition: 'Position',
  requesterEmail: 'Email',
  requesterPhone: 'Phone',
  notes: 'Notes',
};

const REQUIRED_FORM_FIELDS: Array<
  keyof Pick<
    LguRequestForm,
    'lguName' | 'officeDepartment' | 'requesterName' | 'requesterPosition' | 'requesterEmail' | 'requesterPhone'
  >
> = ['lguName', 'officeDepartment', 'requesterName', 'requesterPosition', 'requesterEmail', 'requesterPhone'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PH_MOBILE_DIGITS_PATTERN = /^09\d{9}$/;
const LOCATION_SELECT_MIN_LISTBOX_HEIGHT = 140;
const LOCATION_SELECT_MAX_LISTBOX_HEIGHT = 520;
const LOCATION_SELECT_TRIGGER_GAP = 14;
const LOCATION_SELECT_VIEWPORT_PADDING = 24;
const LOCATION_SELECT_POPOVER_PROPS = {
  disableAnimation: true,
  offset: LOCATION_SELECT_TRIGGER_GAP,
  placement: 'bottom-start',
  shouldFlip: false,
} as const;
const LOCATION_SELECT_LISTBOX_PROPS = {
  autoFocus: false,
  shouldUseVirtualFocus: true,
} as const;

const getLocationSelectListboxHeight = (selectElement?: HTMLElement | null) => {
  if (typeof window === 'undefined') return LOCATION_SELECT_MAX_LISTBOX_HEIGHT;

  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const fallbackHeight = Math.floor(viewportHeight * 0.55);
  const availableHeight = selectElement
    ? Math.floor(
        viewportHeight -
          selectElement.getBoundingClientRect().bottom -
          LOCATION_SELECT_TRIGGER_GAP -
          LOCATION_SELECT_VIEWPORT_PADDING
      )
    : fallbackHeight;

  return Math.min(
    LOCATION_SELECT_MAX_LISTBOX_HEIGHT,
    Math.max(LOCATION_SELECT_MIN_LISTBOX_HEIGHT, availableHeight)
  );
};

const sortByName = (items: PsgcOption[]) => [...items].sort((left, right) => left.name.localeCompare(right.name));

const hasValidCoordinatePair = (latitude: string, longitude: string) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  return Boolean(
    latitude.trim() &&
      longitude.trim() &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
  );
};

const initialForm: LguRequestForm = {
  lguName: '',
  officeDepartment: '',
  requesterName: '',
  requesterPosition: '',
  requesterEmail: '',
  requesterPhone: '',
  proposedWeatherLatitude: '',
  proposedWeatherLongitude: '',
  notes: '',
};

const withoutErrors = (current: LguRequestErrors, keys: LguRequestErrorKey[]): LguRequestErrors => {
  const next = { ...current };
  keys.forEach(key => {
    delete next[key];
  });
  return next;
};

const validateFormField = (key: keyof LguRequestForm, value: string): string | undefined => {
  if (key === 'proposedWeatherLatitude' || key === 'proposedWeatherLongitude') return undefined;

  const trimmedValue = value.trim();
  const label = FIELD_LABELS[key];
  const maxLength = FIELD_LIMITS[key];

  if (REQUIRED_FORM_FIELDS.includes(key as (typeof REQUIRED_FORM_FIELDS)[number]) && !trimmedValue) {
    return `${label} is required`;
  }

  if (trimmedValue.length > maxLength) {
    return `${label} should not exceed ${maxLength} characters`;
  }

  if (key === 'requesterEmail' && trimmedValue && !EMAIL_PATTERN.test(trimmedValue.toLowerCase())) {
    return 'Enter a valid email address';
  }

  if (key === 'requesterPhone' && trimmedValue) {
    const digits = trimmedValue.replace(/\D/g, '');
    if (!PH_MOBILE_DIGITS_PATTERN.test(digits)) {
      return 'Enter an 11-digit mobile number starting with 09';
    }
  }

  return undefined;
};

const LguRequest = () => {
  const [regions, setRegions] = useState<PsgcOption[]>([]);
  const [provinces, setProvinces] = useState<PsgcOption[]>([]);
  const [municipalities, setMunicipalities] = useState<PsgcOption[]>([]);
  const [barangays, setBarangays] = useState<PsgcOption[]>([]);
  const [selectedBarangayCodes, setSelectedBarangayCodes] = useState<Set<string>>(new Set());
  const [barangayScopeMunicipalityCode, setBarangayScopeMunicipalityCode] = useState('');

  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [regionHasNoProvinces, setRegionHasNoProvinces] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isBarangaysLoading, setIsBarangaysLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<LguRequestErrors>({});
  const [locationSelectListboxHeight, setLocationSelectListboxHeight] = useState(getLocationSelectListboxHeight);
  const regionSelectRef = useRef<HTMLDivElement | null>(null);
  const provinceSelectRef = useRef<HTMLDivElement | null>(null);
  const municipalitySelectRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] = useState<LguRequestForm>(initialForm);

  const selectedRegionData = useMemo(
    () => regions.find(item => item.code === selectedRegion),
    [regions, selectedRegion]
  );
  const selectedProvinceData = useMemo(
    () => provinces.find(item => item.code === selectedProvince),
    [provinces, selectedProvince]
  );
  const selectedMunicipalityData = useMemo(
    () => municipalities.find(item => item.code === selectedMunicipality),
    [municipalities, selectedMunicipality]
  );
  const barangayScopeMunicipalityData = useMemo(
    () => municipalities.find(item => item.code === barangayScopeMunicipalityCode),
    [municipalities, barangayScopeMunicipalityCode]
  );
  const isAddressComplete = Boolean(
    selectedRegionData && (regionHasNoProvinces || selectedProvinceData) && selectedMunicipalityData
  );

  useEffect(() => {
    const updateSelectListboxHeight = () => setLocationSelectListboxHeight(getLocationSelectListboxHeight());

    window.addEventListener('resize', updateSelectListboxHeight);
    window.visualViewport?.addEventListener('resize', updateSelectListboxHeight);

    return () => {
      window.removeEventListener('resize', updateSelectListboxHeight);
      window.visualViewport?.removeEventListener('resize', updateSelectListboxHeight);
    };
  }, []);

  useEffect(() => {
    axios
      .get<{ regions: PsgcOption[] }>(API_ENDPOINTS.PUBLIC.PSGC_REGIONS)
      .then(response => setRegions(sortByName(response.data.regions || [])))
      .catch(() => {
        addToast({
          title: 'PSGC unavailable',
          description: 'Location data could not be loaded. Please try again later.',
          color: 'danger',
        });
      });
  }, []);

  useEffect(() => {
    let isActive = true;

    setSelectedProvince('');
    setSelectedMunicipality('');
    setRegionHasNoProvinces(false);
    setProvinces([]);
    setMunicipalities([]);
    setBarangays([]);
    setSelectedBarangayCodes(new Set());
    setBarangayScopeMunicipalityCode('');
    setIsBarangaysLoading(false);
    setIsVerified(false);
    setErrors(prev =>
      withoutErrors(prev, [
        'provinceCode',
        'municipalityCode',
        'selectedBarangays',
        'barangaysVerified',
        'proposedWeatherLatitude',
        'proposedWeatherLongitude',
      ])
    );
    if (!selectedRegion) {
      return () => {
        isActive = false;
      };
    }

    axios.get<{ provinces: PsgcOption[] }>(API_ENDPOINTS.PUBLIC.PSGC_PROVINCES(selectedRegion)).then(async response => {
      if (!isActive) return;
      const nextProvinces = sortByName(response.data.provinces || []);
      setProvinces(nextProvinces);

      if (nextProvinces.length === 0) {
        const municipalitiesResponse = await axios.get<{ municipalities: PsgcOption[] }>(
          API_ENDPOINTS.PUBLIC.PSGC_REGION_MUNICIPALITIES(selectedRegion)
        );
        if (!isActive) return;
        setRegionHasNoProvinces(true);
        setMunicipalities(sortByName(municipalitiesResponse.data.municipalities || []));
      }
    });

    return () => {
      isActive = false;
    };
  }, [selectedRegion]);

  useEffect(() => {
    if (regionHasNoProvinces) return;
    let isActive = true;
    const provinceCode = selectedProvince;

    setSelectedMunicipality('');
    setMunicipalities([]);
    setBarangays([]);
    setSelectedBarangayCodes(new Set());
    setBarangayScopeMunicipalityCode('');
    setIsBarangaysLoading(false);
    setIsVerified(false);
    setErrors(prev =>
      withoutErrors(prev, [
        'municipalityCode',
        'selectedBarangays',
        'barangaysVerified',
        'proposedWeatherLatitude',
        'proposedWeatherLongitude',
      ])
    );
    if (!provinceCode) {
      return () => {
        isActive = false;
      };
    }

    axios
      .get<{ municipalities: PsgcOption[] }>(API_ENDPOINTS.PUBLIC.PSGC_MUNICIPALITIES(provinceCode))
      .then(response => {
        if (!isActive) return;
        setMunicipalities(sortByName(response.data.municipalities || []));
      });

    return () => {
      isActive = false;
    };
  }, [selectedProvince, regionHasNoProvinces]);

  useEffect(() => {
    let isActive = true;
    const municipalityCode = selectedMunicipality;

    setBarangays([]);
    setSelectedBarangayCodes(new Set());
    setBarangayScopeMunicipalityCode('');
    setIsVerified(false);
    setForm(prev => ({
      ...prev,
      proposedWeatherLatitude: '',
      proposedWeatherLongitude: '',
    }));
    setErrors(prev =>
      withoutErrors(prev, [
        'selectedBarangays',
        'barangaysVerified',
        'proposedWeatherLatitude',
        'proposedWeatherLongitude',
      ])
    );
    if (!municipalityCode) {
      setIsBarangaysLoading(false);
      return () => {
        isActive = false;
      };
    }

    setIsBarangaysLoading(true);
    axios
      .get<{ barangays: PsgcOption[] }>(API_ENDPOINTS.PUBLIC.PSGC_BARANGAYS(municipalityCode))
      .then(response => {
        if (!isActive) return;
        setBarangays(sortByName(response.data.barangays || []));
        setBarangayScopeMunicipalityCode(municipalityCode);
      })
      .catch(() => {
        if (!isActive) return;
        addToast({
          title: 'Barangays unavailable',
          description: 'Barangay data could not be loaded for the selected municipality or city.',
          color: 'danger',
        });
      })
      .finally(() => {
        if (!isActive) return;
        setIsBarangaysLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [selectedMunicipality]);

  const setFieldError = (key: LguRequestErrorKey, message?: string) => {
    setErrors(prev => {
      if (!message && !prev[key]) return prev;
      const next = { ...prev };
      if (message) next[key] = message;
      else delete next[key];
      return next;
    });
  };

  const updateForm = (key: keyof LguRequestForm, value: string) => {
    const nextValue = key === 'requesterPhone' ? formatContactNumber(value) : value;
    setForm(prev => ({ ...prev, [key]: nextValue }));

    if (errors[key]) {
      setFieldError(key, validateFormField(key, nextValue));
    }
  };

  const validateCurrentField = (key: keyof LguRequestForm) => {
    setFieldError(key, validateFormField(key, form[key]));
  };

  const validateRequest = (selectedBarangaysCount: number): LguRequestErrors => {
    const nextErrors: LguRequestErrors = {};

    REQUIRED_FORM_FIELDS.forEach(key => {
      const error = validateFormField(key, form[key]);
      if (error) nextErrors[key] = error;
    });

    const notesError = validateFormField('notes', form.notes);
    if (notesError) nextErrors.notes = notesError;

    if (!selectedRegionData) {
      nextErrors.regionCode = 'Region is required';
    } else if (!regionHasNoProvinces && !selectedProvinceData) {
      nextErrors.provinceCode = 'Province is required';
    } else if (!selectedMunicipalityData) {
      nextErrors.municipalityCode = 'Municipality or city is required';
    }

    if (isAddressComplete && !hasValidCoordinatePair(form.proposedWeatherLatitude, form.proposedWeatherLongitude)) {
      nextErrors.proposedWeatherLatitude = 'Select a valid proposed center on the map';
    }

    if (selectedBarangaysCount === 0) {
      nextErrors.selectedBarangays = 'Select at least one barangay';
    }

    if (!isVerified) {
      nextErrors.barangaysVerified = 'Confirm that the selected barangays are correct';
    }

    return nextErrors;
  };

  const clearErrors = (keys: LguRequestErrorKey[]) => {
    setErrors(prev => withoutErrors(prev, keys));
  };

  const updateLocationSelectHeightFor = (selectElement: HTMLDivElement | null) => {
    setLocationSelectListboxHeight(getLocationSelectListboxHeight(selectElement));
  };

  const handleLocationSelectOpenChange = (isOpen: boolean, selectElement: HTMLDivElement | null) => {
    if (isOpen) {
      updateLocationSelectHeightFor(selectElement);
    }
  };

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    clearErrors([
      'regionCode',
      'provinceCode',
      'municipalityCode',
      'selectedBarangays',
      'barangaysVerified',
      'proposedWeatherLatitude',
      'proposedWeatherLongitude',
    ]);
  };

  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value);
    clearErrors([
      'provinceCode',
      'municipalityCode',
      'selectedBarangays',
      'barangaysVerified',
      'proposedWeatherLatitude',
      'proposedWeatherLongitude',
    ]);
  };

  const handleMunicipalityChange = (value: string) => {
    setSelectedMunicipality(value);
    clearErrors([
      'municipalityCode',
      'selectedBarangays',
      'barangaysVerified',
      'proposedWeatherLatitude',
      'proposedWeatherLongitude',
    ]);
  };

  const toggleBarangay = (code: string) => {
    setSelectedBarangayCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      if (next.size > 0) {
        setErrors(current => withoutErrors(current, ['selectedBarangays']));
      }
      return next;
    });
  };

  const handleSelectAllBarangays = () => {
    setSelectedBarangayCodes(new Set(barangays.map(item => item.code)));
    clearErrors(['selectedBarangays']);
  };

  const handleVerificationChange = (value: boolean) => {
    setIsVerified(value);
    if (value) clearErrors(['barangaysVerified']);
  };

  const readServerErrorDescription = (error: unknown) => {
    if (!axios.isAxiosError(error)) return 'Please review your request and try again.';

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

    return typeof data?.message === 'string' && data.message.trim()
      ? data.message
      : 'Please review your request and try again.';
  };

  const handleSubmit = async () => {
    const selectedBarangays = barangays.filter(item => selectedBarangayCodes.has(item.code));
    const validationErrors = validateRequest(selectedBarangays.length);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (!selectedRegionData || !selectedMunicipalityData || (!regionHasNoProvinces && !selectedProvinceData)) {
      return;
    }

    setIsLoading(true);
    try {
      const locationProvinceData = selectedProvinceData || selectedRegionData;

      await axios.post(API_ENDPOINTS.PUBLIC.LGU_REQUESTS, {
        ...form,
        regionCode: selectedRegionData.code,
        regionName: selectedRegionData.name,
        provinceCode: locationProvinceData.code,
        provinceName: locationProvinceData.name,
        municipalityCode: selectedMunicipalityData.code,
        municipalityName: selectedMunicipalityData.name,
        municipalityType: selectedMunicipalityData.type || 'municipality',
        selectedBarangays: selectedBarangays.map(barangay => ({
          barangayCode: barangay.code,
          barangayLabel: barangay.name,
          value: barangay.name.toLowerCase(),
        })),
        barangaysVerified: isVerified,
        proposedWeatherLatitude: form.proposedWeatherLatitude ? Number(form.proposedWeatherLatitude) : null,
        proposedWeatherLongitude: form.proposedWeatherLongitude ? Number(form.proposedWeatherLongitude) : null,
      });
      setIsSubmitted(true);
    } catch (error: any) {
      addToast({
        title: 'Request failed',
        description: readServerErrorDescription(error),
        color: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 text-foreground">
        <Card className="mx-auto max-w-xl border border-default-200">
          <CardBody className="items-center gap-5 py-12 text-center">
            <CheckCircle2 size={48} className="text-success" />
            <div>
              <h1 className="text-2xl font-semibold">Request submitted</h1>
              <p className="mt-2 text-sm text-default-500">
                The Rescuenect super admin team will review the LGU scope before activation.
              </p>
            </div>
            <Button as={Link} to="/home" color="primary">
              Go to Admin Login
            </Button>
          </CardBody>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <Button as={Link} to="/home" variant="flat" className="self-start">
          <ChevronLeft size={18} />
          Home
        </Button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Request Rescuenect Access</h1>
              <p className="text-sm text-default-500">Municipality and city LGU onboarding</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_420px]">
          <Card className="border border-default-200">
            <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                isRequired
                label="LGU Name"
                value={form.lguName}
                maxLength={FIELD_LIMITS.lguName}
                isInvalid={Boolean(errors.lguName)}
                errorMessage={errors.lguName}
                onBlur={() => validateCurrentField('lguName')}
                onValueChange={value => updateForm('lguName', value)}
              />
              <Input
                isRequired
                label="Office or Department"
                value={form.officeDepartment}
                maxLength={FIELD_LIMITS.officeDepartment}
                isInvalid={Boolean(errors.officeDepartment)}
                errorMessage={errors.officeDepartment}
                onBlur={() => validateCurrentField('officeDepartment')}
                onValueChange={value => updateForm('officeDepartment', value)}
              />
              <Input
                isRequired
                label="Requester Name"
                value={form.requesterName}
                maxLength={FIELD_LIMITS.requesterName}
                isInvalid={Boolean(errors.requesterName)}
                errorMessage={errors.requesterName}
                onBlur={() => validateCurrentField('requesterName')}
                onValueChange={value => updateForm('requesterName', value)}
              />
              <Input
                isRequired
                label="Position"
                value={form.requesterPosition}
                maxLength={FIELD_LIMITS.requesterPosition}
                isInvalid={Boolean(errors.requesterPosition)}
                errorMessage={errors.requesterPosition}
                onBlur={() => validateCurrentField('requesterPosition')}
                onValueChange={value => updateForm('requesterPosition', value)}
              />
              <Input
                isRequired
                label="Email"
                type="email"
                value={form.requesterEmail}
                maxLength={FIELD_LIMITS.requesterEmail}
                isInvalid={Boolean(errors.requesterEmail)}
                errorMessage={errors.requesterEmail}
                onBlur={() => validateCurrentField('requesterEmail')}
                onValueChange={value => updateForm('requesterEmail', value)}
              />
              <Input
                isRequired
                label="Phone"
                placeholder="09XX-XXX-XXXX"
                inputMode="numeric"
                value={form.requesterPhone}
                maxLength={FIELD_LIMITS.requesterPhone}
                isInvalid={Boolean(errors.requesterPhone)}
                errorMessage={errors.requesterPhone}
                onBlur={() => validateCurrentField('requesterPhone')}
                onValueChange={value => updateForm('requesterPhone', value)}
              />

              <div
                ref={regionSelectRef}
                className="w-full"
                onFocusCapture={() => updateLocationSelectHeightFor(regionSelectRef.current)}
                onPointerDown={() => updateLocationSelectHeightFor(regionSelectRef.current)}
              >
                <Select
                  isRequired
                  label="Region"
                  selectedKeys={selectedRegion ? [selectedRegion] : []}
                  isInvalid={Boolean(errors.regionCode)}
                  errorMessage={errors.regionCode}
                  maxListboxHeight={locationSelectListboxHeight}
                  disableAnimation
                  popoverProps={LOCATION_SELECT_POPOVER_PROPS}
                  listboxProps={LOCATION_SELECT_LISTBOX_PROPS}
                  onOpenChange={isOpen => handleLocationSelectOpenChange(isOpen, regionSelectRef.current)}
                  onChange={event => handleRegionChange(event.target.value)}
                >
                  {regions.map(item => (
                    <SelectItem key={item.code}>{item.name}</SelectItem>
                  ))}
                </Select>
              </div>
              <div
                ref={provinceSelectRef}
                className="w-full"
                onFocusCapture={() => updateLocationSelectHeightFor(provinceSelectRef.current)}
                onPointerDown={() => updateLocationSelectHeightFor(provinceSelectRef.current)}
              >
                <Select
                  isRequired={!regionHasNoProvinces}
                  label={regionHasNoProvinces ? 'Province (not applicable)' : 'Province'}
                  selectedKeys={selectedProvince ? [selectedProvince] : []}
                  isInvalid={Boolean(errors.provinceCode)}
                  errorMessage={errors.provinceCode}
                  maxListboxHeight={locationSelectListboxHeight}
                  disableAnimation
                  popoverProps={LOCATION_SELECT_POPOVER_PROPS}
                  listboxProps={LOCATION_SELECT_LISTBOX_PROPS}
                  onOpenChange={isOpen => handleLocationSelectOpenChange(isOpen, provinceSelectRef.current)}
                  onChange={event => handleProvinceChange(event.target.value)}
                  isDisabled={!selectedRegion || regionHasNoProvinces}
                >
                  {provinces.map(item => (
                    <SelectItem key={item.code}>{item.name}</SelectItem>
                  ))}
                </Select>
              </div>
              <div
                ref={municipalitySelectRef}
                className="w-full md:col-span-2"
                onFocusCapture={() => updateLocationSelectHeightFor(municipalitySelectRef.current)}
                onPointerDown={() => updateLocationSelectHeightFor(municipalitySelectRef.current)}
              >
                <Select
                  isRequired
                  label="Municipality or City"
                  selectedKeys={selectedMunicipality ? [selectedMunicipality] : []}
                  isInvalid={Boolean(errors.municipalityCode)}
                  errorMessage={errors.municipalityCode}
                  maxListboxHeight={locationSelectListboxHeight}
                  disableAnimation
                  popoverProps={LOCATION_SELECT_POPOVER_PROPS}
                  listboxProps={LOCATION_SELECT_LISTBOX_PROPS}
                  onOpenChange={isOpen => handleLocationSelectOpenChange(isOpen, municipalitySelectRef.current)}
                  onChange={event => handleMunicipalityChange(event.target.value)}
                  isDisabled={!selectedProvince && !regionHasNoProvinces}
                >
                  {municipalities.map(item => (
                    <SelectItem key={item.code}>{item.name}</SelectItem>
                  ))}
                </Select>
              </div>
              {isAddressComplete && (
                <CenterCoordinatePicker
                  latitude={form.proposedWeatherLatitude}
                  longitude={form.proposedWeatherLongitude}
                  municipalityName={selectedMunicipalityData?.name}
                  errorMessage={errors.proposedWeatherLatitude || errors.proposedWeatherLongitude}
                  onChange={(latitude, longitude) => {
                    setForm(prev => ({
                      ...prev,
                      proposedWeatherLatitude: latitude,
                      proposedWeatherLongitude: longitude,
                    }));
                    clearErrors(['proposedWeatherLatitude', 'proposedWeatherLongitude']);
                  }}
                  onReset={() => {
                    setForm(prev => ({
                      ...prev,
                      proposedWeatherLatitude: '',
                      proposedWeatherLongitude: '',
                    }));
                    clearErrors(['proposedWeatherLatitude', 'proposedWeatherLongitude']);
                  }}
                />
              )}
              <Textarea
                label="Notes"
                value={form.notes}
                maxLength={FIELD_LIMITS.notes}
                isInvalid={Boolean(errors.notes)}
                errorMessage={errors.notes}
                onBlur={() => validateCurrentField('notes')}
                onValueChange={value => updateForm('notes', value)}
                className="md:col-span-2"
              />
            </CardBody>
          </Card>

          <Card className="border border-default-200">
            <CardBody className="gap-4 overflow-x-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Barangay Scope</h2>
                  <p className="text-xs text-default-500">
                    {isBarangaysLoading
                      ? `Loading ${selectedMunicipalityData?.name || 'municipality'} barangays`
                      : barangayScopeMunicipalityData
                        ? `${selectedBarangayCodes.size} selected from ${barangayScopeMunicipalityData.name}`
                        : `${selectedBarangayCodes.size} selected`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleSelectAllBarangays}
                  isDisabled={isBarangaysLoading || barangays.length === 0}
                >
                  Select all
                </Button>
              </div>

              <div
                className={`max-h-[420px] overflow-auto rounded-lg border p-3 ${
                  errors.selectedBarangays ? 'border-danger' : 'border-default-200'
                }`}
              >
                {isBarangaysLoading ? (
                  <p className="py-8 text-center text-sm text-default-500">
                    Loading barangays for {selectedMunicipalityData?.name || 'the selected municipality'}...
                  </p>
                ) : barangays.length === 0 ? (
                  <p className="py-8 text-center text-sm text-default-500">
                    {selectedMunicipalityData
                      ? `No barangays found for ${selectedMunicipalityData.name}.`
                      : 'Select a municipality or city first.'}
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {barangays.map(barangay => (
                      <Checkbox
                        key={barangay.code}
                        isSelected={selectedBarangayCodes.has(barangay.code)}
                        onValueChange={() => toggleBarangay(barangay.code)}
                      >
                        {barangay.name}
                      </Checkbox>
                    ))}
                  </div>
                )}
              </div>
              {errors.selectedBarangays && <p className="text-xs text-danger">{errors.selectedBarangays}</p>}

              <Checkbox
                isRequired
                isInvalid={Boolean(errors.barangaysVerified)}
                isSelected={isVerified}
                onValueChange={handleVerificationChange}
              >
                I verified that the selected barangays are correct.
              </Checkbox>
              {errors.barangaysVerified && <p className="text-xs text-danger">{errors.barangaysVerified}</p>}

              <div className="flex flex-wrap gap-2">
                {selectedRegionData && <Chip size="sm">{selectedRegionData.name}</Chip>}
                {selectedProvinceData && <Chip size="sm">{selectedProvinceData.name}</Chip>}
                {selectedMunicipalityData && <Chip size="sm">{selectedMunicipalityData.name}</Chip>}
              </div>

              <Button color="primary" isLoading={isLoading} endContent={<Send size={18} />} onPress={handleSubmit}>
                Submit Request
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default LguRequest;
