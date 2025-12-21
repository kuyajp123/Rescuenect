import { Spinner } from '@heroui/react';

export const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-gray-50 dark:bg-gray-900 gap-6">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <img
            src="/images/logo/logo.svg"
            alt="Rescuenect Logo"
            className="w-full h-full object-contain animate-pulse"
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 tracking-tight">
            Rescuenect
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide text-center">
            Disaster Management System
          </p>
        </div>
      </div>

      <Spinner
        size="lg"
        color="primary"
        classNames={{
          circle1: 'border-b-blue-600 dark:border-b-blue-400',
          circle2: 'border-b-cyan-600 dark:border-b-cyan-400',
        }}
      />
    </div>
  );
};
