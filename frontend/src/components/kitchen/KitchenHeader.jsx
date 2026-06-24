import "./KitchenHeader.css";

export default function KitchenHeader({
  orders,
  filtro,
  onFiltroChange,
  theme,
  onToggleTheme,
  cocinero,
  onLogout,
}) {
  const pendientes = orders.filter(o => o.estado === "pendiente").length;
  const enPrep     = orders.filter(o => o.estado === "en_preparacion").length;
  const listos     = orders.filter(o => o.estado === "listo").length;
  const total      = orders.length;

  const hora = new Date().toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const FILTROS = [
    { key: "todos",          label: `Todos (${total})` },
    { key: "pendiente",      label: `Pendientes (${pendientes})` },
    { key: "en_preparacion", label: `En prep. (${enPrep})` },
    { key: "listo",          label: `Listos (${listos})` },
  ];

  const STATS = [
    { label: "Pend.",  value: pendientes, colorVar: "--kd-pending-color", bgVar: "--kd-pending-bg" },
    { label: "Prep.",  value: enPrep,     colorVar: "--kd-prep-color",    bgVar: "--kd-prep-bg"    },
    { label: "Listos", value: listos,     colorVar: "--kd-ready-color",   bgVar: "--kd-ready-bg"   },
  ];

  return (
    <header className="kdh-root">
      <div className="kdh-top">
        <div className="kdh-brand">
          <div className="kdh-brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="var(--kd-pending-color)" strokeWidth="2">
              <path d="M3 11l19-9-9 19-2-8-8-2z"/>
            </svg>
          </div>
          <div className="kdh-brand-text">
            <h1 className="kdh-title">Cocina</h1>
            <p className="kdh-subtitle">Panel de pedidos</p>
          </div>
        </div>

        <div className="kdh-stats">
          {STATS.map(s => (
            <div
              key={s.label}
              className="kdh-stat"
              style={{
                background:  `var(${s.bgVar})`,
                borderColor: `var(${s.colorVar})22`,
              }}
            >
              <span className="kdh-stat-value" style={{ color: `var(${s.colorVar})` }}>
                {s.value}
              </span>
              <span className="kdh-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="kdh-actions">
          {cocinero && (
            <div className="kdh-cocinero" title="Cocinero en turno">
              <div className="kdh-cocinero-avatar">
                {cocinero.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="kdh-cocinero-info">
                <span className="kdh-cocinero-nombre">{cocinero.nombre}</span>
                <span className="kdh-cocinero-badge">
                  {cocinero.turno === "mock" ? "En turno · provisional" : "En turno"}
                </span>
              </div>
            </div>
          )}

          <div className="kdh-clock">{hora}</div>

          {/* Theme toggle */}
          <button
            className="kdh-toggle"
            onClick={onToggleTheme}
            title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1"  x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
          </button>

          {/* Botón salir */}
          <button
            className="kdh-toggle"
            onClick={onLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="kdh-filters">
        {FILTROS.map(f => (
          <button
            key={f.key}
            className={`kdh-filter-btn${filtro === f.key ? " active" : ""}`}
            onClick={() => onFiltroChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
    </header>
  );
}