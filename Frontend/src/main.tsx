import './styles/globals.css';
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import  ScreenSizeProvider  from './contexts/ScreenSizeContext';
import { HeroUIProvider } from "@heroui/system";
import Router from "@/router";

import App from "@/App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HeroUIProvider>
      <ScreenSizeProvider>
        <BrowserRouter>
          <main>
            <App />
            <Router />
          </main>
        </BrowserRouter>
      </ScreenSizeProvider>
    </HeroUIProvider>
  </React.StrictMode>,
);
