// frontend/src/components/admin/Navbar.jsx
import { useAuth }  from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";

// Cada sección marcada con soloCompleto: true desaparece del menú si el
// restaurante tiene plan "basico". Esto es solo cosmético — el backend
// igual bloquea con 403 si alguien fuerza la URL directamente.
//
// 👇 "menu" lleva esNavegacion: true porque no es una sección embebida
// dentro de admin-main (como Dashboard, Mesas, etc.) — es una página
// aparte (Menu.jsx) con su propio layout, así que en vez de cambiar
// `seccion` hay que navegar a su ruta.
const SECCIONES = [
  { key: "dashboard", label: "Dashboard", icono: "◈" },
  { key: "inicio",    label: "Caja",      icono: "⬡" },
  { key: "mesas",     label: "Mesas",     icono: "⊞" },
  { key: "menu",      label: "Menú",      icono: "🍽️", esNavegacion: true },
  { key: "egresos",   label: "Egresos",   icono: "📤", soloCompleto: true },
  { key: "dashboard-financiero", label: "Dashboard Financiero", icono: "📊", soloCompleto: true },
  { key: "analitica", label: "Analítica", icono: "📈" },
  { key: "proveedores",     label: "Proveedores",      icono: "🏭", soloCompleto: true },
  { key: "cuentas-pagar",   label: "Cuentas por pagar", icono: "📄", soloCompleto: true },
  { key: "stock",     label: "Stock",     icono: "📦" },
  { key: "historial", label: "Historial", icono: "≡" },
  { key: "quejas",    label: "Quejas",    icono: "💬" },
  { key: "usuarios",  label: "Usuarios",  icono: "◉" },
  { key: "sesiones",  label: "Sesiones",  icono: "●" },
];

const Navbar = ({ seccion, setSeccion, servicioActivo, onSalir, onIrAlMenu }) => {
  const { usuario, saludo } = useAuth();
  const { esOscuro, toggleThema } = useTheme();

  // Mientras usuario.plan no llegue del backend (undefined), esto se
  // comporta como "sin filtro" (todas las secciones visibles) para no
  // ocultar nada por error mientras se termina de cablear el backend.
  // Una vez usuario.plan exista, un restaurante "basico" pierde las
  // secciones marcadas soloCompleto.
  const seccionesVisibles = usuario?.plan
    ? SECCIONES.filter(s => !s.soloCompleto || usuario.plan === "completo")
    : SECCIONES;

  // 👇 Un solo handler: si la sección es de navegación real, usa
  // onIrAlMenu; si es una sección embebida normal, cambia `seccion`
  // como siempre.
  const handleClick = (sec) => {
    if (sec.esNavegacion) {
      onIrAlMenu?.();
    } else {
      setSeccion(sec.key);
    }
  };

  return (
    <header className="admin-header">
      <div className="header-marca">
        <span className="header-logo">◆</span>
        <h1 className="panel-title">MesaSmart</h1>
        <span className="header-sub">Admin</span>
      </div>

      <nav className="admin-nav">
        {seccionesVisibles.map((sec) => (
          <button
            key={sec.key}
            className={`nav-btn ${seccion === sec.key && !sec.esNavegacion ? "activo" : ""}`}
            onClick={() => handleClick(sec)}
          >
            <span className="nav-icono">{sec.icono}</span>
            <span className="nav-label">{sec.label}</span>
          </button>
        ))}
      </nav>

      <div className="header-actions">
        <span className={`badge-servicio ${servicioActivo ? "activo" : "inactivo"}`}>
          <span className="badge-dot" />
          {servicioActivo ? "Activo" : "Pausado"}
        </span>

        {usuario && (
          <div className="usuario-activo-badge" title={`Sesión: ${usuario.rol}`}>
            <span className="usuario-activo-icono">
              {usuario.rol === "admin" ? "🛡️" :
               usuario.rol === "cocina" ? "🍳" : "🍹"}
            </span>
            <span className="usuario-activo-nombre">{saludo}</span>
          </div>
        )}

        <button
          className="btn-tema"
          onClick={toggleThema}
          title={esOscuro ? "Modo claro" : "Modo oscuro"}
        >
          {esOscuro ? "☀️" : "🌙"}
        </button>

        <button className="btn-salir" onClick={onSalir}>Salir →</button>
      </div>
    </header>
  );
};

export default Navbar;