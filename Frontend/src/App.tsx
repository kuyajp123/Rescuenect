import { Route, Routes, Link } from 'react-router-dom'
import LoginPage from './pages/LoginPage';
import { ThemeSwitcher } from './pages/ThemeSwitcher';
import Profile from './pages/Profile';

function App() {

  return (
    <div className='bg-bg dark:bg-bg h-screen w-full flex flex-col'>
      <ThemeSwitcher />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
