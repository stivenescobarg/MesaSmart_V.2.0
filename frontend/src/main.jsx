// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { PedidoProvider } from "./context/PedidoContext";
import App from "./App"; // <-- Importa App, no AppRouter

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
<PedidoProvider>
  <App />
</PedidoProvider>