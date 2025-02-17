import React, { useState } from 'react';
import DarkModeBtn from './DarkModeBtn'

const Test = () => {
  const [darkMode, setDarkMode] = useState(true); // Parent manages the dark mode state

  return (
    <>
      <DarkModeBtn toggleDarkmode={darkMode} setToggleDarkmode={setDarkMode}/>
      <h1>{darkMode ? 'Dark Mode is ON' : 'Dark Mode is OFF'}</h1>
    </>
  )
}

export default Test