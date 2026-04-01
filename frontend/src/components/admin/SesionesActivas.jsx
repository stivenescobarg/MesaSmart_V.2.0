// frontend/src/components/admin/SesionesActivas.jsx
// Ahora consume la API en lugar de localStorage

import { useState, useEffect } from "react";
import { usuarioService } from "../../services/usuarioService";

const COLOR_ROL = { admin: "chip-morado", cocina: "chip-naranja", bartender: "chip-azul" };
const ICONO_ROL = { admin: "🛡️", cocina: "🍳", bartender: "🍹" };

const SesionesActivas = () => {
  const [activas,    setActivas]    = useState([]);
  const [historial,  setHistorial]  = useState([]);
  const [vistaTab,   setVistaTab]   = useState("activas");
  const [cargando,   setCargando]   = useState(true);

  const cargar = async () => {
    try {
      const data = await usuarioService.getSesiones();
      setActivas(data.activas   || []);
      setHistorial(data.historial || []);
    } catch { /* silencioso */ }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const tiempoTranscurrido = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const min  = Math.floor(diff / 60000);
    return min > 60 ? `${Math.floor(min/60)}h ${min%60}m` : `${min}m`;
  };

  if (cargando) return <div className="estado-vacio"><p>Cargando sesiones...</p></div>;

  return (
    <div className="seccion-container">
      <div className="seccion-header">
        <h2 className="seccion-titulo">Sesiones y auditoría</h2>
        <div className="tab-selector">
          <button className={`tab-btn ${vistaTab==="activas"?"activo":""}`}
            onClick={() => setVistaTab("activas")}>
            🟢 Activas ({activas.length})
          </button>
          <button className={`tab-btn ${vistaTab==="historial"?"activo":""}`}
            onClick={() => setVistaTab("historial")}>
            📋 Historial ({historial.length})
          </button>
        </div>
      </div>

      {vistaTab === "activas" && (
        activas.length === 0
          ? <div className="estado-vacio"><p className="texto-secundario">No hay sesiones activas.</p></div>
          : <div className="sesiones-grid">
              {activas.map(s => (
                <div key={s.id} className="sesion-card">
                  <div className="sesion-card-header">
                    <span className="sesion-icono">{ICONO_ROL[s.rol] || "👤"}</span>
                    <span className={`chip ${COLOR_ROL[s.rol] || "chip-neutro"}`}>{s.rol}</span>
                    <span className="sesion-dot-activa" />
                  </div>
                  <p className="sesion-correo">{s.correo}</p>
                  <p className="texto-muted sesion-tiempo">⏱ {tiempoTranscurrido(s.inicio)}</p>
                  <p className="texto-muted" style={{fontSize:"0.72rem"}}>
                    Desde {new Date(s.inicio).toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"})}
                  </p>
                </div>
              ))}
            </div>
      )}

      {vistaTab === "historial" && (
        historial.length === 0
          ? <div className="estado-vacio"><p className="texto-secundario">No hay sesiones cerradas.</p></div>
          : <div className="tabla-wrapper">
              <table className="tabla">
                <thead>
                  <tr><th>Usuario</th><th>Rol</th><th>Inicio</th><th>Cierre</th><th>Duración</th></tr>
                </thead>
                <tbody>
                  {historial.map((s,i) => (
                    <tr key={s.id||i}>
                      <td className="td-nombre">{s.correo}</td>
                      <td><span className={`chip ${COLOR_ROL[s.rol]||"chip-neutro"}`}>
                        {ICONO_ROL[s.rol]} {s.rol}
                      </span></td>
                      <td>{new Date(s.inicio).toLocaleString("es-CO",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</td>
                      <td>{s.fin ? new Date(s.fin).toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"}) : "—"}</td>
                      <td><span className="chip chip-neutro">{s.duracion_seg ? `${Math.floor(s.duracion_seg/60)}m ${s.duracion_seg%60}s` : "—"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}
    </div>
  );
};

export default SesionesActivas;