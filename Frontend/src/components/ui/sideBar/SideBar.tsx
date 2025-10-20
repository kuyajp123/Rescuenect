import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin,
  LayoutDashboard,
  Activity,
  Cloud,
  PanelRightClose,
  PanelRightOpen,
  Box,
} from 'lucide-react';

interface SideBarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const SideBar = ({ isOpen, onToggle }: SideBarProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  const isExpanded = isOpen || isHovered;

  const active = (path: string) =>
    isActive(path)
      ? 'bg-[#ecf6fe] dark:bg-[#012b41] relative before:content-[""] before:absolute before:left-0 before:top-0 before:w-1 before:h-full before:bg-[#0EA5E9]'
      : 'hover:bg-[#75757538] hover:bg-opacity-50 relative';

  const baseClass = 'flex items-center py-3 transition-all duration-200 ease-in-out cursor-pointer group';

  const navigationItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/status', icon: MapPin, label: 'Status' },
    // { path: '/city', icon: Map, label: 'City' },
    { path: '/weather', icon: Cloud, label: 'Weather' },
    { path: '/earthquake', icon: Activity, label: 'Earthquake' },
    // { path: '/add_notification', icon: Megaphone, label: 'Add Notification' },
    // { path: '/add_event', icon: CalendarPlus, label: 'Add Event' },
  ];

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={`fixed top-4 z-40 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isExpanded ? 'left-[13.5rem]' : 'left-17'
        }`}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? (
          <PanelRightOpen size={20} className="text-gray-600 dark:text-gray-300" />
        ) : (
          <PanelRightClose size={20} className="text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {/* Mobile overlay */}
      {isExpanded && !isOpen && <div className="fixed inset-0 z-20 lg:hidden" onClick={() => setIsHovered(false)} />}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-30 h-full bg-card dark:bg-card-dark border-r border-border dark:border-border-dark shadow-xl transition-all duration-300 ease-in-out lg:relative lg:z-auto lg:shadow-md ${
          isOpen ? 'translate-x-0' : isHovered ? 'translate-x-0 lg:translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isExpanded ? 'w-60' : 'lg:w-16 w-60'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div
            className={`flex items-center mt-4 mb-8 text-xl font-bold text-primary dark:text-white flex-shrink-0 transition-all duration-300 ${
              isExpanded ? 'p-4 pl-10' : 'justify-center p-4'
            }`}
          >
            <Box size={24} className="flex-shrink-0" />
            <span
              className={`ml-2 transition-opacity duration-300 ${
                isExpanded ? 'opacity-100' : 'opacity-0 lg:opacity-0'
              } ${!isExpanded ? 'lg:hidden' : ''}`}
            >
              Rescuenect
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col flex-1 overflow-y-auto">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={`nav-${item.path}-${index}`}
                  className={`${baseClass} ${active(item.path)} ${
                    isExpanded ? 'px-10' : 'px-2 justify-center lg:justify-center'
                  }`}
                  onClick={() => navigate(item.path, { replace: true })}
                  title={!isExpanded ? item.label : ''}
                >
                  <Icon
                    size={20}
                    className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive(item.path) ? 'text-[#0EA5E9]' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  />
                  <span
                    className={`ml-3 transition-opacity duration-300 ${
                      isExpanded ? 'opacity-100' : 'opacity-0 lg:opacity-0'
                    } ${!isExpanded ? 'lg:hidden' : ''} ${
                      isActive(item.path) ? 'text-[#0EA5E9] font-medium' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default SideBar;
