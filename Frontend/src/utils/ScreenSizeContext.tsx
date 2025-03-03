import React, { createContext, useContext, useEffect, useState } from 'react';

interface ScreenSizeContextType {
  screenSize: string; 
}

const ScreenSizeContext = createContext<ScreenSizeContextType | undefined>(undefined);

const ScreenSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screenSize, setScreenSize] = useState<string>(''); 

  useEffect(() => {
    const updateScreenSize = () => {
      if (window.innerWidth > 768) {
        setScreenSize('desktop');
      } else if (window.innerWidth > 576) {
        setScreenSize('tablet');
      } else {
        setScreenSize('mobile');
      }
    };

    window.addEventListener('resize', updateScreenSize);
    
    updateScreenSize();

    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return (
    <ScreenSizeContext.Provider value={{ screenSize }}>
      {children}
    </ScreenSizeContext.Provider>
  );
};

export const useScreenSize = () => {
  const context = useContext(ScreenSizeContext);

  if (!context) {
    throw new Error("useScreenSize must be used within a ScreenSizeProvider");
  }

  return context;
};

export default ScreenSizeProvider;