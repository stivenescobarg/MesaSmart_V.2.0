// ══════════════════════════════════════════════════════════════════
// components/admin/SesionesActivas.jsx
// Muestra sesiones concurrentes y historial de auditoría.
// ══════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { getSesionesActivas, getAuditoria } from "../../services/authService";
import { KEYS } from "../../services/storageService";

const COLOR_ROL = {
  administrador: "chip-morado",
  cocina:        "chip-naranja",
  bartender:     "chip-azul",
};

const ICONO_ROL = {
  administrador: "🛡️",
  cocina:        "🍳",
  bartender:     "🍹",
};

const SesionesActivas = () => {
  const [activas,   setActivas]   = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [vistaTab,  setVistaTab]  = useState("activas"); // "activas" | "historial"

  const recargar = () => {
    setActivas(getSesionesActivas());
    setAuditoria(getAuditoria());
  };

  useEffect(() => {
    recargar();

    // Escuchar cambios de otras pestañas (login/logout en otra ventana)
    const handler = (e) => {
      if (
        e.key === KEYS.SESIONES_ACTIVAS ||
        e.key === KEYS.AUDITORIA_SESIONES
      ) recargar();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const tiempoTranscurrido = (isoInicio) => {
    const diff = Date.now() - new Date(isoInicio).getTime();
    const min  = Math.floor(diff / 60000);
    const seg  = Math.floor((diff % 60000) / 1000);
    if (min > 60) return `${Math.floor(min / 60)}h ${min % 60}m`;
    return `${min}m ${seg}s`;
  };

  return (
    <div className="seccion-container">
      <div className="seccion-header">
        <h2 className="seccion-titulo">Sesiones y auditoría</h2>
        <div className="tab-selector">
          <button
            className={`tab-btn ${vistaTab === "activas" ? "activo" : ""}`}
            onClick={() => setVistaTab("activas")}
          >
            🟢 Activas ({activas.length})
          </button>
          <button
            className={`tab-btn ${vistaTab === "historial" ? "activo" : ""}`}
            onClick={() => setVistaTab("historial")}
          >
            📋 Historial ({auditoria.length})
          </button>
        </div>
      </div>

      {/* ── SESIONES ACTIVAS ── */}
      {vistaTab === "activas" && (
        <>
          {activas.length === 0 ? (
            <div className="estado-vacio">
              <p className="texto-secundario">No hay sesiones activas registradas.</p>
            </div>
          ) : (
            <div className="sesiones-grid">
              {activas.map((s) => (
                <div key={s.id} className="sesion-card">
                  <div className="sesion-card-header">
                    <span className="sesion-icono">{ICONO_ROL[s.rol] || "👤"}</span>
                    <span className={`chip ${COLOR_ROL[s.rol] || "chip-neutro"}`}>
                      {s.rol}
                    </span>
                    <span className="sesion-dot-activa" title="En línea" />
                  </div>
                  <p className="sesion-correo">{s.correo}</p>
                  <p className="texto-muted sesion-tiempo">
                    ⏱ {tiempoTranscurrido(s.inicio)}
                  </p>
                  <p className="texto-muted" style={{ fontSize: "0.72rem" }}>
                    Desde{" "}
                    {new Date(s.inicio).toLocaleTimeString("es-CO", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── HISTORIAL DE AUDITORÍA ── */}
      {vistaTab === "historial" && (
        <>
          {auditoria.length === 0 ? (
            <div className="estado-vacio">
              <p className="texto-secundario">No hay sesiones cerradas todavía.</p>
            </div>
          ) : (
            <div className="tabla-wrapper">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Inicio</th>
                    <th>Cierre</th>
                    <th>Duración</th>
                  </tr>
                </thead>
                <tbody>
                  {[...auditoria].reverse().map((s, i) => (
                    <tr key={s.id || i}>
                      <td className="td-nombre">{s.correo}</td>
                      <td>
                        <span className={`chip ${COLOR_ROL[s.rol] || "chip-neutro"}`}>
                          {ICONO_ROL[s.rol]} {s.rol}
                        </span>
                      </td>
                      <td>
                        {new Date(s.inicio).toLocaleString("es-CO", {
                          day: "2-digit", month: "2-digit",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td>
                        {s.fin
                          ? new Date(s.fin).toLocaleTimeString("es-CO", {
                              hour: "2-digit", minute: "2-digit",
                            })
                          : <span className="texto-muted">—</span>}
                      </td>
                      <td>
                        <span className="chip chip-neutro">{s.duracion || "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SesionesActivas;