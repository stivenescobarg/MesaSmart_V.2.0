// ══════════════════════════════════════════════════════════════════
// AppRouter.jsx — Rutas originales del proyecto restauradas
// BrowserRouter y AuthProvider están en App.jsx, NO agregarlos aquí
// ══════════════════════════════════════════════════════════════════

import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import PrivateRoute   from "./components/admin/PrivateRoute";
import Login          from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";

// Importa los componentes de tus compañeros cuando estén listos:
// import KitchenDashboard  from "./pages/KitchenDashboard";
// import BartenderDashboard from "./pages/BartenderDashboard";
// import Menu              from "./pages/Menu";

// Placeholder temporal para rutas de compañeros
const PlaceholderRuta = ({ titulo }) => {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#0d0d0d", color: "#848076", gap: "1rem"
    }}>
      <span style={{ fontSize: "2rem" }}>🚧</span>
      <p style={{ fontSize: "0.9rem" }}>{titulo} — En construcción</p>
      <button
        onClick={() => navigate("/login", { replace: true })}
        style={{ color: "#f59e0b", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
      >
        ← Volver al login
      </button>
    </div>
  );
};

const AppRouter = () => (
  <Routes>

    {/* Ruta raíz → login */}
    <Route path="/"      element={<Navigate to="/login" replace />} />

    {/* Login — público */}
    <Route path="/login" element={<Login />} />

    {/* ── ADMIN — protegido ── */}
    <Route
      path="/admin"
      element={
        <PrivateRoute rolesPermitidos={["administrador"]}>
          <AdminDashboard />
        </PrivateRoute>
      }
    />

    {/* ── COCINA — rutas originales /kitchen/:numero ── */}
    {/* Cuando KitchenDashboard esté listo, reemplaza PlaceholderRuta */}
    <Route
      path="/kitchen/:numero"
      element={
        <PrivateRoute rolesPermitidos={["cocina", "administrador"]}>
          <PlaceholderRuta titulo="Dashboard de Cocina" />
          {/* <KitchenDashboard /> */}
        </PrivateRoute>
      }
    />

    {/* ── BAR — rutas originales /bartender/:numero ── */}
    <Route
      path="/bartender/:numero"
      element={
        <PrivateRoute rolesPermitidos={["bartender", "administrador"]}>
          <PlaceholderRuta titulo="Dashboard de Bar" />
          {/* <BartenderDashboard /> */}
        </PrivateRoute>
      }
    />

    {/* ── MENÚ — público, para clientes vía QR ── */}
    <Route
      path="/menu"
      element={<PlaceholderRuta titulo="Menú del restaurante" />}
      /* Cuando Menu esté listo: element={<Menu />} */
    />

    {/* Acceso denegado */}
    <Route
      path="/acceso-denegado"
      element={<PlaceholderRuta titulo="Acceso denegado 🚫" />}
    />

    {/* Cualquier ruta desconocida → login */}
    <Route path="*" element={<Navigate to="/login" replace />} />

  </Routes>
);

export default AppRouter;