import React, { useState } from 'react';
import { Button } from '@heroui/react';

interface ToggleDarkmodeProps {
  toggleDarkmode: boolean;
  setToggleDarkmode: React.Dispatch<React.SetStateAction<boolean>>; // Function to update the parent state
}

const DarkModeBtn: React.FC<ToggleDarkmodeProps> = ({ toggleDarkmode, setToggleDarkmode }) => {
  const [darkMode, setDarkMode] = useState(toggleDarkmode); // Use the prop value as the initial state

  const handleClick = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    setToggleDarkmode(newDarkMode); // Pass the updated value back to the parent
  };

  return (
    <div>
      <Button color="primary" onClick={handleClick}>
        {darkMode ? 'Dark mode' : 'Light mode'}
      </Button>
    </div>
  );
};

export default DarkModeBtn;
