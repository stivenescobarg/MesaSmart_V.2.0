import { Routes, Route, Navigate } from "react-router-dom";

import PrivateRoute from "./components/admin/PrivateRoute";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import KitchenDashboard from "./pages/KitchenDashboard";
import BartenderDashboard from "./pages/BartenderDashboard";
import Menu from "./pages/Menu";
import DetalleProducto from "./pages/DetalleProducto";

const AppRouter = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<Login />} />

    <Route
      path="/admin"
      element={
        <PrivateRoute rolesPermitidos={["admin"]}>
          <AdminDashboard />
        </PrivateRoute>
      }
    />

    <Route
      path="/kitchen/:numero"
      element={
        <PrivateRoute rolesPermitidos={["admin", "cocina"]}>
          <KitchenDashboard />
        </PrivateRoute>
      }
    />

    <Route
      path="/bartender/:numero"
      element={
        <PrivateRoute rolesPermitidos={["admin", "bartender"]}>
          <BartenderDashboard />
        </PrivateRoute>
      }
    />

    <Route path="/menu" element={<Menu />} />
    <Route path="/producto" element={<DetalleProducto />} />

    <Route
      path="/acceso-denegado"
      element={
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d0d0d",
          color: "#848076",
          gap: "1rem",
        }}>
          <span style={{ fontSize: "2rem" }}>Acceso denegado</span>
          <p>No tienes permisos para acceder aqui.</p>
          <a href="/login" style={{ color: "#f59e0b", fontSize: "0.85rem" }}>
            Volver al login
          </a>
        </div>
      }
    />

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

export default AppRouter;
