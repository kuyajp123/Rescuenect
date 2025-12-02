import { SecondaryButton } from '@/components/ui/button';
import { Card, Chip, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';
import { Activity, EllipsisVertical } from 'lucide-react';

export const Notification = () => {
  return (
    <Card className="w-full border border-default-100" shadow="none">
      <div className="p-4">
        <p className="text-3xl font-bold">Notification</p>
      </div>
      <div className="mt-5">
        {/* unread notification */}
        <Card
          shadow="none"
          radius="none"
          className="flex flex-row gap-4 items-center border-y border-default-100 bg-content1 hover:border-default-300 hover:cursor-pointer p-4"
        >
          <Activity size={20} className="text-gray-600 dark:text-gray-400 flex-shrink-0" />
          <p className="mr-auto truncate">Notification Text here</p>
          <div className="flex flex-row gap-4 items-center flex-shrink-0">
            <Chip size="sm" variant="flat" color="primary">
              New
            </Chip>
            <p className="text-default-400">12:00 PM</p>
            <Dropdown>
              <DropdownTrigger>
                <SecondaryButton className="rounded-full border-none" isIconOnly>
                  <EllipsisVertical size={20} />
                </SecondaryButton>
              </DropdownTrigger>
              <DropdownMenu aria-label="Static Actions">
                <DropdownItem key="delete" className="text-danger" color="danger">
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </Card>

        {/* read notification */}
        <Card
          shadow="none"
          radius="none"
          className="flex flex-row gap-4 items-center border-y border-default-100 bg-bg dark:bg-bg-dark hover:border-default-300 hover:cursor-pointer p-4"
        >
          <Activity size={20} className="text-gray-600 dark:text-gray-400 flex-shrink-0" />
          <p className="mr-auto truncate">Notification Text here</p>
          <div className="flex flex-row gap-4 items-center flex-shrink-0">
            <p className="text-default-400">12:00 PM</p>
            <Dropdown>
              <DropdownTrigger>
                <SecondaryButton className="rounded-full border-none" isIconOnly>
                  <EllipsisVertical size={20} />
                </SecondaryButton>
              </DropdownTrigger>
              <DropdownMenu aria-label="Static Actions">
                <DropdownItem key="delete" className="text-danger" color="danger">
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </Card>
      </div>
    </Card>
  );
};
