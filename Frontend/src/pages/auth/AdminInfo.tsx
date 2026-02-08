import { API_ENDPOINTS } from '@/config/endPoints';
import { formatContactNumber } from '@/helper/commonHelpers';
import { useAuth } from '@/stores/useAuth';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { Button } from '@heroui/button';
import { Input, Textarea } from '@heroui/input';
import axios from 'axios';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminInfo = () => {
  const navigate = useNavigate();
  const { barangay, address } = useOnboardingStore();
  // const userData = useAuth(state => state.userData);
  const updateUserData = useAuth(state => state.updateUserData);
  const auth = useAuth(state => state.auth);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('Rescuenect Administrator');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleGoToDashboard = () => {
    updateUserData({
      firstName,
      lastName,
      phone,
      bio,
      barangay,
      address,
      onboardingComplete: true,
    });
    // Clear onboarding store
    useOnboardingStore.getState().reset();
    navigate('/');
  };

  const handleSubmit = async () => {
    if (!firstName || !lastName || !phone) {
      setError('Please fill required fields');
      return;
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (!/^09\d{9}$/.test(digitsOnly)) {
      setError('Contact number must start with 09 and be 11 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (!auth) throw new Error('Not authenticated');
      const idToken = await auth.getIdToken();

      // Ensure we have address data, if not redirect back
      if (!barangay || !address) {
        navigate('/address-setup');
        return;
      }

      await axios.post(
        API_ENDPOINTS.AUTH.UPDATE_PROFILE,
        {
          uid: auth.uid,
          firstName,
          lastName,
          phone,
          bio,
          barangay,
          address,
        },
        {
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );

      // success
      setIsSuccess(true);

      // Removed immediate store update here to prevent auto-redirect
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 animate-fade-in-up text-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-3xl font-bold mb-2">You're all set!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm">
          Your admin profile has been created successfully. Welcome to Rescuenect Admin.
        </p>
        <Button color="primary" size="lg" onPress={handleGoToDashboard}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 animate-fade-in-up py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Details</h2>
          <p className="text-gray-600 dark:text-gray-400">Tell us a bit about yourself.</p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              label="First Name"
              placeholder="Juan"
              value={firstName}
              onValueChange={setFirstName}
              isRequired
              className="flex-1"
            />
            <Input
              label="Last Name"
              placeholder="Dela Cruz"
              value={lastName}
              onValueChange={setLastName}
              isRequired
              className="flex-1"
            />
          </div>

          <Input
            label="Phone Number"
            placeholder="0912 345 6789"
            value={phone}
            onValueChange={val => setPhone(formatContactNumber(val))}
            isRequired
            type="tel"
          />

          <Textarea label="Bio" placeholder="Short description..." value={bio} onValueChange={setBio} minRows={2} />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button color="primary" size="lg" className="w-full mt-4" isLoading={isLoading} onPress={handleSubmit}>
            Complete Setup
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminInfo;
