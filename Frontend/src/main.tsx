import './styles/globals.css'
// import './styles/font.css'
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HeroUIProvider } from "@heroui/system";

import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* <HeroUIProvider> */}
      <BrowserRouter>
        <main>
          <App />
        </main>
      </BrowserRouter>
    {/* </HeroUIProvider> */}
  </React.StrictMode>,
);
