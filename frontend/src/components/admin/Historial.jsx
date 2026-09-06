// frontend/src/components/admin/Historial.jsx

import { useState, useMemo, useEffect } from "react";
import VentaDetalleModal from "./VentaDetalleModal";
import { cajaService } from "../../services/cajaService";

const ICONO_METODO = {
  efectivo:      "💵",
  tarjeta:       "💳",
  transferencia: "📲",
};

const POR_PAGINA = 3; // <-- ajusta cuántas jornadas quieres por página

// Formatea cualquier fecha de MySQL a "31 mar 2026"
const formatearFecha = (valor) => {
  if (!valor) return "—";
  const solo = typeof valor === "string" ? valor.split("T")[0] : valor;
  const [anio, mes, dia] = String(solo).split("-");
  const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${dia} ${meses[parseInt(mes, 10) - 1]} ${anio}`;
};

// Paginador reutilizable
const Paginador = ({ paginaActual, totalPaginas, onCambiar }) => {
  if (totalPaginas <= 1) return null;

  const paginas = [];
  const rango = 1;
  for (let i = 1; i <= totalPaginas; i++) {
    if (i === 1 || i === totalPaginas || (i >= paginaActual - rango && i <= paginaActual + rango)) {
      paginas.push(i);
    } else if (paginas[paginas.length - 1] !== "...") {
      paginas.push("...");
    }
  }

  return (
    <div className="paginador" style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: "0.4rem", marginTop: "1rem", flexWrap: "wrap",
    }}>
      <button
        className="btn-secundario"
        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
        disabled={paginaActual === 1}
        onClick={() => onCambiar(paginaActual - 1)}
      >
        ← Anterior
      </button>

      {paginas.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="texto-muted" style={{ padding: "0 0.3rem" }}>…</span>
        ) : (
          <button
            key={p}
            className={`btn-secundario ${p === paginaActual ? "activo" : ""}`}
            style={{
              padding: "0.3rem 0.65rem",
              fontSize: "0.8rem",
              fontWeight: p === paginaActual ? 700 : 400,
              background: p === paginaActual ? "var(--acento, #6366f1)" : undefined,
              color: p === paginaActual ? "#fff" : undefined,
            }}
            onClick={() => onCambiar(p)}
          >
            {p}
          </button>
        )
      )}

      <button
        className="btn-secundario"
        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
        disabled={paginaActual === totalPaginas}
        onClick={() => onCambiar(paginaActual + 1)}
      >
        Siguiente →
      </button>
    </div>
  );
};

// NUEVO: onVentaCorregida es opcional — pásala desde el padre (ej. AdminDashboard)
// si quieres refrescar el historial completo (getHistorial) después de guardar
// una corrección. Si no la pasas, el modal simplemente se cierra.
const Historial = ({ historial, onVentaCorregida }) => {
  const [diaExpandido,   setDiaExpandido]   = useState(null);
  const [ventaExpandida, setVentaExpandida] = useState(null);
  const [pagina,         setPagina]         = useState(1);

  // NUEVO: venta actualmente abierta en el modal de detalle/edición
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  const totalPaginas = Math.max(1, Math.ceil((historial?.length || 0) / POR_PAGINA));

  // Si el historial cambia de tamaño y la página actual queda fuera de rango, ajusta
  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
  }, [totalPaginas]); // eslint-disable-line react-hooks/exhaustive-deps

  const historialPagina = useMemo(() => {
    const inicio = (pagina - 1) * POR_PAGINA;
    return (historial || []).slice(inicio, inicio + POR_PAGINA);
  }, [historial, pagina]);

  const cambiarPagina = (nueva) => {
    setPagina(nueva);
    setDiaExpandido(null);
    setVentaExpandida(null);
  };

  // NUEVO: abre el modal de detalle/edición para una venta de una jornada cerrada
  const abrirEdicion = async (venta_id) => {
    try {
      const respuesta = await cajaService.getVentaDetalle(venta_id);
      setVentaSeleccionada(respuesta.venta);
    } catch (err) {
      console.error("[abrirEdicion historial]", err);
    }
  };

  const handleVentaGuardada = () => {
    setVentaSeleccionada(null);
    onVentaCorregida?.(); // el padre decide si vuelve a pedir el historial
  };

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
        {historialPagina.map((dia, idxPagina) => {
          // índice real dentro del array completo, para keys de expansión consistentes
          const i = (pagina - 1) * POR_PAGINA + idxPagina;
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
                                          <div style={{
                                            display: "flex", alignItems: "center",
                                            justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem",
                                          }}>
                                            <p className="venta-detalle-titulo" style={{ margin: 0 }}>
                                              📦 Productos cobrados en esta transacción
                                            </p>
                                            {/* NUEVO: botón para corregir esta venta — v.id viene del
                                                SELECT de getHistorial, así que sí está disponible aquí */}
                                            {v.id && (
                                              <button
                                                className="btn-secundario"
                                                onClick={(e) => { e.stopPropagation(); abrirEdicion(v.id); }}
                                              >
                                                ✏️ Corregir esta venta
                                              </button>
                                            )}
                                          </div>
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

      <Paginador
        paginaActual={pagina}
        totalPaginas={totalPaginas}
        onCambiar={cambiarPagina}
      />

      {/* ============================ */}
      {/* MODAL DE DETALLE / EDICIÓN DE VENTA (jornadas ya cerradas) */}
      {/* ============================ */}
      {ventaSeleccionada && (
        <VentaDetalleModal
          venta={ventaSeleccionada}
          onClose={() => setVentaSeleccionada(null)}
          onGuardado={handleVentaGuardada}
        />
      )}
    </div>
  );
};

const Frag = ({ children }) => <>{children}</>;

export default Historial;