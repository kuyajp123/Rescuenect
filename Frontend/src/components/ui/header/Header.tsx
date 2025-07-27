import { ThemeSwitcher } from '@/components/hooks/ThemeSwitcher'
import { Bell, Settings } from 'lucide-react'
import {Avatar} from "@heroui/avatar";
import  UrlLocation from '@/components/helper/UrlLocation';

const Header = () => {

  return (
    <div className='flex flex-row justify-between w-full'>
        <div className='text-xl font-bold flex items-end pb-4'>
            {UrlLocation()}
        </div>

        <div className='flex flex-row space-x-5 items-center p-4'>
            <ThemeSwitcher />
            <div>
                <Bell size={20} className='inline-block mr-2' /> Notification
            </div>
            <div>
                <Settings size={20} className='inline-block mr-2' /> Settings
            </div>
            <div>
                <Avatar 
                    size="sm" 
                    src="https://i.pravatar.cc/150?u=a042581f4e29026024d" 
                    name="John Doe" 
                    className='inline-block mr-2' 
                /> 
                John Doe
            </div>
        </div>
    </div>
  )
}

export default Header