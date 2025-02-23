import Test from "./pages/Test";
import { ThemeSwitcher } from "./pages/ThemeSwitcher";
import PrimaryButton from "./components/PrimaryButton";
import SecondaryButton from "./components/SecondaryButton";

function App() {
  return (
  <div className="font-sans">
    <Test />
    <ThemeSwitcher />
    <br />
    <SecondaryButton 
    onClick={() => alert("Button Clicked!")}
    >
      SecondaryButton 
    </SecondaryButton>
    &nbsp;&nbsp;&nbsp;&nbsp;
    <PrimaryButton 
    onClick={() => alert("Button Clicked!")}
    >
      PrimaryButton
    </PrimaryButton>
    &nbsp;&nbsp;&nbsp;&nbsp;
  </div>
  );
}

export default App;
