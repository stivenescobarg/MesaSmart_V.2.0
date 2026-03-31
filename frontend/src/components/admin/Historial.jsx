// ══════════════════════════════════════════════════════════════════
// components/admin/Historial.jsx
// Historial de ventas con detalle expandible de productos por venta.
// ══════════════════════════════════════════════════════════════════

import { useState } from "react";
import { desglosarPorMetodo } from "../../services/cajaService";

const ICONO_METODO = { Efectivo: "💵", Tarjeta: "💳", Transferencia: "📲" };

const Historial = ({ historial }) => {
  const [diaExpandido,   setDiaExpandido]   = useState(null);
  const [ventaExpandida, setVentaExpandida] = useState(null);

  if (historial.length === 0) {
    return (
      <div className="seccion-container">
        <div className="seccion-header">
          <h2 className="seccion-titulo">Historial de ventas</h2>
        </div>
        <div className="estado-vacio">
          <p className="texto-secundario">
            Aún no hay jornadas cerradas. Aparecerán aquí al cerrar la caja.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="seccion-container">
      <div className="seccion-header">
        <h2 className="seccion-titulo">Historial de ventas</h2>
        <span className="chip chip-neutro">{historial.length} jornada(s)</span>
      </div>

      <div className="historial-lista">
        {[...historial].reverse().map((dia, i) => {
          const expandido = diaExpandido === i;
          const desglose  = desglosarPorMetodo(dia.ventas);

          return (
            <div key={dia.id || i} className={`historial-card ${expandido ? "expandido" : ""}`}>
              {/* ── Resumen del día ── */}
              <div className="historial-resumen"
                onClick={() => { setDiaExpandido(expandido ? null : i); setVentaExpandida(null); }}>
                <div className="historial-fecha-col">
                  <span className="historial-fecha">📅 {dia.fecha}</span>
                  <span className="texto-muted historial-cierre">
                    Cierre:{" "}
                    {new Date(dia.fechaCierre).toLocaleTimeString("es-CO", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="historial-metricas">
                  <div className="historial-metrica">
                    <span className="metrica-etiqueta">Vendido</span>
                    <span className="metrica-valor metrica-amber">
                      ${dia.totalVentas.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="historial-metrica">
                    <span className="metrica-etiqueta">Monto final</span>
                    <span className="metrica-valor">
                      ${dia.montoFinal.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="historial-metrica">
                    <span className="metrica-etiqueta">Transacciones</span>
                    <span className="metrica-valor">{dia.ventas.length}</span>
                  </div>
                </div>
                <span className="historial-chevron">{expandido ? "▲" : "▼"}</span>
              </div>

              {/* ── Detalle expandido del día ── */}
              {expandido && (
                <div className="historial-detalle">
                  <div className="desglose-metodos">
                    {Object.entries(desglose).map(([metodo, total]) => (
                      <div key={metodo} className="desglose-item">
                        <span>{ICONO_METODO[metodo] || "💰"} {metodo}</span>
                        <span className="td-monto">${total.toLocaleString("es-CO")}</span>
                      </div>
                    ))}
                  </div>

                  <p className="texto-muted" style={{ marginBottom: "0.5rem", fontSize: "0.78rem" }}>
                    Haz clic en una venta para ver el detalle de productos →
                  </p>

                  <div className="tabla-wrapper">
                    <table className="tabla">
                      <thead>
                        <tr>
                          <th style={{ width: 28 }}></th>
                          <th>Mesa</th>
                          <th>Hora</th>
                          <th>Método</th>
                          <th className="th-num">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dia.ventas.map((v, j) => {
                          const ventaKey     = `${i}-${j}`;
                          const estaExpandida = ventaExpandida === ventaKey;
                          const tieneItems   = v.items && v.items.length > 0;

                          return (
                            <React_Fragment key={v.id || j}>
                              <tr
                                className={estaExpandida ? "fila-seleccionada" : ""}
                                style={{ cursor: tieneItems ? "pointer" : "default" }}
                                onClick={() =>
                                  tieneItems &&
                                  setVentaExpandida(estaExpandida ? null : ventaKey)
                                }
                              >
                                <td className="td-center" style={{ color: "var(--text-3)", fontSize: "0.65rem" }}>
                                  {tieneItems ? (estaExpandida ? "▼" : "▶") : ""}
                                </td>
                                <td>{v.mesa}</td>
                                <td>{v.hora}</td>
                                <td>
                                  <span className={`chip chip-metodo chip-${v.metodo?.toLowerCase()}`}>
                                    {ICONO_METODO[v.metodo]} {v.metodo}
                                  </span>
                                </td>
                                <td className="td-num td-monto">
                                  ${v.total.toLocaleString("es-CO")}
                                </td>
                              </tr>

                              {estaExpandida && tieneItems && (
                                <tr>
                                  <td colSpan={5} style={{ padding: 0, background: "var(--bg)" }}>
                                    <div className="venta-detalle-productos">
                                      <p className="venta-detalle-titulo">
                                        📦 Productos cobrados en esta transacción
                                      </p>
                                      <table className="tabla tabla-productos">
                                        <thead>
                                          <tr>
                                            <th>Producto</th>
                                            <th className="th-num">Cant.</th>
                                            <th className="th-num">Precio u.</th>
                                            <th className="th-num">Subtotal</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {v.items.map((item, k) => (
                                            <tr key={k}>
                                              <td>{item.nombre}</td>
                                              <td className="td-num">{item.cantidad}</td>
                                              <td className="td-num">
                                                ${item.precio.toLocaleString("es-CO")}
                                              </td>
                                              <td className="td-num td-monto">
                                                ${(item.precio * item.cantidad).toLocaleString("es-CO")}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React_Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Necesario para usar Fragment con key dentro de la tabla
const React_Fragment = ({ children }) => <>{children}</>;

export default Historial;