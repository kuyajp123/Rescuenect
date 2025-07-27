import { useLocation, useNavigate  } from 'react-router-dom';
import { MapPin, Activity, Cloud, Megaphone, Heart, CalendarPlus, LifeBuoy } from 'lucide-react'

const SideBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isActive = (path: string) => location.pathname === path;

  return (
    <div className='bg-primary_plain dark:bg-card w-64 h-screen text-white flex flex-col'>
        <div className='p-4 text-2xl font-bold'>Rescuenect</div>

        <div className='flex flex-col gap-4'>
            <div className='mt-5'>
                <div
                    className={`p-4 transition-colors cursor-pointer ${
                        isActive('/') ? 'bg-[#0F172A] dark:bg-primary_plain' : 'hover:bg-[#75757538]'
                    }`}
                    onClick={() => navigate('/', { replace: true })}
                >
                    <MapPin className='h-5 w-5 inline-block mr-2' />
                    Status
                </div>
                <div className={`p-4 transition-colors cursor-pointer ${
                        isActive('/weather') ? 'bg-[#0F172A] dark:bg-primary_plain' : 'hover:bg-[#75757538]'
                    }`} 
                    onClick={() => navigate('/weather', { replace: true })}
                >
                    <Cloud className='h-5 w-5 inline-block mr-2' />
                    Weather
                </div>
                <div className={`p-4 transition-colors cursor-pointer ${
                        isActive('/earthquake') ? 'bg-[#0F172A] dark:bg-primary_plain' : 'hover:bg-[#75757538]'
                    }`} 
                    onClick={() => navigate('/earthquake', { replace: true })}
                >
                    <Activity className='h-5 w-5 inline-block mr-2' />
                    Earthquake
                </div>
            </div>

            <div className='opacity-70 text-xs ml-4'>
                app
            </div>

            <div>
                <div className={`p-4 transition-colors cursor-pointer ${
                        isActive('/add_notification') ? 'bg-[#0F172A] dark:bg-primary_plain' : 'hover:bg-[#75757538]'
                    }`} 
                    onClick={() => navigate('/add_notification', { replace: true })}
                >
                    <Megaphone className='h-5 w-5 inline-block mr-2' />
                    Add Notification
                </div>
                <div className={`p-4 transition-colors cursor-pointer ${
                        isActive('/add_event') ? 'bg-[#0F172A] dark:bg-primary_plain' : 'hover:bg-[#75757538]'
                    }`} 
                    onClick={() => navigate('/add_event', { replace: true })}
                >
                    <CalendarPlus className='h-5 w-5 inline-block mr-2' />
                    Add Event
                </div>
            </div>

            <div className='opacity-70 text-xs ml-4'>
                Community
            </div>

            <div>
                <div className={`p-4 transition-colors cursor-pointer ${
                        isActive('/donation') ? 'bg-[#0F172A] dark:bg-primary_plain' : 'hover:bg-[#75757538]'
                    }`} 
                    onClick={() => navigate('/donation', { replace: true })}
                >
                    <Heart className='h-5 w-5 inline-block mr-2' />
                    Donations
                </div>
                <div className={`p-4 transition-colors cursor-pointer ${
                        isActive('/volunteer') ? 'bg-[#0F172A] dark:bg-primary_plain' : 'hover:bg-[#75757538]'
                    }`} 
                    onClick={() => navigate('/volunteer', { replace: true })}
                >
                    <LifeBuoy className='h-5 w-5 inline-block mr-2' />
                    Volunteer
                </div>
            </div>
        </div>

    </div>
  )
}

export default SideBar