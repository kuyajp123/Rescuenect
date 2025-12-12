import { SecondaryButton } from '@/components/ui/button';
import { revokeToken } from '@/config/notificationPermission';
import { ThemeSwitcher } from '@/hooks/ThemeSwitcher';
import { auth } from '@/lib/firebaseConfig';
import { useAuth } from '@/stores/useAuth';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { Avatar } from '@heroui/avatar';
import {
  BreadcrumbItem,
  Breadcrumbs,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  User,
} from '@heroui/react';
import { getAuth, signOut } from 'firebase/auth';
import { Bell, PlusIcon, Settings } from 'lucide-react';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const getUnreadCount = useNotificationStore(state => state.getUnreadCount);
  const notifications = useNotificationStore(state => state.notifications);
  const uid = auth.currentUser?.uid;
  const admin = useAuth(state => state.auth);

  const unreadCount = useMemo(() => getUnreadCount(uid), [notifications, getUnreadCount]);

  const handleSignOut = async () => {
    const auth = getAuth();

    try {
      revokeToken();
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Generate breadcrumb items based on current route
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(segment => segment !== '');
    const breadcrumbs = [];

    // Always start with Dashboard (Home)
    breadcrumbs.push({
      label: 'Dashboard',
      path: '/',
      isCurrent: location.pathname === '/',
    });

    // Build breadcrumbs based on path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      let label = '';
      switch (currentPath) {
        case '/status':
          label = 'Status';
          break;
        case '/status/history':
          label = 'History';
          break;
        case '/status/history/versions':
          label = 'Versions';
          break;
        case '/status/history/save-as-pdf':
          label = 'Save as PDF';
          break;
        case '/weather':
          label = 'Weather';
          break;
        case '/earthquake':
          label = 'Earthquake';
          break;
        case '/evacuation/add_new_center':
          label = 'Add New Center';
          break;
        case '/profile':
          label = 'Profile';
          break;
        case '/notification':
          label = 'Notification';
          break;
        default:
          label = segment.charAt(0).toUpperCase() + segment.slice(1);
      }

      breadcrumbs.push({
        label,
        path: currentPath,
        isCurrent: isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="flex flex-row justify-between w-full">
      <div className="text-xl ml-8 font-bold flex items-end pb-4">
        <Breadcrumbs>
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem
              key={`${crumb.path}-${index}`}
              className={
                crumb.isCurrent
                  ? 'text-foreground font-semibold'
                  : 'text-default-500 hover:text-foreground cursor-pointer'
              }
              aria-current={crumb.isCurrent ? 'page' : undefined}
              onClick={() => !crumb.isCurrent && navigate(crumb.path)}
            >
              {crumb.label}
            </BreadcrumbItem>
          ))}
        </Breadcrumbs>
      </div>

      <div className="flex flex-row space-x-5 items-center p-4">
        <ThemeSwitcher />
        <div className="relative">
          <SecondaryButton
            className="rounded-full border-none"
            onPress={() => navigate('/notification', { replace: true })}
            isIconOnly
          >
            <Bell size={20} />
          </SecondaryButton>
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 rounded-full border border-white flex items-center justify-center text-white text-xs font-semibold px-1"
              style={{ zIndex: 9999 }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <div>
          <Settings size={20} className="inline-block mr-2" />
        </div>
        <div>
          <Dropdown
            showArrow
            classNames={{
              base: 'before:bg-default-200', // change arrow background
              content: 'p-0 border-small border-divider bg-background',
            }}
            radius="sm"
          >
            <DropdownTrigger className="cursor-pointer flex items-center">
              <div className=" flex items-center">
                <Avatar
                  size="sm"
                  src={admin?.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}
                  name={admin?.displayName || 'John Doe'}
                  className="inline-block mr-2 "
                />
                <span className="text-default-600">{admin?.displayName}</span>
              </div>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Custom item styles"
              className="p-3"
              disabledKeys={['profile']}
              itemClasses={{
                base: [
                  'rounded-md',
                  'text-default-500',
                  'transition-opacity',
                  'data-[hover=true]:text-foreground',
                  'data-[hover=true]:bg-default-100',
                  'dark:data-[hover=true]:bg-default-50',
                  'data-[selectable=true]:focus:bg-default-50',
                  'data-[pressed=true]:opacity-70',
                  'data-[focus-visible=true]:ring-default-500',
                ],
              }}
            >
              <DropdownSection showDivider aria-label="Profile & Actions">
                <DropdownItem key="profile" isReadOnly className="h-14 gap-2 opacity-100">
                  <User
                    avatarProps={{
                      size: 'sm',
                      src:
                        admin?.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
                    }}
                    classNames={{
                      name: 'text-default-600',
                      description: 'text-default-500',
                    }}
                    description={admin?.email!}
                    name={admin?.displayName!}
                  />
                </DropdownItem>
                <DropdownItem onClick={() => navigate('/profile', { replace: true })} key="dashboard">
                  Profile
                </DropdownItem>
                <DropdownItem key="settings">Settings</DropdownItem>
                <DropdownItem key="new_project" endContent={<PlusIcon className="text-large" />}>
                  New Project
                </DropdownItem>
              </DropdownSection>

              <DropdownSection showDivider aria-label="Preferences">
                <DropdownItem key="quick_search" shortcut="⌘K">
                  Quick search
                </DropdownItem>
                <DropdownItem
                  key="theme"
                  isReadOnly
                  className="cursor-default"
                  endContent={
                    <select
                      className="z-10 outline-solid outline-transparent w-16 py-0.5 rounded-md text-tiny group-data-[hover=true]:border-default-500 border-small border-default-300 dark:border-default-200 bg-transparent text-default-500"
                      id="theme"
                      name="theme"
                    >
                      <option>System</option>
                      <option>Dark</option>
                      <option>Light</option>
                    </select>
                  }
                >
                  Theme
                </DropdownItem>
              </DropdownSection>

              <DropdownSection aria-label="Help & Feedback">
                <DropdownItem key="help_and_feedback">Help & Feedback</DropdownItem>
                <DropdownItem key="logout" onClick={handleSignOut}>
                  Log Out
                </DropdownItem>
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default Header;
