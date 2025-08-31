import './styles/globals.css';
import ReactDOM from "react-dom/client";
import  ScreenSizeProvider  from './contexts/ScreenSizeContext';
import { HeroUIProvider } from "@heroui/system";

import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
    <HeroUIProvider>
      <ScreenSizeProvider>
        <main>
          <App />
        </main>
      </ScreenSizeProvider>
    </HeroUIProvider>
  // </React.StrictMode>,
);
