// frontend/src/components/admin/Navbar.jsx
import { useEffect, useRef, useState } from "react";
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
//
// 👇 "atajo: true" marca las secciones que se usan constantemente
// durante el turno — quedan siempre visibles en la barra. El resto
// vive únicamente en el menú hamburguesa.
const SECCIONES = [
  { key: "dashboard", label: "Dashboard", icono: "◈" },
  { key: "inicio",    label: "Caja",      icono: "⬡", atajo: true },
  { key: "mesas",     label: "Mesas",     icono: "⊞", atajo: true },
  { key: "menu",      label: "Menú",      icono: "🍽️", esNavegacion: true },
  { key: "egresos",   label: "Egresos",   icono: "📤", soloCompleto: true, atajo: true },
  { key: "dashboard-financiero", label: "Dashboard Financiero", icono: "📊", soloCompleto: true },
  { key: "analitica", label: "Analítica", icono: "📈" },
  { key: "proveedores",     label: "Proveedores",      icono: "🏭", soloCompleto: true },
  { key: "cuentas-pagar",   label: "Cuentas por pagar", icono: "📄", soloCompleto: true },
  { key: "stock",     label: "Stock",     icono: "📦", atajo: true },
  { key: "historial", label: "Historial", icono: "≡" },
  { key: "quejas",    label: "Quejas",    icono: "💬" },
  { key: "usuarios",  label: "Usuarios",  icono: "◉" },
  { key: "sesiones",  label: "Sesiones",  icono: "●" },
];

const Navbar = ({ seccion, setSeccion, servicioActivo, onSalir, onIrAlMenu }) => {
  const { usuario, saludo } = useAuth();
  const { esOscuro, toggleThema } = useTheme();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const panelRef = useRef(null);
  const botonRef = useRef(null);

  // Mientras usuario.plan no llegue del backend (undefined), esto se
  // comporta como "sin filtro" (todas las secciones visibles) para no
  // ocultar nada por error mientras se termina de cablear el backend.
  // Una vez usuario.plan exista, un restaurante "basico" pierde las
  // secciones marcadas soloCompleto.
  const seccionesVisibles = usuario?.plan
    ? SECCIONES.filter(s => !s.soloCompleto || usuario.plan === "completo")
    : SECCIONES;

   const atajos = seccionesVisibles.filter(s => s.atajo);
  // El panel hamburguesa muestra TODAS las secciones (atajos incluidos):
  // en mobile .nav-atajos puede no entrar/no verse, y necesitamos que
  // esas rutas sigan siendo accesibles desde el menú.
  const resto  = seccionesVisibles;

  const seccionActual = SECCIONES.find(s => s.key === seccion && !s.esNavegacion);
  const mostrarBreadcrumb = seccionActual && !seccionActual.atajo;

  // 👇 Un solo handler: si la sección es de navegación real, usa
  // onIrAlMenu; si es una sección embebida normal, cambia `seccion`
  // como siempre. En ambos casos cierra el panel (si estaba abierto).
  const handleClick = (sec) => {
    if (sec.esNavegacion) {
      onIrAlMenu?.();
    } else {
      setSeccion(sec.key);
    }
    setMenuAbierto(false);
  };

  // Cerrar al hacer clic afuera o con Escape
  useEffect(() => {
    if (!menuAbierto) return;

    const alClicAfuera = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        botonRef.current && !botonRef.current.contains(e.target)
      ) {
        setMenuAbierto(false);
      }
    };
    const alTeclado = (e) => {
      if (e.key === "Escape") setMenuAbierto(false);
    };

    document.addEventListener("mousedown", alClicAfuera);
    document.addEventListener("keydown", alTeclado);
    return () => {
      document.removeEventListener("mousedown", alClicAfuera);
      document.removeEventListener("keydown", alTeclado);
    };
  }, [menuAbierto]);

  return (
    <header className="admin-header">
      <div className="header-marca">
        <button
          ref={botonRef}
          className={`nav-hamburguesa ${menuAbierto ? "activo" : ""}`}
          onClick={() => setMenuAbierto(v => !v)}
          aria-expanded={menuAbierto}
          aria-label="Abrir menú de secciones"
        >
          <span />
          <span />
          <span />
        </button>
        <span className="header-logo">◆</span>
        <h1 className="panel-title">MesaSmart</h1>
        <span className="header-sub">Admin</span>
        {mostrarBreadcrumb && (
          <span className="header-seccion-actual">
            <span className="header-seccion-sep">/</span>
            {seccionActual.icono} {seccionActual.label}
          </span>
        )}
      </div>

      {/* Atajos rápidos — las secciones que se usan constantemente en el turno */}
      <nav className="nav-atajos">
        {atajos.map((sec) => (
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

      {menuAbierto && (
        <div className="nav-panel-overlay" onClick={() => setMenuAbierto(false)} />
      )}

      {/* Panel completo — incluye los atajos también, para que en
          mobile (donde nav-atajos puede quedar oculto) todas las
          rutas sigan siendo accesibles desde acá */}
      <nav
        ref={panelRef}
        className={`nav-panel ${menuAbierto ? "abierto" : ""}`}
        aria-hidden={!menuAbierto}
      >
        {resto.map((sec) => (
          <button
            key={sec.key}
            className={`nav-panel-btn ${seccion === sec.key && !sec.esNavegacion ? "activo" : ""}`}
            onClick={() => handleClick(sec)}
          >
            <span className="nav-icono">{sec.icono}</span>
            <span className="nav-label">{sec.label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
};

export default Navbar;