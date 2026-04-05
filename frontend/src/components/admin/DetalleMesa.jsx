// frontend/src/components/admin/DetalleMesa.jsx

import { useState } from "react";

const METODOS_PAGO = ["Efectivo", "Tarjeta", "Transferencia"];
const ICONO_METODO = { Efectivo: "💵", Tarjeta: "💳", Transferencia: "📲" };

const num = (v) => parseFloat(v) || 0;

const DetalleMesa = ({
  mesa,
  onModificarItem,
  onPagoTotal,
  onPagoParcial,
  onVolver,
  cajaAbierta,
}) => {
  const [metodoPago,    setMetodoPago]    = useState("Efectivo");
  const [modoDivision,  setModoDivision]  = useState(false);
  // FIX BUG 1: guardar el item completo indexado por su posición en el array
  // para que la comparación siempre funcione aunque item_id sea undefined
  const [indicesSeleccionados, setIndicesSeleccionados] = useState([]);
  const [procesando, setProcesando] = useState(false);

  const pedido = mesa.pedido || [];

  const totalMesa = pedido.reduce(
    (acc, i) => acc + num(i.precio) * num(i.cantidad), 0
  );

  // FIX BUG 1: calcular total usando los índices seleccionados, no los objetos
  const itemsSeleccionados = indicesSeleccionados.map(idx => pedido[idx]).filter(Boolean);
  const totalSeleccionado  = itemsSeleccionados.reduce(
    (acc, i) => acc + num(i.precio) * num(i.cantidad), 0
  );

  const toggleSeleccion = (idx) => {
    setIndicesSeleccionados(prev =>
      prev.includes(idx)
        ? prev.filter(i => i !== idx)
        : [...prev, idx]
    );
  };

  const handlePagoTotal = async () => {
    setProcesando(true);
    await onPagoTotal(metodoPago);
    setModoDivision(false);
    setIndicesSeleccionados([]);
    setProcesando(false);
  };

  // FIX BUG 2: esperar a que el padre recargue las mesas antes de limpiar estado
  const handlePagoParcial = async () => {
    if (itemsSeleccionados.length === 0) return;
    setProcesando(true);
    await onPagoParcial(itemsSeleccionados, metodoPago);
    // El padre recargó las mesas desde la API — limpiar estado local
    setIndicesSeleccionados([]);
    setModoDivision(false);
    setProcesando(false);
    // Volver automáticamente para que el usuario vea el estado actualizado
    // (si la mesa quedó sin items, el padre ya maneja el cierre)
    onVolver();
  };

  return (
    <div className="detalle-overlay">
      <div className="detalle-panel">

        {/* ── ENCABEZADO ── */}
        <div className="detalle-header">
          <button className="btn-ghost btn-back" onClick={onVolver}>← Volver</button>
          <div className="detalle-titulo-group">
            <h3 className="detalle-titulo">{mesa.nombre || `Mesa ${mesa.id}`}</h3>
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
            {/* ── TABLA ── */}
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
                  {pedido.map((item, idx) => {
                    const seleccionado = indicesSeleccionados.includes(idx);
                    const precio   = num(item.precio);
                    const cantidad = num(item.cantidad);
                    const subtotal = precio * cantidad;

                    return (
                      <tr
                        key={idx}
                        className={modoDivision && seleccionado ? "fila-seleccionada" : ""}
                        onClick={modoDivision ? () => toggleSeleccion(idx) : undefined}
                        style={modoDivision ? { cursor: "pointer" } : {}}
                      >
                        {modoDivision && (
                          <td>
                            <input
                              type="checkbox"
                              checked={seleccionado}
                              onChange={() => toggleSeleccion(idx)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                        )}
                        <td className="td-nombre">{item.nombre}</td>
                        <td className="td-obs">
                          {item.observacion
                            ? <span className="badge-obs" title={item.observacion}>📝</span>
                            : <span className="texto-muted">—</span>}
                        </td>
                        <td className="td-num">{cantidad}</td>
                        <td className="td-num">${precio.toLocaleString("es-CO")}</td>
                        <td className="td-num td-monto">${subtotal.toLocaleString("es-CO")}</td>
                        {!modoDivision && (
                          <td className="td-center">
                            <div className="controles-cantidad">
                              <button className="btn-cantidad"
                                onClick={() => onModificarItem(idx, -1)}>−</button>
                              <span className="cantidad-valor">{cantidad}</span>
                              <button className="btn-cantidad"
                                onClick={() => onModificarItem(idx, 1)}>+</button>
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
                <div className="metodo-selector">
                  {METODOS_PAGO.map((m) => (
                    <button key={m}
                      className={`btn-metodo ${metodoPago === m ? "activo" : ""}`}
                      onClick={() => setMetodoPago(m)}>
                      {ICONO_METODO[m]} {m}
                    </button>
                  ))}
                </div>

                {!modoDivision ? (
                  <div className="pago-botones">
                    <button className="btn-primario" onClick={handlePagoTotal}
                      disabled={procesando}>
                      💳 Cobrar total — ${totalMesa.toLocaleString("es-CO")}
                    </button>
                    <button className="btn-secundario"
                      onClick={() => { setModoDivision(true); setIndicesSeleccionados([]); }}>
                      ➗ Dividir cuenta
                    </button>
                  </div>
                ) : (
                  <div className="division-panel">
                    <p className="division-instruccion">
                      Selecciona los productos que va a pagar esta persona:
                    </p>

                    {/* FIX BUG 1: ahora muestra precio correcto */}
                    <div className="division-resumen">
                      <span>
                        {itemsSeleccionados.length} artículo(s) seleccionado(s)
                        {itemsSeleccionados.length > 0 && (
                          <span style={{ color: "var(--text-2)", fontSize: "0.78rem", marginLeft: "0.5rem" }}>
                            ({itemsSeleccionados.map(i =>
                              `${i.nombre} x${num(i.cantidad)}`
                            ).join(", ")})
                          </span>
                        )}
                      </span>
                      <span className="total-valor">
                        ${totalSeleccionado.toLocaleString("es-CO")}
                      </span>
                    </div>

                    <div className="pago-botones">
                      <button className="btn-primario" onClick={handlePagoParcial}
                        disabled={itemsSeleccionados.length === 0 || procesando}>
                        {procesando ? "Procesando..." : "Registrar pago parcial"}
                      </button>
                      <button className="btn-ghost"
                        onClick={() => { setModoDivision(false); setIndicesSeleccionados([]); }}>
                        Cancelar división
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="advertencia-caja">⚠️ Abre la caja para registrar pagos.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DetalleMesa;