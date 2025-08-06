import GridShape from '@/components/ui/grid/GridShape';
import { Outlet } from 'react-router-dom';
import { ThemeSwitcher } from '@/components/hooks/ThemeSwitcher';

const AuthLayout = () => {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-tertiary dark:bg-white/5 lg:grid">
          <div className="relative flex items-center justify-center z-1">
            {/* <!-- ===== Common Grid Shape Start ===== --> */}
            <GridShape />
            
            <div className="flex flex-col items-center max-w-xs">
              <div className='flex flex-col items-center mb-6 sm:mb-8'>
                {/* <img
                  width={231}
                  height={48}
                  src="/images/logo/auth-logo.svg"
                  alt="Logo"
                /> */}
                <p className='text-4xl text-white font-semibold'>Rescuenect</p>
              </div>
              <p className="text-center text-gray-400 dark:text-white/60">
                A Disaster Risk Management System For Naic Cavite
              </p>
            </div>
          </div>
        </div>
        <Outlet />
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout