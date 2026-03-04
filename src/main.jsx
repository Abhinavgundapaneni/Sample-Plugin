import React from "react";
import ReactDOM from "react-dom/client";
import { client } from "@sigmacomputing/plugin";
import { SigmaClientProvider } from "@sigmacomputing/plugin";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SigmaClientProvider client={client}>
      <App />
    </SigmaClientProvider>
  </React.StrictMode>
);
