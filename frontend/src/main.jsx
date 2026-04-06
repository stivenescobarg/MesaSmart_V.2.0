// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { PedidoProvider } from "./context/PedidoContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PedidoProvider>
      <App />
    </PedidoProvider>
  </React.StrictMode>
);