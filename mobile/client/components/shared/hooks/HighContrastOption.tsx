import { ToggleButton } from '@/components/ui/button/Button';
import { useHighContrast } from '@/contexts/HighContrastContext';
import React from 'react';

export const HighContrastOption = () => {
  const { isHighContrast, toggleHighContrast } = useHighContrast();

  return (
      <ToggleButton 
        isEnabled={isHighContrast}
        onToggle={toggleHighContrast}
      />
  );
};

export default HighContrastOption;