import Test from "./pages/Test";
import { ThemeSwitcher } from "./pages/ThemeSwitcher";

function App() {
  return (
  <div className="bg-bg dark:bg-bg h-screen flex flex-col w-full">  
    <div className="flex justify-end items-center gap-3 w-full">
      <ThemeSwitcher />
    </div>
    <div className="flex-grow w-full">
      <div className="flex justify-center items-center h-full">
        <Test />
      </div>
    </div>
  </div>
  );
}

export default App;
