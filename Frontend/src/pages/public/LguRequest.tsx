import { API_ENDPOINTS } from '@/config/endPoints';
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Chip,
  Input,
  Select,
  SelectItem,
  Textarea,
  addToast,
} from '@heroui/react';
import axios from 'axios';
import { Building2, CheckCircle2, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type PsgcOption = {
  code: string;
  name: string;
  type?: 'municipality' | 'city';
};

const sortByName = (items: PsgcOption[]) => [...items].sort((left, right) => left.name.localeCompare(right.name));

const LguRequest = () => {
  const [regions, setRegions] = useState<PsgcOption[]>([]);
  const [provinces, setProvinces] = useState<PsgcOption[]>([]);
  const [municipalities, setMunicipalities] = useState<PsgcOption[]>([]);
  const [barangays, setBarangays] = useState<PsgcOption[]>([]);
  const [selectedBarangayCodes, setSelectedBarangayCodes] = useState<Set<string>>(new Set());

  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [regionHasNoProvinces, setRegionHasNoProvinces] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [form, setForm] = useState({
    lguName: '',
    officeDepartment: '',
    requesterName: '',
    requesterPosition: '',
    requesterEmail: '',
    requesterPhone: '',
    notes: '',
  });

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
    if (!selectedRegion) {
      return () => {
        isActive = false;
      };
    }

    axios
      .get<{ provinces: PsgcOption[] }>(API_ENDPOINTS.PUBLIC.PSGC_PROVINCES(selectedRegion))
      .then(async response => {
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

    setSelectedMunicipality('');
    setMunicipalities([]);
    setBarangays([]);
    setSelectedBarangayCodes(new Set());
    if (!selectedProvince) return;

    axios
      .get<{ municipalities: PsgcOption[] }>(API_ENDPOINTS.PUBLIC.PSGC_MUNICIPALITIES(selectedProvince))
      .then(response => setMunicipalities(sortByName(response.data.municipalities || [])));
  }, [selectedProvince, regionHasNoProvinces]);

  useEffect(() => {
    setBarangays([]);
    setSelectedBarangayCodes(new Set());
    if (!selectedMunicipality) return;

    axios
      .get<{ barangays: PsgcOption[] }>(API_ENDPOINTS.PUBLIC.PSGC_BARANGAYS(selectedMunicipality))
      .then(response => setBarangays(sortByName(response.data.barangays || [])));
  }, [selectedMunicipality]);

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleBarangay = (code: string) => {
    setSelectedBarangayCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleSelectAllBarangays = () => {
    setSelectedBarangayCodes(new Set(barangays.map(item => item.code)));
  };

  const handleSubmit = async () => {
    const selectedBarangays = barangays.filter(item => selectedBarangayCodes.has(item.code));
    if (
      !form.lguName ||
      !form.officeDepartment ||
      !form.requesterName ||
      !form.requesterPosition ||
      !form.requesterEmail ||
      !form.requesterPhone ||
      !selectedRegionData ||
      (!regionHasNoProvinces && !selectedProvinceData) ||
      !selectedMunicipalityData ||
      selectedBarangays.length === 0 ||
      !isVerified
    ) {
      addToast({
        title: 'Incomplete request',
        description: 'Complete the LGU information, location scope, barangays, and verification checkbox.',
        color: 'warning',
      });
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
      });
      setIsSubmitted(true);
    } catch (error: any) {
      addToast({
        title: 'Request failed',
        description: error.response?.data?.message || 'Please review your request and try again.',
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
            <Button as={Link} to="/auth/login" color="primary">
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
          <Button as={Link} to="/auth/login" variant="flat">
            Admin Login
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_420px]">
          <Card className="border border-default-200">
            <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="LGU Name" value={form.lguName} onValueChange={value => updateForm('lguName', value)} />
              <Input
                label="Office or Department"
                value={form.officeDepartment}
                onValueChange={value => updateForm('officeDepartment', value)}
              />
              <Input
                label="Requester Name"
                value={form.requesterName}
                onValueChange={value => updateForm('requesterName', value)}
              />
              <Input
                label="Position"
                value={form.requesterPosition}
                onValueChange={value => updateForm('requesterPosition', value)}
              />
              <Input
                label="Email"
                type="email"
                value={form.requesterEmail}
                onValueChange={value => updateForm('requesterEmail', value)}
              />
              <Input
                label="Phone"
                value={form.requesterPhone}
                onValueChange={value => updateForm('requesterPhone', value)}
              />

              <Select
                label="Region"
                selectedKeys={selectedRegion ? [selectedRegion] : []}
                onChange={event => setSelectedRegion(event.target.value)}
              >
                {regions.map(item => (
                  <SelectItem key={item.code}>{item.name}</SelectItem>
                ))}
              </Select>
              <Select
                label={regionHasNoProvinces ? 'Province (not applicable)' : 'Province'}
                selectedKeys={selectedProvince ? [selectedProvince] : []}
                onChange={event => setSelectedProvince(event.target.value)}
                isDisabled={!selectedRegion || regionHasNoProvinces}
              >
                {provinces.map(item => (
                  <SelectItem key={item.code}>{item.name}</SelectItem>
                ))}
              </Select>
              <Select
                label="Municipality or City"
                selectedKeys={selectedMunicipality ? [selectedMunicipality] : []}
                onChange={event => setSelectedMunicipality(event.target.value)}
                isDisabled={!selectedProvince && !regionHasNoProvinces}
                className="md:col-span-2"
              >
                {municipalities.map(item => (
                  <SelectItem key={item.code}>{item.name}</SelectItem>
                ))}
              </Select>
              <Textarea
                label="Notes"
                value={form.notes}
                onValueChange={value => updateForm('notes', value)}
                className="md:col-span-2"
              />
            </CardBody>
          </Card>

          <Card className="border border-default-200">
            <CardBody className="gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Barangay Scope</h2>
                  <p className="text-xs text-default-500">{selectedBarangayCodes.size} selected</p>
                </div>
                <Button size="sm" variant="flat" onPress={handleSelectAllBarangays} isDisabled={barangays.length === 0}>
                  Select all
                </Button>
              </div>

              <div className="max-h-[420px] overflow-auto rounded-lg border border-default-200 p-3">
                {barangays.length === 0 ? (
                  <p className="py-8 text-center text-sm text-default-500">Select a municipality or city first.</p>
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

              <Checkbox isSelected={isVerified} onValueChange={setIsVerified}>
                I verified that the selected barangays are correct.
              </Checkbox>

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
