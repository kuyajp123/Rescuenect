import { useState, useEffect } from 'react';

import Test from './pages/Test';
import { ThemeSwitcher } from './pages/ThemeSwitcher';
import  ScreenSizeProvider  from './utils/ScreenSizeContext';

function App() {
  return (
    <ScreenSizeProvider>
      <div className="h-screen flex flex-col w-full">
        <div className="flex justify-end items-center gap-3 w-full">
          <ThemeSwitcher />
        </div>
        <div className="flex-grow w-full">
          <div className="flex justify-center items-center h-full">
            <Test />
          </div>
        </div>
      </div>
    </ScreenSizeProvider>
  );
}

export default App;
