import { formatTimeRemaining, formatTimeSince } from '@/helper/commonHelpers';
import { StatusTemplateProps } from '@/types/types';
import { Avatar, Card, CardBody, CardFooter, CardHeader, Chip, Image } from '@heroui/react';
import { Ellipsis, Phone } from 'lucide-react';

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
  phoneNumber,
  expiresAt,
  className,
  vid,
}: StatusTemplateProps) => {
  return (
    <Card
      className={`max-w-[500px] max-h-[580px] dark:border dark:border-gray-700 ${className}`}
      key={uid}
      style={style}
    >
      <CardHeader className="justify-between w-full">
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
              {location}
            </h5>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex flex-row justify-end gap-5">
            <p className="opacity-70">{formatTimeRemaining(expiresAt)}</p>
            <Ellipsis size={24} className="cursor-pointer opacity-70" />
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
          <p contentEditable className="text-wrap break-words max-h-24 overflow-y-auto">
            {note}
          </p>
        </div>
        <Image alt="HeroUI hero Image" src={image} className="mt-4" />
      </CardBody>
      <CardFooter className="flex flex-row justify-between h-auto">
        <div className="flex gap-2 min-w-0 flex-1">
          {phoneNumber && (
            <>
              <Phone size={20} className="text-default-400 flex-shrink-0" />
              <p className="text-small break-words word-break overflow-wrap-anywhere">{phoneNumber}</p>
            </>
          )}
        </div>
        <div className="flex gap-2 min-w-0 flex-1">
          {vid && (
            <>
              <p className="flex-shrink-0">VID:</p>
              <p className="text-small break-words word-break overflow-wrap-anywhere">{vid}</p>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
