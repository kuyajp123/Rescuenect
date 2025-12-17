import UserAddressCard from '@/components/ui/userProfile/UserAddressCard';
import UserInfoCard from '@/components/ui/userProfile/UserInforCard';
import UserMetaCard from '@/components/ui/userProfile/UserMetaCard';
import { Card, CardBody } from '@heroui/react';

export default function UserProfiles() {
  return (
    // <div className="container mx-auto px-4 py-8">
    <div className="w-full flex flex-col items-center">
      <div className="lg:w-[85%] sm:w-[100%] md:[w-[90%] w-full">
        <div className="flex flex-wrap  items-center justify-between gap-3 mb-6">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-white/90" x-text="pageName">
            Profile
          </h2>
        </div>
        <Card>
          <CardBody>
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">Profile</h3>
            <div className="space-y-6">
              <UserMetaCard />
              <UserInfoCard />
              <UserAddressCard />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
