import EvacuationTable, { PlusIcon } from '@/components/ui/table/EvacuationTable';
import { Button } from '@heroui/react';
import { List, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const index = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full">
      <div className="flex flex-row justify-between mb-5">
        <p className="text-3xl font-bold">Evacuation centers</p>
        <div className="flex flex-row gap-4">
          <div className="flex gap-2">
            <Button isIconOnly variant="flat" color="primary">
              <List size={20} />
            </Button>
            <Button isIconOnly variant="flat" color="default">
              <Map size={20} />
            </Button>
          </div>
          <Button
            color="primary"
            onPress={() => {
              navigate('add_new_center', { replace: true });
            }}
            endContent={<PlusIcon />}
          >
            Add New
          </Button>
        </div>
      </div>
      <EvacuationTable />
    </div>
  );
};

export default index;
