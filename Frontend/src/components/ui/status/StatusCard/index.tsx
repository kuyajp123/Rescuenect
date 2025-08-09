import { 
    Card, 
    CardHeader, 
    CardBody, 
    CardFooter, 
    Avatar, 
    Chip, 
    Image
} from "@heroui/react";
import { Phone } from 'lucide-react'
import { StatusTemplateProps } from '@/components/shared/types';

export const StatusCard = ({
  style,
  id,
  picture,
  firstName,
  lastName,
  status,
  loc,
  date,
  time,
  description,
  image,
  person,
  contact,
}: StatusTemplateProps) => {
  return (
    <Card 
    className="w-full max-h-[580px] dark:border dark:border-gray-700"
    key={id}
    style={style}
    >
        <CardHeader className="justify-between">
            <div className="flex gap-5">
            <Avatar
                radius="full"
                size="md"
                src={picture}
            />
            <div className="flex flex-col gap-1 items-start justify-center">
                <h4 className="text-small font-semibold leading-none text-default-600">{firstName} {lastName}</h4>
                <h5 className="text-small tracking-tight text-default-400">{date} • {time}</h5>
                <h5 className="text-small tracking-tight text-default-600">{loc}</h5>
            </div>
            </div>
            <Chip color="success" className='text-white'>{status}</Chip> { /* color="success", "priamry", "warning", "danger"  */}
        </CardHeader>
        <CardBody className="px-3 py-0 text-small min-h-[100px]">
            <p>{description}</p>
            <Image
                alt="HeroUI hero Image"
                src={image}
                className='mt-4'
            />
        </CardBody>
        <CardFooter className="gap-3">
            <div className="flex gap-1">
            <p className="font-semibold text-default-400 text-small">{person}</p>
            <p className=" text-default-400 text-small">Person</p>
            </div>
            <div className="flex gap-1">
            <Phone size={20} className="text-default-400" />
            <p className="text-default-400 text-small">{contact}</p>
            </div>
        </CardFooter>
    </Card>
  )
}