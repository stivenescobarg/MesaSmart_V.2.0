// frontend/src/components/admin/SesionesActivas.jsx

import { useState, useEffect } from "react";
import { sesionAdminService } from "../../services/sesionAdminService";
import Modal from "./Modal";

const COLOR_ROL = { admin: "chip-morado", cocina: "chip-naranja", bartender: "chip-azul" };
const ICONO_ROL = { admin: "🛡️", cocina: "🍳", bartender: "🍹" };

const SesionesActivas = ({ toast }) => {
  const [activas,         setActivas]        = useState([]);
  const [historial,       setHistorial]      = useState([]);
  const [vistaTab,        setVistaTab]       = useState("activas");
  const [cargando,        setCargando]       = useState(true);
  const [modalLogout,     setModalLogout]    = useState(false);
  const [sesionAExpulsar, setSesionAExpulsar]= useState(null);
  const [expulsando,      setExpulsando]     = useState(false);

  const cargar = async () => {
    try {
      const data = await sesionAdminService.getSesiones();
      setActivas(data.activas   || []);
      setHistorial(data.historial || []);
    } catch { /* silencioso */ }
    finally { setCargando(false); }
  };

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 15000);
    return () => clearInterval(id);
  }, []);

  const tiempoTranscurrido = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const min  = Math.floor(diff / 60000);
    if (min < 1)  return "Ahora mismo";
    if (min < 60) return `${min}m`;
    return `${Math.floor(min / 60)}h ${min % 60}m`;
  };

  const confirmarExpulsion = (sesion) => {
    setSesionAExpulsar(sesion);
    setModalLogout(true);
  };

  const ejecutarExpulsion = async () => {
    if (!sesionAExpulsar) return;
    setExpulsando(true);
    try {
      // FIX 3: el endpoint espera usuario_id, no el id de la sesión
      // La BD devuelve el campo "usuario_id" en el JOIN de getActivas()
      const idAUsar = sesionAExpulsar.usuario_id;
      if (!idAUsar) {
        if (toast) toast.error("No se pudo identificar el usuario.");
        return;
      }
      await sesionAdminService.forzarLogout(idAUsar);
      if (toast) toast.advertencia(`Sesión de ${sesionAExpulsar.correo} cerrada.`);
      setModalLogout(false);
      setSesionAExpulsar(null);
      // Recargar inmediatamente para que desaparezca de la lista
      await cargar();
    } catch (err) {
      if (toast) toast.error(err.message || "Error al cerrar sesión.");
    } finally {
      setExpulsando(false);
    }
  };

  if (cargando) {
    return (
      <div className="seccion-container">
        <div className="seccion-header">
          <h2 className="seccion-titulo">Sesiones</h2>
        </div>
        <p className="texto-secundario">Cargando sesiones...</p>
      </div>
    );
  }

  return (
    <div className="seccion-container">
      <div className="seccion-header">
        <h2 className="seccion-titulo">Sesiones y auditoría</h2>
        <div className="tab-selector">
          <button className={`tab-btn ${vistaTab === "activas" ? "activo" : ""}`}
            onClick={() => setVistaTab("activas")}>
            🟢 Activas ({activas.length})
          </button>
          <button className={`tab-btn ${vistaTab === "historial" ? "activo" : ""}`}
            onClick={() => setVistaTab("historial")}>
            📋 Historial ({historial.length})
          </button>
        </div>
      </div>

      {/* ── SESIONES ACTIVAS ── */}
      {vistaTab === "activas" && (
        activas.length === 0
          ? <div className="estado-vacio">
              <p className="texto-secundario">No hay sesiones activas.</p>
            </div>
          : <div className="sesiones-grid">
              {activas.map((s) => (
                <div key={s.id} className="sesion-card">
                  <div className="sesion-card-header">
                    <span className="sesion-icono">{ICONO_ROL[s.rol] || "👤"}</span>
                    <span className={`chip ${COLOR_ROL[s.rol] || "chip-neutro"}`}>{s.rol}</span>
                    <span className="sesion-dot-activa" title="En línea" />
                  </div>
                  <p className="sesion-correo">{s.correo}</p>
                  <p className="texto-muted sesion-tiempo">⏱ {tiempoTranscurrido(s.inicio)}</p>
                  <p className="texto-muted" style={{ fontSize: "0.72rem", marginBottom: "0.75rem" }}>
                    IP: {s.ip || "—"}
                  </p>
                  <button
                    className="btn-peligro"
                    style={{ width: "100%", fontSize: "0.75rem", padding: "0.35rem" }}
                    onClick={() => confirmarExpulsion(s)}
                  >
                    ⏏ Cerrar sesión
                  </button>
                </div>
              ))}
            </div>
      )}

      {/* ── HISTORIAL ── */}
      {vistaTab === "historial" && (
        historial.length === 0
          ? <div className="estado-vacio">
              <p className="texto-secundario">No hay sesiones cerradas.</p>
            </div>
          : <div className="tabla-wrapper">
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
                  {historial.map((s, i) => (
                    <tr key={s.id || i}>
                      <td className="td-nombre">{s.correo}</td>
                      <td>
                        <span className={`chip ${COLOR_ROL[s.rol] || "chip-neutro"}`}>
                          {ICONO_ROL[s.rol]} {s.rol}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem" }}>
                        {new Date(s.inicio).toLocaleString("es-CO", {
                          day: "2-digit", month: "2-digit",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td style={{ fontSize: "0.8rem" }}>
                        {s.fin
                          ? new Date(s.fin).toLocaleTimeString("es-CO", {
                              hour: "2-digit", minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td>
                        <span className="chip chip-neutro">
                          {s.duracion_seg
                            ? `${Math.floor(s.duracion_seg / 60)}m ${s.duracion_seg % 60}s`
                            : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}

      {/* ── MODAL CONFIRMACIÓN ── */}
      <Modal
        abierto={modalLogout}
        titulo="Cerrar sesión remota"
        variante="peligro"
        labelConfirmar={expulsando ? "Cerrando..." : "Sí, cerrar sesión"}
        labelCancelar="Cancelar"
        onConfirmar={ejecutarExpulsion}
        onCancelar={() => { setModalLogout(false); setSesionAExpulsar(null); }}
      >
        {sesionAExpulsar && (
          <p className="texto-secundario">
            Vas a cerrar la sesión de{" "}
            <strong style={{ color: "var(--text-1)" }}>{sesionAExpulsar.correo}</strong>.
            El usuario será expulsado inmediatamente.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default SesionesActivas;