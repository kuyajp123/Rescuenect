import './styles/globals.css';
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import  ScreenSizeProvider  from './context/ScreenSizeContext';
import { HeroUIProvider } from "@heroui/system";

import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HeroUIProvider>
    <ScreenSizeProvider>
      <BrowserRouter>
        <main>
          <App />
        </main>
      </BrowserRouter>
    </ScreenSizeProvider>
    </HeroUIProvider>
  </React.StrictMode>,
);
