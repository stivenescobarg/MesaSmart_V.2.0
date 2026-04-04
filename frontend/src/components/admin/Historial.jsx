// frontend/src/components/admin/Historial.jsx

import { useState } from "react";

const ICONO_METODO = {
  efectivo:      "💵",
  tarjeta:       "💳",
  transferencia: "📲",
};

// Formatea cualquier fecha de MySQL a "31 mar 2026"
const formatearFecha = (valor) => {
  if (!valor) return "—";
  // Si viene como "2026-03-31" o "2026-03-31T05:00:00.000Z"
  // Tomamos solo la parte de fecha para evitar desfase de zona horaria
  const solo = typeof valor === "string" ? valor.split("T")[0] : valor;
  const [anio, mes, dia] = String(solo).split("-");
  const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${dia} ${meses[parseInt(mes, 10) - 1]} ${anio}`;
};

const Historial = ({ historial }) => {
  const [diaExpandido,   setDiaExpandido]   = useState(null);
  const [ventaExpandida, setVentaExpandida] = useState(null);

  if (!historial || historial.length === 0) {
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
        {[...historial].map((dia, i) => {
          const expandido = diaExpandido === i;
          const ventas    = dia.ventas || [];

          const desglose = {
            efectivo:      parseFloat(dia.total_efectivo) || 0,
            tarjeta:       parseFloat(dia.total_tarjeta)  || 0,
            transferencia: parseFloat(dia.total_transf)   || 0,
          };

          return (
            <div key={dia.id || i} className={`historial-card ${expandido ? "expandido" : ""}`}>

              {/* ── Resumen ── */}
              <div
                className="historial-resumen"
                onClick={() => { setDiaExpandido(expandido ? null : i); setVentaExpandida(null); }}
              >
                <div className="historial-fecha-col">
                  {/* Fecha limpia: "31 mar 2026" */}
                  <span className="historial-fecha">
                    📅 {formatearFecha(dia.fecha)}
                  </span>
                  <span className="texto-muted historial-cierre">
                    {dia.cant_ventas || ventas.length} venta(s)
                  </span>
                </div>

                <div className="historial-metricas">
                  <div className="historial-metrica">
                    <span className="metrica-etiqueta">Vendido</span>
                    <span className="metrica-valor metrica-amber">
                      ${(parseFloat(dia.total_ventas) || 0).toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="historial-metrica">
                    <span className="metrica-etiqueta">Monto final</span>
                    <span className="metrica-valor">
                      ${(parseFloat(dia.monto_final) || 0).toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="historial-metrica">
                    <span className="metrica-etiqueta">Transacciones</span>
                    <span className="metrica-valor">{dia.cant_ventas || ventas.length}</span>
                  </div>
                </div>

                <span className="historial-chevron">{expandido ? "▲" : "▼"}</span>
              </div>

              {/* ── Detalle expandido ── */}
              {expandido && (
                <div className="historial-detalle">

                  {/* Desglose por método */}
                  <div className="desglose-metodos">
                    {Object.entries(desglose).map(([metodo, total]) =>
                      total > 0 ? (
                        <div key={metodo} className="desglose-item">
                          <span>{ICONO_METODO[metodo] || "💰"} {metodo}</span>
                          <span className="td-monto">${total.toLocaleString("es-CO")}</span>
                        </div>
                      ) : null
                    )}
                  </div>

                  {ventas.length === 0 ? (
                    <p className="texto-muted">No hay ventas detalladas para esta jornada.</p>
                  ) : (
                    <>
                      <p className="texto-muted" style={{ marginBottom: "0.5rem", fontSize: "0.78rem" }}>
                        Haz clic en una venta para ver el detalle →
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
                            {ventas.map((v, j) => {
                              const ventaKey      = `${i}-${j}`;
                              const estaExpandida = ventaExpandida === ventaKey;
                              const tieneItems    = v.items && v.items.length > 0;
                              const metodo        = v.metodo_pago || v.metodo || "";

                              return (
                                <Frag key={v.id || j}>
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
                                    <td>{v.mesa_nombre || v.mesa || "—"}</td>
                                    <td>{v.hora || "—"}</td>
                                    <td>
                                      <span className={`chip chip-metodo chip-${metodo.toLowerCase()}`}>
                                        {ICONO_METODO[metodo.toLowerCase()] || "💰"} {metodo}
                                      </span>
                                    </td>
                                    <td className="td-num td-monto">
                                      ${(parseFloat(v.total) || 0).toLocaleString("es-CO")}
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
                                                    ${(parseFloat(item.precio) || 0).toLocaleString("es-CO")}
                                                  </td>
                                                  <td className="td-num td-monto">
                                                    ${((parseFloat(item.precio)||0) * item.cantidad).toLocaleString("es-CO")}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Frag>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Frag = ({ children }) => <>{children}</>;

export default Historial;