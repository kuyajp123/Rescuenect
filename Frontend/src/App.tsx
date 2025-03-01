import Test from "./pages/Test";
import { ThemeSwitcher } from "./pages/ThemeSwitcher";

function App() {
  return (
  <div className=" h-screen flex flex-col w-full">  
    <div className="flex justify-end items-center gap-3 w-full">
      <ThemeSwitcher />
    </div>
    <p className='text-6xl'>This is headline title</p>
    <p className='text-4xl'>This is section title</p>
    <p className='text-xs opacity-70'>This is non important text</p>
    <p className='' >Normal text Normal text Normal textNormal text Normal text Normal text Normal text Normal text Normal textNormal text Normal text Normal text Normal text Normal textNormal textNormal textNormal text Normal text</p>
    <div className="flex-grow w-full">
      <div className="flex justify-center items-center h-full">
        <Test />
      </div>
    </div>
  </div>
  );
}

export default App;
