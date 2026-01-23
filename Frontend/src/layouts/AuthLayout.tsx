import GridShape from '@/components/ui/grid/GridShape';
import { ThemeSwitcher } from '@/hooks/ThemeSwitcher';
import { Link, Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-tertiary dark:bg-white/5 lg:grid">
          <div className="relative flex items-center justify-center z-1">
            {/* <!-- ===== Common Grid Shape Start ===== --> */}
            <GridShape />

            <div className="flex flex-col items-center max-w-xs">
              <div className="flex flex-col items-center mb-6 sm:mb-8">
                <img width={60} height={100} src="/images/logo/logo.svg" alt="Logo" />
                <p className="text-4xl mt-2 text-white font-semibold">Rescuenect</p>
              </div>
              <p className="text-center text-gray-400 dark:text-white/60">
                A Disaster Risk Management System For Barangay Bancaan, Naic Cavite
              </p>
            </div>
          </div>
        </div>
        <Outlet />
        <div className="fixed z-50 bottom-6 left-6 right-6 hidden sm:flex items-center justify-between">
          {/* Legal Links on the left */}
          <div className="flex space-x-5">
            <Link className="text-white hover:text-gray-200" to="/terms-and-condition" target="_blank" rel="noopener noreferrer">
              Terms & Conditions
            </Link>
            <Link className="text-white hover:text-gray-200" to="/privacy-policy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </Link>
          </div>

          {/* Theme Switcher on the right */}
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
