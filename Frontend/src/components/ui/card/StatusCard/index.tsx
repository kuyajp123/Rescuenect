import { formatTimeRemaining, formatTimeSince, parseCategory } from '@/helper/commonHelpers';
import { StatusTemplateProps } from '@/types/types';
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Image,
} from '@heroui/react';
import { CheckCircle, EllipsisVertical, MapPin, Phone, UserRound } from 'lucide-react';

export const StatusCard = ({
  style,
  uid,
  profileImage,
  firstName,
  lastName,
  condition,
  location,
  createdAt,
  note,
  image,
  category,
  people,
  phoneNumber,
  expiresAt,
  className,
  vid,
  onResolved,
  onViewDetails,
  onViewProfile,
}: StatusTemplateProps) => {
  const parsedCategory = parseCategory(category);

  return (
    <Card
      className={`max-w-[500px] max-h-[580px] dark:border dark:border-gray-700 ${className}`}
      key={uid}
      style={style}
    >
      <CardHeader className="flex-row flex-1 items-start justify-between w-full">
        <div className="flex max-w-[80%] gap-5">
          <Avatar radius="full" size="md" src={profileImage} />
          <div className="flex w-full flex-col gap-1 items-start justify-center min-w-0 flex-1">
            <h4 className="text-small leading-none break-words word-break w-full overflow-wrap-anywhere">
              {firstName} {lastName}
            </h4>
            <h5 className="text-small tracking-tight opacity-70 break-words word-break w-full overflow-wrap-anywhere">
              {formatTimeSince(createdAt)}
            </h5>
            <h5 className="text-small break-words word-break max-h-24 overflow-y-auto tracking-tight w-full overflow-wrap-anywhere">
              <MapPin size={14} className="inline mb-1 mr-1 opacity-70" />
              {location}
            </h5>
            <h5 className="text-small break-words word-break max-h-24 overflow-y-auto tracking-tight w-full overflow-wrap-anywhere">
              <Phone size={14} className="inline mb-1 mr-1 opacity-70" />
              {phoneNumber}
            </h5>
            <h5 className="text-small break-words word-break max-h-24 overflow-y-auto tracking-tight w-full overflow-wrap-anywhere">
              <UserRound size={14} className="inline mb-1 mr-1 opacity-70" />
              {people}
            </h5>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex flex-row justify-end gap-5">
            <p className="opacity-70">
              {formatTimeRemaining(expiresAt) === 'Expired' ? 'Expired' : 'Expires ' + formatTimeRemaining(expiresAt)}
            </p>
            {onResolved || onViewDetails || onViewProfile ? (
              <Dropdown shouldCloseOnInteractOutside={() => true}>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="light">
                    <EllipsisVertical className="text-default-400" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  onAction={key => {
                    // Immediately blur the focused element
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }

                    // Delay action to allow dropdown to fully close
                    setTimeout(() => {
                      if (key === 'resolved') {
                        onResolved?.();
                      } else if (key === 'details') {
                        onViewDetails?.();
                      } else if (key === 'profile') {
                        onViewProfile?.();
                      }
                    }, 150);
                  }}
                >
                  <DropdownItem key="resolved" startContent={<CheckCircle size={20} />} textValue="Resolved">
                    Resolved
                  </DropdownItem>
                  <DropdownItem key="profile" startContent={<UserRound size={20} />} textValue="View Profile">
                    View Profile
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            ) : null}
          </div>
          <div className="flex mt-5 items-center justify-center h-full">
            {condition === 'safe' && (
              <Chip color="success" className="text-white">
                Safe
              </Chip>
            )}
            {condition === 'evacuated' && (
              <Chip color="primary" className="text-white">
                Evacuated
              </Chip>
            )}
            {condition === 'affected' && (
              <Chip color="warning" className="text-white">
                Affected
              </Chip>
            )}
            {condition === 'missing' && (
              <Chip color="danger" className="text-white">
                Missing
              </Chip>
            )}
          </div>
        </div>
      </CardHeader>
      <CardBody className="px-3 py-0 text-small">
        <div className="w-full">
          {parsedCategory.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {parsedCategory.slice(0, 5).map((cat, idx) => (
                <Chip key={idx} size="sm" color="default" variant="flat" className="text-xs">
                  {cat}
                </Chip>
              ))}
              {parsedCategory.length > 5 && (
                <Chip size="sm" variant="flat" className="text-xs">
                  +{parsedCategory.length - 5}
                </Chip>
              )}
            </div>
          )}
          <p className="text-wrap break-words max-h-24 overflow-y-auto">{note}</p>
        </div>
        {image && image.trim() !== '' && <Image alt="HeroUI hero Image" src={image} className="mt-4" />}
      </CardBody>
      <CardFooter className="flex flex-row justify-between h-auto">
        <div className="flex gap-2 min-w-0 justify-end flex-1 opacity-70">
          {vid && (
            <>
              <p className="text-xs flex-shrink-0">VID:</p>
              <p className="text-xs break-words word-break overflow-wrap-anywhere">{vid}</p>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
