// frontend/src/components/admin/DetalleMesa.jsx
// ✅ Total y tabla se actualizan en tiempo real con optimistic update

import { useState, useEffect } from "react";

const METODOS_PAGO = ["Efectivo", "Tarjeta", "Transferencia"];
const ICONO_METODO = { Efectivo: "💵", Tarjeta: "💳", Transferencia: "📲" };

const PIN_ELIMINAR = "1234";

const num = (v) => parseFloat(v) || 0;

// ── Mini-modal ────────────────────────────────────────────────────
const MiniModal = ({ titulo, children, onCerrar }) => (
  <div className="mini-modal-overlay" onClick={onCerrar}>
    <div className="mini-modal" onClick={(e) => e.stopPropagation()}>
      <div className="mini-modal-header">
        <h4 className="mini-modal-titulo">{titulo}</h4>
        <button className="btn-ghost mini-modal-close" onClick={onCerrar}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ── Modal PIN eliminar ────────────────────────────────────────────
const ModalPin = ({ item, onConfirmar, onCerrar }) => {
  const [pin, setPin]     = useState("");
  const [error, setError] = useState("");

  const handleConfirmar = () => {
    if (pin === PIN_ELIMINAR) {
      onConfirmar();
    } else {
      setError("PIN incorrecto. Intenta de nuevo.");
      setPin("");
    }
  };

  return (
    <MiniModal titulo="🔐 Eliminar producto" onCerrar={onCerrar}>
      <p className="texto-secundario" style={{ marginBottom: "0.75rem" }}>
        Estás por eliminar <strong>{item?.nombre}</strong>.
        Ingresa el PIN de administrador para confirmar.
      </p>
      <input
        className="input-pin"
        type="password"
        inputMode="numeric"
        maxLength={6}
        placeholder="●●●●"
        value={pin}
        autoFocus
        onChange={(e) => { setPin(e.target.value); setError(""); }}
        onKeyDown={(e) => e.key === "Enter" && handleConfirmar()}
      />
      {error && <p className="error-pin">{error}</p>}
      <div className="mini-modal-botones">
        <button className="btn-ghost" onClick={onCerrar}>Cancelar</button>
        <button className="btn-peligro" onClick={handleConfirmar} disabled={!pin}>
          Eliminar
        </button>
      </div>
    </MiniModal>
  );
};

// ── Modal mover items ─────────────────────────────────────────────
const ModalMoverItems = ({ pedido, mesas, mesaActual, onMover, onCerrar }) => {
  const [indicesSeleccionados, setIndicesSeleccionados] = useState([]);
  const [mesaDestinoId, setMesaDestinoId]               = useState("");
  const [procesando, setProcesando]                      = useState(false);

  const mesasDestino = mesas.filter((m) => m.id !== mesaActual.id && m.ocupada && m.pedido?.length > 0);
  const mesasLibres  = mesas.filter((m) => m.id !== mesaActual.id && !m.ocupada);

  const toggleItem = (idx) =>
    setIndicesSeleccionados((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );

  const toggleTodos = () =>
    setIndicesSeleccionados(
      indicesSeleccionados.length === pedido.length ? [] : pedido.map((_, i) => i)
    );

  const itemsSeleccionados = indicesSeleccionados.map((i) => pedido[i]).filter(Boolean);

  const handleMover = async () => {
    if (!mesaDestinoId || !itemsSeleccionados.length) return;
    setProcesando(true);
    await onMover(itemsSeleccionados, Number(mesaDestinoId));
    setProcesando(false);
    onCerrar();
  };

  return (
    <MiniModal titulo="🔀 Mover productos a otra mesa" onCerrar={onCerrar}>
      <p className="texto-secundario" style={{ marginBottom: "0.6rem", fontSize: "0.82rem" }}>
        Selecciona los productos que deseas mover:
      </p>
      <div className="mover-items-lista">
        <label className="mover-item-row mover-item-todos" onClick={toggleTodos}>
          <input type="checkbox"
            checked={indicesSeleccionados.length === pedido.length && pedido.length > 0}
            onChange={toggleTodos} onClick={(e) => e.stopPropagation()} />
          <span style={{ fontWeight: 600 }}>Seleccionar todos</span>
        </label>
        {pedido.map((item, idx) => (
          <label key={idx}
            className={`mover-item-row ${indicesSeleccionados.includes(idx) ? "mover-item-seleccionado" : ""}`}
            onClick={() => toggleItem(idx)}>
            <input type="checkbox" checked={indicesSeleccionados.includes(idx)}
              onChange={() => toggleItem(idx)} onClick={(e) => e.stopPropagation()} />
            <span className="mover-item-nombre">{item.nombre}</span>
            <span className="mover-item-cant">×{num(item.cantidad)}</span>
          </label>
        ))}
      </div>

      <p className="texto-secundario" style={{ margin: "0.85rem 0 0.4rem", fontSize: "0.82rem" }}>
        Mesa de destino:
      </p>
      <select className="select-mesa-destino" value={mesaDestinoId}
        onChange={(e) => setMesaDestinoId(e.target.value)}>
        <option value="">— Selecciona una mesa —</option>
        {mesasDestino.length > 0 && (
          <optgroup label="Con pedido activo">
            {mesasDestino.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre || `Mesa ${m.id}`}</option>
            ))}
          </optgroup>
        )}
        {mesasLibres.length > 0 && (
          <optgroup label="Mesas libres">
            {mesasLibres.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre || `Mesa ${m.id}`}</option>
            ))}
          </optgroup>
        )}
      </select>

      <div className="mini-modal-botones" style={{ marginTop: "1rem" }}>
        <button className="btn-ghost" onClick={onCerrar}>Cancelar</button>
        <button className="btn-primario" onClick={handleMover}
          disabled={!itemsSeleccionados.length || !mesaDestinoId || procesando}>
          {procesando ? "Moviendo..." : `Mover (${itemsSeleccionados.length})`}
        </button>
      </div>
    </MiniModal>
  );
};

// ══════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════
const DetalleMesa = ({
  mesa,
  mesas,
  onModificarItem,
  onEliminarItem,
  onMoverItems,
  onPagoTotal,
  onPagoParcial,
  onVolver,
  cajaAbierta,
}) => {
  const [metodoPago,           setMetodoPago]          = useState("Efectivo");
  const [modoDivision,         setModoDivision]         = useState(false);
  const [indicesSeleccionados, setIndicesSeleccionados] = useState([]);
  const [procesando,           setProcesando]           = useState(false);
  const [modalPin,             setModalPin]             = useState(null);
  const [modalMover,           setModalMover]           = useState(false);
  const [avisoMin,             setAvisoMin]             = useState(null);

  // ── Estado local del pedido para optimistic updates ───────────
  const [pedidoLocal, setPedidoLocal] = useState(mesa.pedido || []);

  // Sincronizar cuando el backend responde y cargarMesas() actualiza el prop
  useEffect(() => {
    setPedidoLocal(mesa.pedido || []);
  }, [mesa.pedido]);

  // Total siempre calculado desde pedidoLocal → se ve al instante
  const totalMesa = pedidoLocal.reduce(
    (acc, i) => acc + num(i.precio) * num(i.cantidad), 0
  );

  const itemsSeleccionados = indicesSeleccionados
    .map((idx) => pedidoLocal[idx])
    .filter(Boolean);

  const totalSeleccionado = itemsSeleccionados.reduce(
    (acc, i) => acc + num(i.precio) * num(i.cantidad), 0
  );

  const toggleSeleccion = (idx) =>
    setIndicesSeleccionados((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );

  // ── Modificar cantidad — optimistic ──────────────────────────
  const handleModificar = (item, delta) => {
    const nuevaCantidad = num(item.cantidad) + delta;
    if (nuevaCantidad <= 0) { setAvisoMin(item.nombre); return; }

    // Actualizar pantalla de inmediato
    setPedidoLocal(prev =>
      prev.map(i =>
        i.item_id === item.item_id ? { ...i, cantidad: nuevaCantidad } : i
      )
    );

    // Persistir en backend (si falla, el useEffect revierte al próximo cargarMesas)
    onModificarItem(mesa, item.item_id, delta);
  };

  // ── Eliminar item — optimistic ────────────────────────────────
  const handleConfirmarEliminar = async () => {
    if (!modalPin) return;
    const { item } = modalPin;

    // Quitar de pantalla de inmediato
    setPedidoLocal(prev => prev.filter(i => i.item_id !== item.item_id));
    // Limpiar selección si el item estaba seleccionado
    const idx = pedidoLocal.findIndex(i => i.item_id === item.item_id);
    setIndicesSeleccionados(prev => prev.filter(i => i !== idx).map(i => i > idx ? i - 1 : i));
    setModalPin(null);

    // Persistir en backend
    await onEliminarItem(mesa, item.item_id);
  };

  const handlePagoTotal = async () => {
    setProcesando(true);
    await onPagoTotal(metodoPago);
    setModoDivision(false);
    setIndicesSeleccionados([]);
    setProcesando(false);
  };

  const handlePagoParcial = async () => {
    if (!itemsSeleccionados.length) return;
    setProcesando(true);
    await onPagoParcial(itemsSeleccionados, metodoPago);
    setIndicesSeleccionados([]);
    setModoDivision(false);
    setProcesando(false);
    onVolver();
  };

  return (
    <div className="detalle-layout">

      {/* ── Modales ── */}
      {modalPin && (
        <ModalPin item={modalPin.item} onConfirmar={handleConfirmarEliminar}
          onCerrar={() => setModalPin(null)} />
      )}
      {modalMover && (
        <ModalMoverItems pedido={pedidoLocal} mesas={mesas || []} mesaActual={mesa}
          onMover={onMoverItems} onCerrar={() => setModalMover(false)} />
      )}
      {avisoMin && (
        <MiniModal titulo="⚠️ Cantidad mínima" onCerrar={() => setAvisoMin(null)}>
          <p className="texto-secundario" style={{ marginBottom: "1rem" }}>
            <strong>{avisoMin}</strong> no puede quedar en 0.
            Usa el botón <strong>🗑</strong> si deseas quitarlo del pedido.
          </p>
          <div className="mini-modal-botones">
            <button className="btn-primario" onClick={() => setAvisoMin(null)}>Entendido</button>
          </div>
        </MiniModal>
      )}

      {/* ════ SIDEBAR IZQUIERDO ════ */}
      <aside className="detalle-sidebar">

        <button className="btn-ghost btn-back" onClick={onVolver}>← Volver</button>

        <div className="sidebar-mesa-info">
          <h3 className="sidebar-mesa-nombre">{mesa.nombre || `Mesa ${mesa.id}`}</h3>
          <span className={`chip ${mesa.ocupada ? "chip-amber" : "chip-verde"}`}>
            {mesa.ocupada ? "Ocupada" : "Libre"}
          </span>
        </div>

        {pedidoLocal.length > 0 && (
          <>
            {/* Total — se actualiza en tiempo real */}
            <div className="sidebar-total-box">
              <p className="sidebar-total-label">Total mesa</p>
              <p className="sidebar-total-valor">${totalMesa.toLocaleString("es-CO")}</p>
            </div>

            {/* Acciones */}
            <div className="sidebar-seccion">
              <p className="sidebar-seccion-titulo">Acciones</p>
              <button className="sidebar-accion-btn" onClick={() => setModalMover(true)}>
                🔀 Mover productos
              </button>
            </div>

            {/* Método de pago */}
            {cajaAbierta && (
              <div className="sidebar-seccion">
                <p className="sidebar-seccion-titulo">Método de pago</p>
                <div className="sidebar-metodos">
                  {METODOS_PAGO.map((m) => (
                    <button key={m}
                      className={`sidebar-metodo-btn ${metodoPago === m ? "activo" : ""}`}
                      onClick={() => setMetodoPago(m)}>
                      {ICONO_METODO[m]}<br />{m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cobro normal */}
            {cajaAbierta && !modoDivision && (
              <div className="sidebar-seccion">
                <button className="btn-primario sidebar-btn-full"
                  onClick={handlePagoTotal} disabled={procesando}>
                  💳 Cobrar ${totalMesa.toLocaleString("es-CO")}
                </button>
                <button className="btn-secundario sidebar-btn-full"
                  style={{ marginTop: "0.5rem" }}
                  onClick={() => { setModoDivision(true); setIndicesSeleccionados([]); }}>
                  ➗ Dividir cuenta
                </button>
              </div>
            )}

            {/* Modo división */}
            {cajaAbierta && modoDivision && (
              <div className="sidebar-seccion">
                <p className="sidebar-seccion-titulo">División activa</p>
                <p className="texto-secundario" style={{ fontSize: "0.78rem", marginBottom: "0.6rem" }}>
                  Selecciona ítems en la tabla →
                </p>
                {itemsSeleccionados.length > 0 && (
                  <div className="sidebar-division-resumen">
                    <span>{itemsSeleccionados.length} ítem(s)</span>
                    <strong>${totalSeleccionado.toLocaleString("es-CO")}</strong>
                  </div>
                )}
                <button className="btn-primario sidebar-btn-full"
                  onClick={handlePagoParcial}
                  disabled={!itemsSeleccionados.length || procesando}>
                  {procesando ? "Procesando..." : "Registrar pago parcial"}
                </button>
                <button className="btn-ghost sidebar-btn-full"
                  style={{ marginTop: "0.5rem" }}
                  onClick={() => { setModoDivision(false); setIndicesSeleccionados([]); }}>
                  Cancelar división
                </button>
              </div>
            )}

            {!cajaAbierta && (
              <p className="advertencia-caja">⚠️ Abre la caja para registrar pagos.</p>
            )}
          </>
        )}
      </aside>

      {/* ════ TABLA DE PEDIDO ════ */}
      <div className="detalle-panel-derecho">
        {pedidoLocal.length === 0 ? (
          <div className="detalle-vacio">
            <p className="texto-secundario">Esta mesa no tiene pedidos activos.</p>
          </div>
        ) : (
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
                  {!modoDivision && <th className="th-center">Eliminar</th>}
                </tr>
              </thead>
              <tbody>
                {pedidoLocal.map((item, idx) => {
                  const seleccionado = indicesSeleccionados.includes(idx);
                  const precio       = num(item.precio);
                  const cantidad     = num(item.cantidad);

                  return (
                    <tr key={item.item_id ?? idx}
                      className={modoDivision && seleccionado ? "fila-seleccionada" : ""}
                      onClick={modoDivision ? () => toggleSeleccion(idx) : undefined}
                      style={modoDivision ? { cursor: "pointer" } : {}}>

                      {modoDivision && (
                        <td>
                          <input type="checkbox" checked={seleccionado}
                            onChange={() => toggleSeleccion(idx)}
                            onClick={(e) => e.stopPropagation()} />
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
                      <td className="td-num td-monto">
                        ${(precio * cantidad).toLocaleString("es-CO")}
                      </td>

                      {!modoDivision && (
                        <td className="td-center">
                          <div className="controles-cantidad">
                            <button className="btn-cantidad"
                              onClick={() => handleModificar(item, -1)}>−</button>
                            <span className="cantidad-valor">{cantidad}</span>
                            <button className="btn-cantidad"
                              onClick={() => handleModificar(item, 1)}>+</button>
                          </div>
                        </td>
                      )}

                      {!modoDivision && (
                        <td className="td-center">
                          <button className="btn-eliminar-item"
                            title="Eliminar (requiere PIN)"
                            onClick={() => setModalPin({ item })}>
                            🗑
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalleMesa;