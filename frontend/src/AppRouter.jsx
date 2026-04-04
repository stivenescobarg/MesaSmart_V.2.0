// frontend/src/AppRouter.jsx

import { Routes, Route, Navigate } from "react-router-dom";

import PrivateRoute      from "./components/admin/PrivateRoute";
import Login             from "./pages/Login";
import AdminDashboard    from "./pages/AdminDashboard";
import KitchenDashboard  from "./pages/KitchenDashboard";
import BartenderDashboard from "./pages/BartenderDashboard";
import Menu              from "./pages/Menu";

// Página de producto — usada por Menu.jsx internamente
// Si el archivo existe en tu proyecto, descomenta esta línea:
// import DetalleProducto from "./pages/DetalleProducto";

const AppRouter = () => (
  <Routes>

    {/* Raíz → login */}
    <Route path="/" element={<Navigate to="/login" replace />} />

    {/* Login — público */}
    <Route path="/login" element={<Login />} />

    {/* ── ADMIN — protegido, solo rol "admin" de la BD ── */}
    <Route
      path="/admin"
      element={
        <PrivateRoute rolesPermitidos={["admin"]}>
          <AdminDashboard />
        </PrivateRoute>
      }
    />

    {/* ── COCINA — sin protección, tus compañeros manejan su lógica ── */}
    <Route path="/kitchen/:numero" element={<KitchenDashboard />} />

    {/* ── BAR — sin protección ── */}
    <Route path="/bartender/:numero" element={<BartenderDashboard />} />

    {/* ── MENÚ — público para clientes QR ── */}
    <Route path="/menu" element={<Menu />} />cd frontend

    {/* Ruta de detalle de producto usada por Menu.jsx */}
    <Route
      path="/producto"
      element={<Menu />}
      /* Cuando tengas DetalleProducto.jsx:
          element={<DetalleProducto />} */
    />

    {/* Acceso denegado */}
    <Route
      path="/acceso-denegado"
      element={
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#0d0d0d", color: "#848076", gap: "1rem"
        }}>
          <span style={{ fontSize: "2rem" }}>🚫</span>
          <p>No tienes permisos para acceder aquí.</p>
          <a href="/login" style={{ color: "#f59e0b", fontSize: "0.85rem" }}>
            ← Volver al login
          </a>
        </div>
      }
    />

    {/* Cualquier ruta desconocida → login */}
    <Route path="*" element={<Navigate to="/Login" replace />} />

  </Routes>
);

export default AppRouter;