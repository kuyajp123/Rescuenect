import { useState } from 'react';
import { Select, SelectItem } from "@heroui/react";
import { StatusCard, StatusList , Map } from '@/components/ui/status';

export const statuses = [
  {key: "safe", label: "Safe"},
  {key: "evacuated", label: "Evacuated"},
  {key: "affected", label: "Affected"},
  {key: "missing", label: "Missing"},
  {key: "all", label: "Select all"}
];

const Status = () => {
  const [selectedStatuses, setSelectedStatuses] = useState(new Set(["all"]));

  return (
    <div className='grid  grid-cols-[2fr_1fr] gap-4' style={{ height: '100%', width: '100%' }}>
      <div style={{ height: '100%', width: '100%' }}>
        <Map />
      </div>
      <div className='h-full grid grid-rows-[1fr_4fr]'>
        <div className='flex flex-col justify-between'>
          <StatusList
            Safe={24}
            Evacuated={12}
            Affected={32}
            Missing={8}
          />
          <div>
            <Select
              label="Select status"
              placeholder="Select a status"
              selectedKeys={selectedStatuses}
              selectionMode="multiple"
              onSelectionChange={(keys) => setSelectedStatuses(new Set(Array.from(keys).map(String)))}
            >
              {statuses.map((statuses) => (
                <SelectItem key={statuses.key}>{statuses.label}</SelectItem>
              ))}
            </Select>
          </div>
        </div>
        <div className='pt-4'>
          <StatusCard
            id={1}
            picture="https://heroui.com/avatars/avatar-1.png"
            firstName="Zoey"
            lastName="Lang"
            status="safe"
            loc="Manila, Philippines"
            date="Oct 22, 2025"
            time="5:45 pm"
            description="Frontend developer and UI/UX enthusiast. Join me on this coding adventure!"
            image="https://heroui.com/images/hero-card-complete.jpeg"
            person={4}
            contact="0123-456-7890"
          />
        </div>
      </div>
    </div>
  );
};

export default Status;
