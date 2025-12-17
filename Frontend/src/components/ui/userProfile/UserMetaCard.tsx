import { useAuth } from '@/stores/useAuth';
import { Avatar } from '@heroui/react';

export default function UserMetaCard() {
  const admin = useAuth(state => state.auth);
  const userData = useAuth(state => state.userData);

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col items-center gap-4 lg:flex-row">
            <div className="relative rounded-full border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
              <Avatar
                size="lg"
                src={admin?.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}
                classNames={{
                  name: 'text-default-600',
                }}
                name={admin?.displayName!}
              />
            </div>

            <div>
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 lg:text-left">
                {userData ? `${userData.firstName} ${userData.lastName}` : 'Admin'}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">Rescuenect Administrator</p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{userData?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
