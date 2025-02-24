import Test from "./pages/Test";
import { ThemeSwitcher } from "./pages/ThemeSwitcher";

// const child = {
//   height: "100%",
//   width: "100%",
//   display: "flex",
//   justifyContent: "center",
//   alignItems: "center",
//   border: "1px solid red",
// };

// const parent = {
//   height: "100%",
//   width: "100%",
//   display: "flex",
//   justifyContent: "center",
//   alignItems: "center",
//   border: "1px solid red",
// };

function App() {
  return (
  <div className="font-sans container">
    <ThemeSwitcher />
    <div className="container">
      <Test />
      asdasd
    </div>
  </div>
  );
}

export default App;
