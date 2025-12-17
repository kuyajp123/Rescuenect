import { barangays } from '@/config/constant';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddressForm = () => {
  const navigate = useNavigate();
  const { setAddressData, barangay: initialBarangay, address: initialAddress } = useOnboardingStore();

  const [barangay, setBarangay] = useState<string>(initialBarangay);
  const [address, setAddress] = useState<string>(initialAddress);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!barangay || !address) {
      setError('Please fill in all fields');
      return;
    }
    setAddressData(barangay, address);
    navigate('/info-setup');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 animate-fade-in-up">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Location Setup</h2>
          <p className="text-gray-600 dark:text-gray-400">Select your deployed barangay and office address.</p>
        </div>

        <div className="space-y-6">
          <Select
            label="Barangay"
            placeholder="Select a barangay"
            selectedKeys={barangay ? [barangay] : []}
            onChange={e => setBarangay(e.target.value)}
            errorMessage={!barangay && error ? 'Required' : ''}
            className="w-full"
            items={barangays}
          >
            {item => <SelectItem key={item.value}>{item.label}</SelectItem>}
          </Select>

          <Input
            label="Street Address / Office"
            placeholder="e.g. Barangay Hall, Zone 1"
            value={address}
            onValueChange={setAddress}
            errorMessage={!address && error ? 'Required' : ''}
          />

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
