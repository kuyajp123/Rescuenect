import UserAddressCard from '@/components/ui/userProfile/UserAddressCard';
import UserInfoCard from '@/components/ui/userProfile/UserInforCard';
import UserMetaCard from '@/components/ui/userProfile/UserMetaCard';
import { API_ENDPOINTS } from '@/config/endPoints';
import { useAuth, UserData } from '@/stores/useAuth';
import { Card, CardBody } from '@heroui/react';
import axios from 'axios';
import { useState } from 'react';

export default function UserProfiles() {
  const userData = useAuth(state => state.userData);
  const auth = useAuth(state => state.auth);
  const updateUserData = useAuth(state => state.updateUserData);
  const [error, setError] = useState('');

  const handleUpdateProfile = async (data: Partial<UserData>) => {
    if (!auth) return;
    setError('');

    try {
      const idToken = await auth.getIdToken();

      // Merge current data with valid updates
      // Ensure we have all required fields for the backend if it validates strictness,
      // but our controller seems to expect specific fields.
      // We should send the full object or partial?
      // Controller expects: uid, firstName, lastName, phone, bio, barangay, address.
      // So we need to merge with existing data.

      const payload = {
        uid: auth.uid,
        firstName: data.firstName ?? userData?.firstName,
        lastName: data.lastName ?? userData?.lastName,
        phone: data.phone ?? userData?.phone,
        bio: data.bio ?? userData?.bio,
        barangay: data.barangay ?? userData?.barangay,
        address: data.address ?? userData?.address,
      };

      await axios.post(API_ENDPOINTS.AUTH.UPDATE_PROFILE, payload, { headers: { Authorization: `Bearer ${idToken}` } });

      // Update local store
      updateUserData(data);
    } catch (err: any) {
      console.error(err);
      // Ideally show a toast
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="lg:w-[85%] sm:w-[100%] md:[w-[90%] w-full">
        <div className="flex flex-wrap  items-center justify-between gap-3 mb-6">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-white/90">Profile</h2>
        </div>
        <Card>
          <CardBody>
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">Profile</h3>
            <div className="space-y-6">
              <UserMetaCard />
              <UserInfoCard userData={userData} onUpdate={handleUpdateProfile} />
              <UserAddressCard userData={userData} onUpdate={handleUpdateProfile} />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
