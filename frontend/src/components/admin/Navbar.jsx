// frontend/src/components/admin/Navbar.jsx
// Con botón de modo claro/oscuro

import { useAuth }  from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";

const SECCIONES = [
  { key: "inicio",    label: "Caja",      icono: "⬡" },
  { key: "mesas",     label: "Mesas",     icono: "⊞" },
  { key: "historial", label: "Historial", icono: "≡" },
  { key: "usuarios",  label: "Usuarios",  icono: "◉" },
  { key: "sesiones",  label: "Sesiones",  icono: "●" },
];

const Navbar = ({ seccion, setSeccion, servicioActivo, onSalir }) => {
  const { usuario, saludo } = useAuth();
  const { esOscuro, toggleThema } = useTheme();

  return (
    <header className="admin-header">
      <div className="header-marca">
        <span className="header-logo">◆</span>
        <h1 className="panel-title">MesaSmart</h1>
        <span className="header-sub">Admin</span>
      </div>

      <nav className="admin-nav">
        {SECCIONES.map(({ key, label, icono }) => (
          <button
            key={key}
            className={`nav-btn ${seccion === key ? "activo" : ""}`}
            onClick={() => setSeccion(key)}
          >
            <span className="nav-icono">{icono}</span>
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="header-actions">
        {/* Badge servicio */}
        <span className={`badge-servicio ${servicioActivo ? "activo" : "inactivo"}`}>
          <span className="badge-dot" />
          {servicioActivo ? "Activo" : "Pausado"}
        </span>

        {/* Usuario logueado */}
        {usuario && (
          <div className="usuario-activo-badge" title={`Sesión: ${usuario.rol}`}>
            <span className="usuario-activo-icono">
              {usuario.rol === "admin" ? "🛡️" :
               usuario.rol === "cocina" ? "🍳" : "🍹"}
            </span>
            <span className="usuario-activo-nombre">{saludo}</span>
          </div>
        )}

        {/* Botón modo claro/oscuro */}
        <button
          className="btn-tema"
          onClick={toggleThema}
          title={esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {esOscuro ? "☀️" : "🌙"}
        </button>

        <button className="btn-salir" onClick={onSalir}>Salir →</button>
      </div>
    </header>
  );
};

export default Navbar;