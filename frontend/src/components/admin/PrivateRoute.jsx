// frontend/src/components/admin/PrivateRoute.jsx
// Roles de la BD: "admin", "cocina", "bartender"
// NO usar "administrador" — ese era el rol del sistema anterior con localStorage.

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PrivateRoute = ({ children, rolesPermitidos }) => {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  // Mientras se verifica el token → pantalla de espera, NUNCA redirigir
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

  // Sin sesión → login
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