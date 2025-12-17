import { Outlet } from 'react-router-dom';

const Onboarding = () => {
  return (
    <div className="h-screen w-full dark:bg-bg-dark">
      Onboarding
      <div>
        <Outlet />
      </div>
    </div>
  );
};

export default Onboarding;
