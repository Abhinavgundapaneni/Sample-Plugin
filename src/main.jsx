import React from "react";
import ReactDOM from "react-dom/client";
import { client, SigmaClientProvider } from "@sigmacomputing/plugin";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SigmaClientProvider client={client}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SigmaClientProvider>
  </React.StrictMode>
);
