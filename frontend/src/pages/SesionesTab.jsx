import "./SesionesTab.css";
import { useState, useEffect } from "react";

const API = "http://localhost:3001";

const fmtFecha = (iso) =>
  new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const fmtHora = (iso) =>
  new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });

const SesionesTab = () => {
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [expandida, setExpandida] = useState(null);

  useEffect(() => {
    cargarSesiones();
  }, []);

  const cargarSesiones = async () => {
    try {
      const res = await fetch(`${API}/api/bar/sesiones`);
      const data = await res.json();
      if (data.ok) {
        setSesiones(data.sesiones || []);
      }
    } catch (err) {
      console.log("Sesiones: usando datos de ejemplo");
      // Datos de ejemplo mientras se crea la tabla en BD
      setSesiones([
        {
          id: 1,
          fecha: "2026-05-05T14:00:00",
          bartender: "Carlos",
          total_bebidas: 24,
          ordenes_completadas: 18,
          detalles: [
            { nombre: "Mojito", cantidad: 8 },
            { nombre: "Negroni", cantidad: 6 },
            { nombre: "Cerveza", cantidad: 5 },
            { nombre: "Whisky", cantidad: 3 },
            { nombre: "Ron", cantidad: 2 },
          ],
        },
        {
          id: 2,
          fecha: "2026-05-04T16:30:00",
          bartender: "María",
          total_bebidas: 31,
          ordenes_completadas: 22,
          detalles: [
            { nombre: "Margarita", cantidad: 10 },
            { nombre: "Mojito", cantidad: 8 },
            { nombre: "Cerveza", cantidad: 7 },
            { nombre: "Negroni", cantidad: 4 },
            { nombre: "Vodka", cantidad: 2 },
          ],
        },
        {
          id: 3,
          fecha: "2026-05-03T10:15:00",
          bartender: "Carlos",
          total_bebidas: 18,
          ordenes_completadas: 14,
          detalles: [
            { nombre: "Cerveza", cantidad: 8 },
            { nombre: "Mojito", cantidad: 5 },
            { nombre: "Negroni", cantidad: 3 },
            { nombre: "Whisky", cantidad: 2 },
          ],
        },
      ]);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="bd-sesiones-page">
        <p className="bd-empty">Cargando sesiones…</p>
      </div>
    );
  }

  return (
    <div className="bd-sesiones-page">
      <div className="bd-sesiones-header">
        <h2 className="bd-inv-title-page">📊 Historial de Sesiones</h2>
        <span className="bd-sesiones-total">{sesiones.length} turnos</span>
      </div>

      {sesiones.length === 0 ? (
        <div className="bd-hist-empty">No hay sesiones registradas aún</div>
      ) : (
        <div className="bd-sesiones-list">
          {sesiones.map((sesion) => (
            <div
              key={sesion.id}
              className={`bd-sesion-card${expandida === sesion.id ? " expanded" : ""}`}
            >
              {/* Cabecera de la sesión */}
              <div
                className="bd-sesion-header"
                onClick={() =>
                  setExpandida(expandida === sesion.id ? null : sesion.id)
                }
              >
                <div className="bd-sesion-info">
                  <div className="bd-sesion-fecha">
                    {fmtFecha(sesion.fecha)}
                  </div>
                  <div className="bd-sesion-meta">
                    <span className="bd-sesion-bartender">
                      👤 {sesion.bartender}
                    </span>
                    <span className="bd-sesion-hora">
                      🕐 {fmtHora(sesion.fecha)}
                    </span>
                  </div>
                </div>
                <div className="bd-sesion-stats">
                  <div className="bd-sesion-stat">
                    <span className="bd-sesion-stat-val">
                      {sesion.total_bebidas}
                    </span>
                    <span className="bd-sesion-stat-lbl">bebidas</span>
                  </div>
                  <div className="bd-sesion-stat">
                    <span className="bd-sesion-stat-val">
                      {sesion.ordenes_completadas}
                    </span>
                    <span className="bd-sesion-stat-lbl">órdenes</span>
                  </div>
                </div>
                <span
                  className={`bd-sesion-arrow${expandida === sesion.id ? " open" : ""}`}
                >
                  ▼
                </span>
              </div>

              {/* Detalle expandible */}
              {expandida === sesion.id && (
                <div className="bd-sesion-body">
                  <h4 className="bd-sesion-detalle-title">
                    🍹 Bebidas servidas
                  </h4>
                  <div className="bd-sesion-bebidas">
                    {sesion.detalles?.map((bebida, i) => (
                      <div key={i} className="bd-sesion-bebida-row">
                        <span className="bd-sesion-bebida-nombre">
                          {bebida.nombre}
                        </span>
                        <div className="bd-sesion-bebida-bar-wrap">
                          <div className="bd-sesion-bebida-bar">
                            <div
                              className="bd-sesion-bebida-bar-fill"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (bebida.cantidad /
                                    Math.max(
                                      ...sesion.detalles.map((d) => d.cantidad)
                                    )) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="bd-sesion-bebida-cant">
                          {bebida.cantidad}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SesionesTab;