import Test from "./pages/Test";
import { ThemeSwitcher } from "./pages/ThemeSwitcher";

function App() {
  return (
  <div className="font-poppins container h-full">  
    <div>
      <ThemeSwitcher />
    </div>
    <div className="container h-full text-3xl border-secondary border-2">
      <Test />
      asdasd
    </div>
  </div>
  );
}

export default App;
