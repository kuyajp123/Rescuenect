import Test from './pages/Test';
import { ThemeSwitcher } from './pages/ThemeSwitcher';
import SecondaryButton from './components/SecondaryButton';
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function App() {

  return (
      <div className="bg-bg dark:bg-bg text-content_text dark:text-content_text h-screen flex flex-col w-full">
        <div className="flex justify-end items-center gap-3 ">
          <ThemeSwitcher />
        </div>
        <div className="flex items-center justify-center flex-col gap-11 w-full">
          <div className="flex justify-center items-center h-full">
            <Test />
            <SecondaryButton 
            onPress={() => {
              window.open(`${VITE_BACKEND_URL}/auth/google`, '_self');
            }}
            >Google login</SecondaryButton>
          </div>
        </div>
      </div>
  );
}

export default App;
