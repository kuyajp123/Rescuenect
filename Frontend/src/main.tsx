import './styles/globals.css';
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import  ScreenSizeProvider  from './utils/ScreenSizeContext';
import { HeroUIProvider } from "@heroui/system";
import PrimaryButton from './components/PrimaryButton';
import SecondaryButton from './components/SecondaryButton';

import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* <HeroUIProvider> */}
    <ScreenSizeProvider>
      <BrowserRouter>
      {/* <PrimaryButton > a</PrimaryButton> */}
        <main>
          <App />
        </main>
      </BrowserRouter>
    </ScreenSizeProvider>
    {/* </HeroUIProvider> */}
  </React.StrictMode>,
);
