import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";


import './styles/globals.css'
import App from "./App";
import { Provider } from "./provider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider>
        <App />
      </Provider>
    </BrowserRouter>
  </React.StrictMode>,
);
