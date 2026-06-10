import { API_ENDPOINTS } from '@/config/endPoints';
import {
  CLIENT_LOGO_HELP_TEXT,
  readClientLogoDimensions,
  validateClientLogoDimensions,
  validateClientLogoFile,
} from '@/helper/clientLogo';
import { getAdminBarangayOptions } from '@/helper/adminBarangayOptions';
import { useAuth } from '@/stores/useAuth';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { Button } from '@heroui/button';
import { Input, Textarea } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { addToast } from '@heroui/react';
import axios from 'axios';
import { ArrowRight, ImagePlus } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type LogoUploadResponse = {
  logoUrl: string;
  logoPath: string;
  width: number;
  height: number;
};

const AddressForm = () => {
  const navigate = useNavigate();
  const {
    setAddressData,
    setLogoData,
    barangay: initialBarangay,
    address: initialAddress,
    logoUrl: initialLogoUrl,
    logoPath: initialLogoPath,
  } = useOnboardingStore();
  const userData = useAuth(state => state.userData);
  const auth = useAuth(state => state.auth);

  const [barangay, setBarangay] = useState<string>(initialBarangay);
  const [address, setAddress] = useState<string>(initialAddress);
  const [logoUrl, setLogoUrl] = useState<string>(initialLogoUrl || userData?.clientLogoUrl || '');
  const [logoPath, setLogoPath] = useState<string>(initialLogoPath || userData?.clientLogoPath || '');
  const [logoError, setLogoError] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [error, setError] = useState('');
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const sortedBarangays = useMemo(() => getAdminBarangayOptions(userData), [userData]);
  const isSuperAdmin = userData?.role === 'super_admin';

  const handleLogoFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setLogoError('');
    setError('');

    const fileError = validateClientLogoFile(file);
    if (fileError) {
      setLogoError(fileError);
      return;
    }

    try {
      const dimensionError = validateClientLogoDimensions(await readClientLogoDimensions(file));
      if (dimensionError) {
        setLogoError(dimensionError);
        return;
      }

      if (!auth) {
        setLogoError('Please sign in again before uploading a logo.');
        return;
      }

      setIsUploadingLogo(true);
      const idToken = await auth.getIdToken();
      const formData = new FormData();
      formData.append('logo', file);

      const response = await axios.post<LogoUploadResponse>(API_ENDPOINTS.AUTH.UPLOAD_CLIENT_LOGO, formData, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      setLogoUrl(response.data.logoUrl);
      setLogoPath(response.data.logoPath);
      setLogoData(response.data.logoUrl, response.data.logoPath);
      addToast({ title: 'LGU logo uploaded', color: 'success' });
    } catch (uploadError) {
      const message = axios.isAxiosError(uploadError)
        ? uploadError.response?.data?.message || 'Failed to upload LGU logo.'
        : uploadError instanceof Error
          ? uploadError.message
          : 'Failed to upload LGU logo.';
      setLogoError(message);
      addToast({ title: message, color: 'danger' });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleNext = () => {
    const trimmedAddress = address.trim();

    if (isSuperAdmin) {
      if (!trimmedAddress) {
        setError('Enter your office address.');
        return;
      }

      setAddressData('', trimmedAddress);
      navigate('/info-setup');
      return;
    }

    if (sortedBarangays.length === 0) {
      setError('No active barangays are configured for your LGU client.');
      return;
    }

    if (!barangay || !trimmedAddress) {
      setError('Please fill in all fields');
      return;
    }

    if (!logoUrl) {
      setLogoError('Municipality logo is required.');
      setError('Please upload your municipality logo.');
      return;
    }

    if (!sortedBarangays.some(item => item.value === barangay)) {
      setError('Select a barangay covered by your LGU client.');
      return;
    }

    setAddressData(barangay, trimmedAddress);
    setLogoData(logoUrl, logoPath);
    navigate('/info-setup');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 animate-fade-in-up">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Location Setup</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isSuperAdmin ? 'Enter your office or organization address.' : 'Select your deployed barangay and office address.'}
          </p>
        </div>

        <div className="space-y-6">
          {isSuperAdmin ? (
            <Textarea
              label="Office Address"
              placeholder="e.g. Rescuenect operations office, Cavite"
              value={address}
              onValueChange={setAddress}
              errorMessage={!address.trim() && error ? 'Required' : ''}
              minRows={3}
            />
          ) : (
            <>
              <Select
                label="Barangay"
                placeholder="Select a barangay"
                selectedKeys={barangay ? [barangay] : []}
                onChange={e => setBarangay(e.target.value)}
                errorMessage={!barangay && error ? 'Required' : ''}
                className="w-full"
                isDisabled={sortedBarangays.length === 0}
                items={sortedBarangays}
              >
                {item => <SelectItem key={item.value}>{item.label}</SelectItem>}
              </Select>

              <Input
                label="Street Address / Office"
                placeholder="e.g. Barangay Hall, Zone 1"
                value={address}
                onValueChange={setAddress}
                errorMessage={!address.trim() && error ? 'Required' : ''}
              />

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Municipality Logo <span className="text-danger">*</span>
                </p>
                <div
                  className={`flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900 ${
                    logoError ? 'border-danger' : 'border-default-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-default-100 dark:bg-slate-800">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Municipality logo preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus className="h-8 w-8 text-default-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{CLIENT_LOGO_HELP_TEXT}</p>
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      isLoading={isUploadingLogo}
                      onPress={() => logoInputRef.current?.click()}
                    >
                      {logoUrl ? 'Replace PNG' : 'Choose PNG'}
                    </Button>
                  </div>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png"
                  className="hidden"
                  onChange={handleLogoFileChange}
                />
                {logoError && <p className="text-sm text-danger">{logoError}</p>}
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button
            color="primary"
            size="lg"
            className="w-full mt-4"
            endContent={<ArrowRight className="w-4 h-4" />}
            onPress={handleNext}
          >
            Next Step
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
