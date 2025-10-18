import { Card, CardHeader, CardBody, CardFooter, Avatar, Chip, Image } from '@heroui/react';
import { Ellipsis } from 'lucide-react';
import { Phone } from 'lucide-react';
import { StatusTemplateProps } from '@/components/shared/types';
import { formatTimeSince, formatTimeRemaining } from '@/components/helper/commonHelpers';

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
}: StatusTemplateProps) => {
  return (
    <Card className="w-full max-h-[580px] dark:border dark:border-gray-700" key={uid} style={style}>
      <CardHeader className="justify-between">
        <div className="flex gap-5">
          <Avatar radius="full" size="md" src={profileImage} />
          <div className="flex w-[80%] flex-col gap-1 items-start justify-center flex-wrap">
            <h4 className="text-small leading-none">
              {firstName} {lastName}
            </h4>
            <h5 className="text-small tracking-tight opacity-70">{formatTimeSince(createdAt)}</h5>
            <h5 className="text-small tracking-tight">{location}</h5>
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
                {condition}
              </Chip>
            )}
            {condition === 'evacuated' && (
              <Chip color="primary" className="text-white">
                {condition}
              </Chip>
            )}
            {condition === 'affected' && (
              <Chip color="warning" className="text-white">
                {condition}
              </Chip>
            )}
            {condition === 'missing' && (
              <Chip color="danger" className="text-white">
                {condition}
              </Chip>
            )}
          </div>
        </div>
      </CardHeader>
      <CardBody className="px-3 py-0 text-small min-h-auto">
        <p>{note}</p>
        <Image alt="HeroUI hero Image" src={image} className="mt-4" />
      </CardBody>
      <CardFooter className="gap-3 h-auto">
        <div className="flex gap-1">
          {phoneNumber && (
            <>
              <Phone size={20} className="text-default-400" />
              <p className="text-small">{phoneNumber}</p>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
