import { ThemeSwitcher } from '@/hooks/ThemeSwitcher';
import { Outlet } from 'react-router-dom';

const Onboarding = () => {
  return (
    <div className="relative flex flex-col justify-center w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-4xl mx-auto p-6">
        {/* Optional Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <img src="/images/logo/logo.svg" alt="Rescuenect" className="w-8 h-8" />
            <span className="font-bold text-xl text-gray-800 dark:text-white">Rescuenect Admin</span>
          </div>
          <ThemeSwitcher />
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden min-h-[500px] flex items-center justify-center">
          <Outlet />
        </div>

        <p className="text-center text-gray-400 dark:text-gray-500 mt-8 text-sm">
          &copy; {new Date().getFullYear()} Rescuenect. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
