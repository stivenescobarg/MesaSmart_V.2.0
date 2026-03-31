// ══════════════════════════════════════════════════════════════════
// components/admin/PrivateRoute.jsx — CORREGIDO
// Espera a que AuthContext verifique la sesión antes de redirigir.
// Si cargando=true → muestra pantalla de espera (nunca redirige aún).
// ══════════════════════════════════════════════════════════════════

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PrivateRoute = ({ children, rolesPermitidos }) => {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  // ⚠️ CRÍTICO: mientras AuthContext verifica la sesión persistida,
  // NO redirigir. Si se redirige aquí, usuarios con sesión válida
  // ven "acceso denegado" al recargar la página.
  if (cargando) {
    return (
      <div className="cargando-pantalla">
        <span className="cargando-logo">◆</span>
        <p style={{ color: "var(--text-2)", fontSize: "0.875rem" }}>
          Verificando sesión...
        </p>
      </div>
    );
  }

  // Sin sesión → login. "replace" evita que "atrás" vuelva al panel.
  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Rol no permitido → acceso denegado
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  return children;
};

export default PrivateRoute;