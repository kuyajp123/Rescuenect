import { useLocation, useNavigate  } from 'react-router-dom';
import { MapPin, Activity, Cloud, Megaphone, Heart, CalendarPlus, LifeBuoy } from 'lucide-react'

const SideBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isActive = (path: string) => location.pathname === path;

    const active = (path: string) =>
        isActive(path)
            ? 'bg-[#ecf6fe] dark:bg-[#012b41] relative before:content-[""] before:absolute before:left-0 before:top-0 before:w-1 before:h-full before:bg-[#0EA5E9]'
            : 'hover:bg-[#75757538] relative';
    
    const baseClass = 'pl-12 py-3 transition-colors cursor-pointer';

  return (
    <div className="bg-card dark:bg-card-dark w-55 h-screen flex flex-col border-border dark:border-border-dark shadow-md">
        <div className='p-4 pl-12 mt-4 text-xl font-bold text-primary dark:text-white'>Rescuenect</div>

        <div className='flex flex-col'>
            <div className='mt-10'>
                <div
                    className={`${baseClass} ${active('/')}`}
                    onClick={() => navigate('/', { replace: true })}
                >
                    <MapPin size={16} className='inline-block mr-3' />
                    Status
                </div>
                <div className={`${baseClass} ${active('/weather')}`} 
                    onClick={() => navigate('/weather', { replace: true })}
                >
                    <Cloud size={16} className='inline-block mr-3' />
                    Weather
                </div>
                <div className={`${baseClass} ${active('/earthquake')}`}
                    onClick={() => navigate('/earthquake', { replace: true })}
                >
                    <Activity size={16} className='inline-block mr-3' />
                    Earthquake
                </div>
            </div>

            <div>
                <div className={`${baseClass} ${active('/add_notification')}`} 
                    onClick={() => navigate('/add_notification', { replace: true })}
                >
                    <Megaphone size={16} className='inline-block mr-3' />
                    Add Notification
                </div>
                <div className={`${baseClass} ${active('/add_event')}`} 
                    onClick={() => navigate('/add_event', { replace: true })}
                >
                    <CalendarPlus size={16} className='inline-block mr-3' />
                    Add Event
                </div>
            </div>

            <div>
                <div className={`${baseClass} ${active('/donation')}`}
                    onClick={() => navigate('/donation', { replace: true })}
                >
                    <Heart size={16} className='inline-block mr-3' />
                    Donations
                </div>
                <div className={`${baseClass} ${active('/volunteer')}`}
                    onClick={() => navigate('/volunteer', { replace: true })}
                >
                    <LifeBuoy size={16} className='inline-block mr-3' />
                    Volunteer
                </div>
            </div>
        </div>

    </div>
  )
}

export default SideBar