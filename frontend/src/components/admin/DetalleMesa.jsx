// ══════════════════════════════════════════════════════════════════
// DetalleMesa.jsx — Detalle de pedido, modificación y sistema de pago
// ══════════════════════════════════════════════════════════════════

import { useState } from "react";

const METODOS_PAGO = ["Efectivo", "Tarjeta", "Transferencia"];

const ICONO_METODO = {
  Efectivo:      "💵",
  Tarjeta:       "💳",
  Transferencia: "📲",
};

/**
 * @param {{
 *   mesa: object,
 *   onModificarItem: fn(index, delta) => void,
 *   onPagoTotal: fn(metodo) => void,
 *   onPagoParcial: fn(items, metodo) => void,
 *   onVolver: fn() => void,
 *   cajaAbierta: boolean,
 * }} props
 */
const DetalleMesa = ({
  mesa,
  onModificarItem,
  onPagoTotal,
  onPagoParcial,
  onVolver,
  cajaAbierta,
}) => {
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [modoDivision, setModoDivision] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);

  const pedido = mesa.pedido || [];
  const totalMesa = pedido.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const totalSeleccionado = seleccionados.reduce(
    (acc, i) => acc + i.precio * i.cantidad, 0
  );

  const toggleSeleccion = (item) => {
    const existe = seleccionados.find((s) => s.nombre === item.nombre);
    if (existe) {
      setSeleccionados(seleccionados.filter((s) => s.nombre !== item.nombre));
    } else {
      setSeleccionados([...seleccionados, item]);
    }
  };

  const handlePagoTotal = () => {
    onPagoTotal(metodoPago);
    setModoDivision(false);
    setSeleccionados([]);
  };

  const handlePagoParcial = () => {
    if (seleccionados.length === 0) return;
    onPagoParcial(seleccionados, metodoPago);
    setSeleccionados([]);
    setModoDivision(false);
  };

  return (
    <div className="detalle-overlay">
      <div className="detalle-panel">
        {/* ── ENCABEZADO ── */}
        <div className="detalle-header">
          <button className="btn-ghost btn-back" onClick={onVolver}>
            ← Volver
          </button>
          <div className="detalle-titulo-group">
            <h3 className="detalle-titulo">
              {mesa.nombre || `Mesa ${mesa.id}`}
            </h3>
            <span className={`chip ${mesa.ocupada ? "chip-amber" : "chip-verde"}`}>
              {mesa.ocupada ? "Ocupada" : "Libre"}
            </span>
          </div>
        </div>

        {pedido.length === 0 ? (
          <div className="detalle-vacio">
            <p className="texto-secundario">Esta mesa no tiene pedidos activos.</p>
          </div>
        ) : (
          <>
            {/* ── TABLA DE PEDIDO ── */}
            <div className="tabla-wrapper">
              <table className="tabla">
                <thead>
                  <tr>
                    {modoDivision && <th className="th-check">✓</th>}
                    <th>Producto</th>
                    <th>Obs.</th>
                    <th className="th-num">Cant.</th>
                    <th className="th-num">Precio</th>
                    <th className="th-num">Subtotal</th>
                    {!modoDivision && <th className="th-center">Modificar</th>}
                  </tr>
                </thead>
                <tbody>
                  {pedido.map((item, i) => {
                    const seleccionado = !!seleccionados.find(
                      (s) => s.nombre === item.nombre
                    );
                    return (
                      <tr
                        key={i}
                        className={modoDivision && seleccionado ? "fila-seleccionada" : ""}
                        onClick={modoDivision ? () => toggleSeleccion(item) : undefined}
                        style={modoDivision ? { cursor: "pointer" } : {}}
                      >
                        {modoDivision && (
                          <td>
                            <input
                              type="checkbox"
                              checked={seleccionado}
                              onChange={() => toggleSeleccion(item)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                        )}
                        <td className="td-nombre">{item.nombre}</td>
                        <td className="td-obs">
                          {item.observacion ? (
                            <span className="badge-obs" title={item.observacion}>
                              📝
                            </span>
                          ) : (
                            <span className="texto-muted">—</span>
                          )}
                        </td>
                        <td className="td-num">{item.cantidad}</td>
                        <td className="td-num">${item.precio.toLocaleString("es-CO")}</td>
                        <td className="td-num td-monto">
                          ${(item.precio * item.cantidad).toLocaleString("es-CO")}
                        </td>
                        {!modoDivision && (
                          <td className="td-center">
                            <div className="controles-cantidad">
                              <button
                                className="btn-cantidad"
                                onClick={() => onModificarItem(i, -1)}
                              >
                                −
                              </button>
                              <span className="cantidad-valor">{item.cantidad}</span>
                              <button
                                className="btn-cantidad"
                                onClick={() => onModificarItem(i, 1)}
                              >
                                +
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── TOTAL ── */}
            <div className="detalle-total">
              <span className="total-etiqueta">Total mesa</span>
              <span className="total-valor">${totalMesa.toLocaleString("es-CO")}</span>
            </div>

            {/* ── PANEL DE PAGO ── */}
            {cajaAbierta ? (
              <div className="pago-panel">
                {/* Método de pago */}
                <div className="metodo-selector">
                  {METODOS_PAGO.map((m) => (
                    <button
                      key={m}
                      className={`btn-metodo ${metodoPago === m ? "activo" : ""}`}
                      onClick={() => setMetodoPago(m)}
                    >
                      {ICONO_METODO[m]} {m}
                    </button>
                  ))}
                </div>

                {/* Botones de acción */}
                {!modoDivision ? (
                  <div className="pago-botones">
                    <button className="btn-primario" onClick={handlePagoTotal}>
                      💳 Cobrar total — ${totalMesa.toLocaleString("es-CO")}
                    </button>
                    <button
                      className="btn-secundario"
                      onClick={() => { setModoDivision(true); setSeleccionados([]); }}
                    >
                      ➗ Dividir cuenta
                    </button>
                  </div>
                ) : (
                  <div className="division-panel">
                    <p className="division-instruccion">
                      Selecciona los productos que va a pagar esta persona:
                    </p>
                    <div className="division-resumen">
                      <span>{seleccionados.length} item(s) seleccionado(s)</span>
                      <span className="total-valor">
                        ${totalSeleccionado.toLocaleString("es-CO")}
                      </span>
                    </div>
                    <div className="pago-botones">
                      <button
                        className="btn-primario"
                        onClick={handlePagoParcial}
                        disabled={seleccionados.length === 0}
                      >
                        Registrar pago parcial
                      </button>
                      <button
                        className="btn-ghost"
                        onClick={() => { setModoDivision(false); setSeleccionados([]); }}
                      >
                        Cancelar división
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="advertencia-caja">
                ⚠️ Abre la caja para registrar pagos.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DetalleMesa;