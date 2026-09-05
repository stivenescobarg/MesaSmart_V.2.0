// frontend/src/components/admin/DetalleMesa.jsx
// ✅ Total y tabla se actualizan en tiempo real con optimistic update
// ✅ Servicio 10%, propina, descuentos, subcuentas y división por cantidades
// ✅ Pago mixto — se puede dividir el cobro entre varios métodos
//    de pago (ej. $40.000 en efectivo + $160.000 en transferencia) en
//    una misma transacción. Ver ModalConfigurarCobro más abajo.
//
// 🎨 CAMBIO DE ESTILO (este pase): SOLO se tocó marcado/clases para poder
// reordenar visualmente el modal de cobro en grupos con "detalle-mesa.css".
// Ningún estado, handler ni cálculo fue modificado. El layout de la mesa
// y de subcuentas se mantiene igual al que ya tenías; el import de CSS
// se agregó al final de este bloque de comentarios.
//
// import "./detalle-mesa.css";
//
// ⚠️ IMPORTANTE — LEER ANTES DE INTEGRAR:
// Este archivo AMPLÍA el componente original, no lo reemplaza conceptualmente.
// Se mantuvieron TODAS las funciones, estados y comportamientos previos
// (optimistic update de cantidades, eliminación con PIN, mover productos entre
// mesas, pago total, pago parcial por selección, validación de caja).
//
// Se agregaron llamadas a `onPagoTotal` y `onPagoParcial` con un ARGUMENTO
// ADICIONAL (`resumen`) al final, de forma retrocompatible:
//
//   onPagoTotal(metodoPago, resumen)
//   onPagoParcial(items, metodoPago, resumen)
//
// `resumen` ahora también incluye `resumen.pagos`: un arreglo con el
// desglose real del cobro, ej:
//   [{ metodo: "Efectivo", monto: 40000 }, { metodo: "Transferencia", monto: 160000 }]
// `metodoPago` (el primer argumento, como antes) sigue siendo un solo
// string: si el cobro fue en un único método, es ese método; si fue
// dividido entre varios, es el método con mayor monto (solo referencial,
// para no romper nada que hoy solo lea ese primer argumento). El desglose
// real y confiable para guardar en base de datos es siempre `resumen.pagos`.

import { useState, useEffect } from "react";
import "./detalle-mesa.css";

const METODOS_PAGO = ["Efectivo", "Tarjeta", "Transferencia"];
const ICONO_METODO = { Efectivo: "💵", Tarjeta: "💳", Transferencia: "📲" };

const PIN_ELIMINAR = "1234";

const DESCUENTOS_PRESET = [10, 20, 30, 50];

const num = (v) => parseFloat(v) || 0;
const money = (v) => `$${Math.round(num(v)).toLocaleString("es-CO")}`;

// Tolerancia para considerar que el desglose de pagos "cuadra" con el
// total (evita falsos negativos por errores de coma flotante).
const TOLERANCIA_CUADRE = 1;

// ══════════════════════════════════════════════════════════════════
// LÓGICA CENTRALIZADA DE CÁLCULO (punto 8 y 15 del prompt)
// Consumo → Descuento → Subtotal → Servicio 10% → Propina → Total
// ══════════════════════════════════════════════════════════════════
const calcularResumenCuenta = (items, opciones = {}) => {
  const {
    descuentoTipo = null,       // "10" | "20" | "30" | "50" | "personalizado" | null
    descuentoMonto = 0,         // solo se usa si descuentoTipo === "personalizado"
    servicioActivo = false,
    propina = 0,
  } = opciones;

  const consumo = (items || []).reduce(
    (acc, i) => acc + num(i.precio) * num(i.cantidad), 0
  );

  let descuentoValor = 0;
  if (descuentoTipo === "personalizado") {
    descuentoValor = num(descuentoMonto);
  } else if (descuentoTipo) {
    descuentoValor = consumo * (num(descuentoTipo) / 100);
  }
  // Nunca negativo, nunca mayor al consumo disponible
  descuentoValor = Math.min(Math.max(descuentoValor, 0), consumo);

  const subtotal = consumo - descuentoValor;
  const servicioValor = servicioActivo ? subtotal * 0.10 : 0;
  const propinaValor = Math.max(num(propina), 0);
  const total = subtotal + servicioValor + propinaValor;

  return {
    consumo,
    descuentoTipo,
    descuento: descuentoValor,
    subtotal,
    servicio: servicioValor,
    propina: propinaValor,
    total,
  };
};

// ── Mini-modal ────────────────────────────────────────────────────
const MiniModal = ({ titulo, children, onCerrar, ancho, className }) => (
  <div className="mini-modal-overlay" onClick={onCerrar}>
    <div className={`mini-modal ${className || ""}`} style={ancho ? { maxWidth: ancho } : undefined}
      onClick={(e) => e.stopPropagation()}>
      <div className="mini-modal-header">
        <h4 className="mini-modal-titulo">{titulo}</h4>
        <button className="btn-ghost mini-modal-close" onClick={onCerrar}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ── Modal PIN eliminar (sin cambios) ─────────────────────────────
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

// ── Modal mover items entre MESAS (sin cambios) ──────────────────
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

// ── Modal para crear una subcuenta ───────────────────────────────
const ModalNuevaSubcuenta = ({ onCrear, onCerrar }) => {
  const [nombre, setNombre] = useState("");

  const confirmar = () => {
    const limpio = nombre.trim();
    if (!limpio) return;
    onCrear(limpio);
  };

  return (
    <MiniModal titulo="➕ Nueva subcuenta" onCerrar={onCerrar}>
      <p className="texto-secundario" style={{ marginBottom: "0.6rem" }}>
        Ponle un nombre o identificador (ej. "Juan", "Puesto 2").
      </p>
      <input
        className="input-pin"
        style={{ letterSpacing: "normal", fontSize: "0.95rem", textAlign: "left" }}
        type="text"
        maxLength={30}
        placeholder="Nombre de la subcuenta"
        value={nombre}
        autoFocus
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && confirmar()}
      />
      <div className="mini-modal-botones">
        <button className="btn-ghost" onClick={onCerrar}>Cancelar</button>
        <button className="btn-primario" onClick={confirmar} disabled={!nombre.trim()}>
          Crear
        </button>
      </div>
    </MiniModal>
  );
};

// ── Modal para decidir CUÁNTAS unidades mover a una subcuenta ────
const ModalCantidadSubcuenta = ({ item, disponible, subcuentaNombre, onConfirmar, onCerrar }) => {
  const [cantidad, setCantidad] = useState(1);

  const clamp = (v) => Math.min(Math.max(parseInt(v, 10) || 1, 1), disponible);

  const confirmar = () => onConfirmar(clamp(cantidad));

  return (
    <MiniModal titulo="🔢 ¿Cuántas unidades mover?" onCerrar={onCerrar}>
      <p className="texto-secundario" style={{ marginBottom: "0.5rem" }}>
        <strong>{item.nombre}</strong> — cantidad disponible en cuenta principal: <strong>{disponible}</strong>
      </p>
      <p className="texto-secundario" style={{ marginBottom: "0.75rem", fontSize: "0.8rem" }}>
        Se moverán a la subcuenta "{subcuentaNombre}"
      </p>
      <div className="controles-cantidad" style={{ justifyContent: "center", marginBottom: "0.5rem" }}>
        <button className="btn-cantidad" onClick={() => setCantidad((c) => clamp(c - 1))}>−</button>
        <input
          type="number"
          min={1}
          max={disponible}
          value={cantidad}
          onChange={(e) => setCantidad(clamp(e.target.value))}
          style={{ width: "3.5rem", textAlign: "center" }}
        />
        <button className="btn-cantidad" onClick={() => setCantidad((c) => clamp(c + 1))}>+</button>
      </div>
      <div className="mini-modal-botones">
        <button className="btn-ghost" onClick={onCerrar}>Cancelar</button>
        <button className="btn-primario" onClick={confirmar}>Mover</button>
      </div>
    </MiniModal>
  );
};

// ══════════════════════════════════════════════════════════════════
// Modal de configuración de cobro (descuento/servicio/propina/
// PAGO MIXTO). Se usa tanto para el cobro total de la mesa, como para
// pago parcial (selección simple) y para el cobro de una subcuenta.
//
// El pago se arma como una LISTA de líneas { id, metodo, monto }.
// Por defecto arranca con una sola línea = el total completo (el caso
// más común: un solo método). El usuario puede agregar más líneas para
// dividir el cobro. No se deja confirmar mientras la suma de las líneas
// no cuadre exactamente con el total.
//
// 🎨 Este modal se reorganizó en grupos ("cobro-grupo") para que cada
// sección (descuento, servicio, propina, métodos de pago, resumen) se
// lea como un bloque separado en vez de todo apilado sin jerarquía.
// La lógica de estado es idéntica a la versión anterior.
// ══════════════════════════════════════════════════════════════════
const ModalConfigurarCobro = ({ titulo, items, onConfirmar, onCerrar }) => {
  const [descuentoTipo, setDescuentoTipo]     = useState(null);
  const [descuentoMonto, setDescuentoMonto]   = useState("");
  const [servicioActivo, setServicioActivo]   = useState(false);
  const [propina, setPropina]                 = useState("");
  const [procesando, setProcesando]           = useState(false);

  const resumen = calcularResumenCuenta(items, {
    descuentoTipo,
    descuentoMonto,
    servicioActivo,
    propina,
  });

  // ── líneas de pago ────────────────────────────────────────
  const [pagos, setPagos] = useState([{ id: 1, metodo: "Efectivo", monto: "" }]);

  // Mientras haya una sola línea, se mantiene sincronizada con el total
  // (así el caso simple de "un solo método" no requiere escribir nada).
  useEffect(() => {
    setPagos((prev) => {
      if (prev.length !== 1) return prev;
      const montoRedondeado = resumen.total ? String(Math.round(resumen.total)) : "";
      if (prev[0].monto === montoRedondeado) return prev;
      return [{ ...prev[0], monto: montoRedondeado }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumen.total]);

  const totalAsignado = pagos.reduce((acc, p) => acc + num(p.monto), 0);
  const diferencia = Math.round((resumen.total - totalAsignado) * 100) / 100;
  const cuadra = Math.abs(diferencia) < TOLERANCIA_CUADRE;

  const actualizarPago = (id, campo, valor) =>
    setPagos((prev) => prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)));

  const agregarLineaPago = () => {
    setPagos((prev) => [...prev, { id: Date.now(), metodo: "Efectivo", monto: "" }]);
  };

  const quitarLineaPago = (id) => {
    setPagos((prev) => {
      const restante = prev.filter((p) => p.id !== id);
      if (restante.length === 1) {
        return [{ ...restante[0], monto: resumen.total ? String(Math.round(resumen.total)) : "" }];
      }
      return restante;
    });
  };

  const handleConfirmar = async () => {
    if (procesando || !cuadra) return; // evita doble confirmación y cobros descuadrados
    setProcesando(true);

    const desglose = pagos
  .map((p) => ({ metodo_pago: p.metodo, monto: num(p.monto) }))
  .filter((p) => p.monto > 0);

    // Método "principal" (solo referencial, para el primer argumento que
    // ya recibían onPagoTotal/onPagoParcial): el de mayor monto.
    const metodoPrincipal = desglose.length
      ? desglose.reduce((a, b) => (b.monto > a.monto ? b : a)).metodo
      : pagos[0]?.metodo || "Efectivo";

    await onConfirmar(metodoPrincipal, { ...resumen, pagos: desglose });
    setProcesando(false);
  };

  return (
    <MiniModal titulo={titulo || "💳 Configurar cobro"} onCerrar={onCerrar} ancho="420px" className="mini-modal-cobro">

      {/* Descuento */}
      <div className="cobro-grupo">
        <p className="sidebar-seccion-titulo">Descuento</p>
        <div className="sidebar-metodos">
          <button
            className={`sidebar-metodo-btn ${descuentoTipo === null ? "activo" : ""}`}
            onClick={() => { setDescuentoTipo(null); setDescuentoMonto(""); }}>
            Sin descuento
          </button>
          {DESCUENTOS_PRESET.map((p) => (
            <button key={p}
              className={`sidebar-metodo-btn ${descuentoTipo === String(p) ? "activo" : ""}`}
              onClick={() => setDescuentoTipo(String(p))}>
              {p}%
            </button>
          ))}
          <button
            className={`sidebar-metodo-btn ${descuentoTipo === "personalizado" ? "activo" : ""}`}
            onClick={() => setDescuentoTipo("personalizado")}>
            Monto
          </button>
        </div>
        {descuentoTipo === "personalizado" && (
          <input
            type="number"
            min={0}
            max={resumen.consumo}
            placeholder="Valor del descuento"
            className="cobro-input-monto"
            value={descuentoMonto}
            onChange={(e) => setDescuentoMonto(Math.max(0, num(e.target.value)))}
          />
        )}
      </div>

      {/* Servicio 10% */}
      <div className="cobro-grupo">
        <p className="sidebar-seccion-titulo">Servicio del 10% (opcional)</p>
        <label className="toggle-row" onClick={() => setServicioActivo((s) => !s)}>
          <span>El cliente acepta el servicio del 10%</span>
          <input type="checkbox" className="toggle-switch" checked={servicioActivo}
            onChange={() => setServicioActivo((s) => !s)}
            onClick={(e) => e.stopPropagation()} />
        </label>
      </div>

      {/* Propina */}
      <div className="cobro-grupo">
        <p className="sidebar-seccion-titulo">Propina (voluntaria)</p>
        <input
          type="number"
          min={0}
          placeholder="$ 0"
          className="cobro-input-monto"
          style={{ marginTop: 0 }}
          value={propina}
          onChange={(e) => setPropina(Math.max(0, num(e.target.value)))}
        />
      </div>

      {/* Métodos de pago — una o varias líneas */}
      <div className="cobro-grupo">
        <p className="sidebar-seccion-titulo">Métodos de pago</p>
        {pagos.map((p) => (
          <div key={p.id} className="cobro-metodo-fila">
            <select
              className="select-mesa-destino"
              value={p.metodo}
              onChange={(e) => actualizarPago(p.id, "metodo", e.target.value)}
            >
              {METODOS_PAGO.map((m) => (
                <option key={m} value={m}>{ICONO_METODO[m]} {m}</option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              placeholder="$ 0"
              className="cobro-input-monto"
              value={p.monto}
              onChange={(e) => actualizarPago(p.id, "monto", e.target.value)}
            />
            {pagos.length > 1 && (
              <button className="cobro-metodo-quitar" onClick={() => quitarLineaPago(p.id)}>
                ✕
              </button>
            )}
          </div>
        ))}
        <button className="btn-link-add" onClick={agregarLineaPago}>
          + Dividir entre otro método
        </button>

        {!cuadra && (
          <p className="cobro-aviso">
            {diferencia > 0
              ? `Falta asignar ${money(diferencia)} para completar el total.`
              : `Los montos suman ${money(Math.abs(diferencia))} de más.`}
          </p>
        )}
      </div>

      {/* Resumen en tiempo real */}
      <div className="cobro-resumen-box">
        <table>
          <tbody>
            <tr><td>Consumo</td><td style={{ textAlign: "right" }}>{money(resumen.consumo)}</td></tr>
            {resumen.descuento > 0 && (
              <tr className="cobro-fila-descuento">
                <td>Descuento</td><td style={{ textAlign: "right" }}>-{money(resumen.descuento)}</td>
              </tr>
            )}
            <tr><td>Subtotal</td><td style={{ textAlign: "right" }}>{money(resumen.subtotal)}</td></tr>
            <tr><td>Servicio 10%</td><td style={{ textAlign: "right" }}>{money(resumen.servicio)}</td></tr>
            <tr><td>Propina</td><td style={{ textAlign: "right" }}>{money(resumen.propina)}</td></tr>
            <tr className="cobro-fila-total">
              <td>Total</td><td style={{ textAlign: "right" }}>{money(resumen.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mini-modal-botones" style={{ marginTop: "0.9rem" }}>
        <button className="btn-ghost" onClick={onCerrar}>Cancelar</button>
        <button className="btn-primario" onClick={handleConfirmar} disabled={procesando || !cuadra}>
          {procesando ? "Procesando..." : `Confirmar pago ${money(resumen.total)}`}
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
  // ── Estados EXISTENTES (sin tocar su comportamiento) ───────────
  const [modoDivision,         setModoDivision]         = useState(false);
  const [indicesSeleccionados, setIndicesSeleccionados] = useState([]);
  const [procesando,           setProcesando]           = useState(false);
  const [modalPin,             setModalPin]             = useState(null);
  const [modalMover,           setModalMover]           = useState(false);
  const [avisoMin,             setAvisoMin]             = useState(null);

  // ── Estado local del pedido para optimistic updates (sin cambios)
  const [pedidoLocal, setPedidoLocal] = useState(mesa.pedido || []);

  useEffect(() => {
    setPedidoLocal(mesa.pedido || []);
  }, [mesa.pedido]);

  // ── modo de división ("simple" = selección + pago parcial como ya
  // existía; "subcuentas" = nuevo sistema de subcuentas)
  const [divisionTipo, setDivisionTipo] = useState("simple");

  // ── subcuentas ──────────────────────────────────────────────────
  // [{ id, nombre, items: [{ item_id, nombre, precio, cantidad }] }]
  const [subcuentas, setSubcuentas]                 = useState([]);
  const [modalNuevaSubcuenta, setModalNuevaSubcuenta] = useState(false);
  const [subcuentaActivaId, setSubcuentaActivaId]     = useState(null);
  const [modalCantidadSubcuenta, setModalCantidadSubcuenta] = useState(null); // { item, disponible }

  // ── modal de configuración de cobro (descuento/servicio/propina/pagos)
  // tipo: "total" | "parcial" | "subcuenta"
  const [modalCobro, setModalCobro] = useState(null); // { tipo, items, subcuentaId? }

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

  // ── Modificar cantidad — optimistic (sin cambios) ───────────────
  const handleModificar = (item, delta) => {
    const nuevaCantidad = num(item.cantidad) + delta;
    if (nuevaCantidad <= 0) { setAvisoMin(item.nombre); return; }

    setPedidoLocal(prev =>
      prev.map(i =>
        i.item_id === item.item_id ? { ...i, cantidad: nuevaCantidad } : i
      )
    );

    onModificarItem(mesa, item.item_id, delta);
  };

  // ── Eliminar item — optimistic (sin cambios) ─────────────────────
  const handleConfirmarEliminar = async () => {
    if (!modalPin) return;
    const { item } = modalPin;

    setPedidoLocal(prev => prev.filter(i => i.item_id !== item.item_id));
    const idx = pedidoLocal.findIndex(i => i.item_id === item.item_id);
    setIndicesSeleccionados(prev => prev.filter(i => i !== idx).map(i => i > idx ? i - 1 : i));
    setModalPin(null);

    // También la quitamos de cualquier subcuenta donde estuviera asignada
    setSubcuentas(prev => prev.map(s => ({
      ...s,
      items: s.items.filter(i => i.item_id !== item.item_id),
    })));

    await onEliminarItem(mesa, item.item_id);
  };

  // ── cuánta cantidad de un item ya está asignada a subcuentas ────
  const cantidadAsignada = (item_id) =>
    subcuentas.reduce((acc, s) => {
      const enSub = s.items.find(i => i.item_id === item_id);
      return acc + (enSub ? num(enSub.cantidad) : 0);
    }, 0);

  const cantidadDisponible = (item) =>
    Math.max(num(item.cantidad) - cantidadAsignada(item.item_id), 0);

  // ── crear subcuenta ───────────────────────────────────────────────
  const crearSubcuenta = (nombre) => {
    const id = Date.now();
    setSubcuentas(prev => [...prev, { id, nombre, items: [] }]);
    setSubcuentaActivaId(id);
    setModalNuevaSubcuenta(false);
  };

  const eliminarSubcuenta = (id) => {
    setSubcuentas(prev => prev.filter(s => s.id !== id));
    if (subcuentaActivaId === id) setSubcuentaActivaId(null);
  };

  // ── mover N unidades de un item a la subcuenta activa ────────────
  const moverASubcuenta = (item, cantidad) => {
    if (!subcuentaActivaId || cantidad <= 0) return;
    setSubcuentas(prev => prev.map(s => {
      if (s.id !== subcuentaActivaId) return s;
      const existe = s.items.find(i => i.item_id === item.item_id);
      const items = existe
        ? s.items.map(i => i.item_id === item.item_id
            ? { ...i, cantidad: num(i.cantidad) + cantidad }
            : i)
        : [...s.items, {
            item_id: item.item_id,
            nombre: item.nombre,
            precio: item.precio,
            cantidad,
          }];
      return { ...s, items };
    }));
    setModalCantidadSubcuenta(null);
  };

  // Click en "mover a subcuenta" para un item de la cuenta principal
  const iniciarMoverASubcuenta = (item) => {
    const disponible = cantidadDisponible(item);
    if (disponible <= 0 || !subcuentaActivaId) return;
    if (disponible === 1) {
      moverASubcuenta(item, 1); // solo hay 1 unidad: se mueve directo (punto 6)
    } else {
      setModalCantidadSubcuenta({ item, disponible }); // pregunta cuántas mover
    }
  };

  // Devolver unidades de una subcuenta a la cuenta principal
  const devolverASubcuenta = (subcuentaId, item_id, cantidad) => {
    setSubcuentas(prev => prev.map(s => {
      if (s.id !== subcuentaId) return s;
      const items = s.items
        .map(i => i.item_id === item_id ? { ...i, cantidad: num(i.cantidad) - cantidad } : i)
        .filter(i => num(i.cantidad) > 0);
      return { ...s, items };
    }));
  };

  const subcuentaActiva = subcuentas.find(s => s.id === subcuentaActivaId) || null;

  // Items que quedan "libres" en la cuenta principal (no asignados a ninguna subcuenta)
  const itemsCuentaPrincipal = pedidoLocal
    .map(item => ({ ...item, cantidad: cantidadDisponible(item) }))
    .filter(item => item.cantidad > 0);

  const hayAsignacionesActivas = subcuentas.some(s => s.items.length > 0);

  // ── Confirmación final de cobro (usa ModalConfigurarCobro) ──────
  const handleConfirmarCobro = async (metodoPago, resumen) => {
    if (!modalCobro) return;
    const { tipo, items, subcuentaId } = modalCobro;

    if (tipo === "total") {
      // Compatible con la firma actual onPagoTotal(metodoPago).
      // Se agrega `resumen` como 2do argumento (incluye `resumen.pagos`
      // con el desglose real por método).
      await onPagoTotal(metodoPago, resumen);
      setModoDivision(false);
      setIndicesSeleccionados([]);
      setSubcuentas([]);
    } else {
      // Compatible con la firma actual onPagoParcial(items, metodoPago).
      // Se agrega `resumen` como 3er argumento.
      await onPagoParcial(items, metodoPago, resumen);
      if (tipo === "subcuenta" && subcuentaId) {
        setSubcuentas(prev => prev.filter(s => s.id !== subcuentaId));
      }
      setIndicesSeleccionados([]);
      if (tipo === "parcial") {
        setModoDivision(false);
        onVolver();
      }
    }
    setModalCobro(null);
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
      {modalNuevaSubcuenta && (
        <ModalNuevaSubcuenta onCrear={crearSubcuenta} onCerrar={() => setModalNuevaSubcuenta(false)} />
      )}
      {modalCantidadSubcuenta && (
        <ModalCantidadSubcuenta
          item={modalCantidadSubcuenta.item}
          disponible={modalCantidadSubcuenta.disponible}
          subcuentaNombre={subcuentaActiva?.nombre || ""}
          onConfirmar={(cant) => moverASubcuenta(modalCantidadSubcuenta.item, cant)}
          onCerrar={() => setModalCantidadSubcuenta(null)}
        />
      )}
      {modalCobro && (
        <ModalConfigurarCobro
          titulo={
            modalCobro.tipo === "total" ? "💳 Cobrar cuenta principal" :
            modalCobro.tipo === "subcuenta" ? `💳 Cobrar subcuenta "${subcuentas.find(s => s.id === modalCobro.subcuentaId)?.nombre || ""}"` :
            "💳 Cobrar productos seleccionados"
          }
          items={modalCobro.items}
          onConfirmar={handleConfirmarCobro}
          onCerrar={() => setModalCobro(null)}
        />
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
              <p className="sidebar-total-valor">{money(totalMesa)}</p>
            </div>

            {/* Acciones */}
            <div className="sidebar-seccion">
              <p className="sidebar-seccion-titulo">Acciones</p>
              <button className="sidebar-accion-btn" onClick={() => setModalMover(true)}>
                🔀 Mover productos
              </button>
            </div>

            {/* Cobro normal */}
            {cajaAbierta && !modoDivision && (
              <div className="sidebar-seccion">
                <button className="btn-primario sidebar-btn-full"
                  onClick={() => setModalCobro({ tipo: "total", items: pedidoLocal })}
                  disabled={procesando}>
                  💳 Cobrar {money(totalMesa)}
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
                <p className="sidebar-seccion-titulo">División de cuenta</p>

                {/* Selector simple / subcuentas */}
                <div className="sidebar-metodos" style={{ marginBottom: "0.6rem" }}>
                  <button
                    className={`sidebar-metodo-btn ${divisionTipo === "simple" ? "activo" : ""}`}
                    onClick={() => setDivisionTipo("simple")}>
                    Selección simple
                  </button>
                  <button
                    className={`sidebar-metodo-btn ${divisionTipo === "subcuentas" ? "activo" : ""}`}
                    onClick={() => setDivisionTipo("subcuentas")}>
                    Subcuentas
                  </button>
                </div>

                {divisionTipo === "simple" ? (
                  <>
                    <p className="texto-secundario" style={{ fontSize: "0.78rem", marginBottom: "0.6rem" }}>
                      Selecciona ítems en la tabla →
                    </p>
                    {itemsSeleccionados.length > 0 && (
                      <div className="sidebar-division-resumen">
                        <span>{itemsSeleccionados.length} ítem(s)</span>
                        <strong>{money(totalSeleccionado)}</strong>
                      </div>
                    )}
                    <button className="btn-primario sidebar-btn-full"
                      onClick={() => setModalCobro({ tipo: "parcial", items: itemsSeleccionados })}
                      disabled={!itemsSeleccionados.length || procesando}>
                      Registrar pago parcial
                    </button>
                  </>
                ) : (
                  <>
                    <button className="sidebar-accion-btn" onClick={() => setModalNuevaSubcuenta(true)}>
                      ➕ Nueva subcuenta
                    </button>

                    {subcuentas.length === 0 && (
                      <p className="texto-secundario" style={{ fontSize: "0.78rem", marginTop: "0.5rem" }}>
                        Crea una subcuenta para empezar a asignar productos.
                      </p>
                    )}

                    {subcuentas.map((s) => {
                      const totalSub = s.items.reduce(
                        (acc, i) => acc + num(i.precio) * num(i.cantidad), 0
                      );
                      const activa = s.id === subcuentaActivaId;
                      return (
                        <div key={s.id}
                          className={`sidebar-division-resumen ${activa ? "fila-seleccionada" : ""}`}
                          style={{ flexDirection: "column", alignItems: "stretch", gap: "0.35rem", cursor: "pointer", marginTop: "0.5rem" }}
                          onClick={() => setSubcuentaActivaId(s.id)}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <strong>{s.nombre}{activa ? " (activa)" : ""}</strong>
                            <button className="btn-ghost" style={{ padding: "0 0.3rem" }}
                              onClick={(e) => { e.stopPropagation(); eliminarSubcuenta(s.id); }}>✕</button>
                          </div>
                          <span style={{ fontSize: "0.8rem" }}>{s.items.length} ítem(s) — {money(totalSub)}</span>
                          <button className="btn-primario"
                            style={{ fontSize: "0.8rem", padding: "0.35rem" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalCobro({ tipo: "subcuenta", items: s.items, subcuentaId: s.id });
                            }}
                            disabled={!s.items.length || procesando}>
                            Cobrar subcuenta
                          </button>
                        </div>
                      );
                    })}
                  </>
                )}

                <button className="btn-ghost sidebar-btn-full"
                  style={{ marginTop: "0.75rem" }}
                  onClick={() => {
                    setModoDivision(false);
                    setIndicesSeleccionados([]);
                    setSubcuentas([]);
                    setSubcuentaActivaId(null);
                  }}>
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

      {/* ════ PANEL DERECHO ════ */}
      <div className="detalle-panel-derecho">
        {pedidoLocal.length === 0 ? (
          <div className="detalle-vacio">
            <p className="texto-secundario">Esta mesa no tiene pedidos activos.</p>
          </div>
        ) : modoDivision && divisionTipo === "subcuentas" ? (
          // ── Vista de asignación a subcuentas ──────────────────
          <div>
            {!subcuentaActiva ? (
              <div className="tabla-wrapper">
                <p className="texto-secundario" style={{ padding: "1.1rem" }}>
                  Selecciona o crea una subcuenta en el panel izquierdo para empezar a asignar productos.
                </p>
              </div>
            ) : (
              <>
                <div className="panel-header">
                  <span className="texto-secundario">
                    Asignando productos a: <strong>{subcuentaActiva.nombre}</strong>
                  </span>
                </div>
                <div className="tabla-wrapper">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th className="th-num">Disponible</th>
                        <th className="th-num">Precio</th>
                        <th className="th-center">Asignar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsCuentaPrincipal.map((item) => (
                        <tr key={item.item_id}>
                          <td className="td-nombre">{item.nombre}</td>
                          <td className="td-num">{item.cantidad}</td>
                          <td className="td-num">{money(item.precio)}</td>
                          <td className="td-center">
                            <button className="btn-secundario" onClick={() => iniciarMoverASubcuenta(item)}>
                              → Mover
                            </button>
                          </td>
                        </tr>
                      ))}
                      {itemsCuentaPrincipal.length === 0 && (
                        <tr><td colSpan={4} className="texto-secundario" style={{ textAlign: "center" }}>
                          No quedan productos sin asignar en la cuenta principal.
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {subcuentaActiva.items.length > 0 && (
                  <>
                    <p className="panel-subtitulo">
                      Productos en "{subcuentaActiva.nombre}"
                    </p>
                    <div className="tabla-wrapper">
                      <table className="tabla">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th className="th-num">Cant.</th>
                            <th className="th-num">Subtotal</th>
                            <th className="th-center">Quitar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subcuentaActiva.items.map((item) => (
                            <tr key={item.item_id}>
                              <td className="td-nombre">{item.nombre}</td>
                              <td className="td-num">{item.cantidad}</td>
                              <td className="td-num td-monto">{money(num(item.precio) * num(item.cantidad))}</td>
                              <td className="td-center">
                                <button className="btn-ghost"
                                  onClick={() => devolverASubcuenta(subcuentaActiva.id, item.item_id, 1)}>
                                  ← Quitar 1
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        ) : (
          // ── Tabla normal (cobro / división simple) — SIN CAMBIOS ──
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr>
                  {modoDivision && divisionTipo === "simple" && <th className="th-check">✓</th>}
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
                  const enModoSimple = modoDivision && divisionTipo === "simple";

                  return (
                    <tr key={item.item_id ?? idx}
                      className={enModoSimple && seleccionado ? "fila-seleccionada" : ""}
                      onClick={enModoSimple ? () => toggleSeleccion(idx) : undefined}
                      style={enModoSimple ? { cursor: "pointer" } : {}}>

                      {enModoSimple && (
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
                      <td className="td-num">{money(precio)}</td>
                      <td className="td-num td-monto">
                        {money(precio * cantidad)}
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

// ══════════════════════════════════════════════════════════════════
// PENDIENTE / NOTAS
// ══════════════════════════════════════════════════════════════════
// 1. onPagoTotal(metodoPago, resumen) y onPagoParcial(items, metodoPago, resumen)
//    reciben `resumen` con:
//    { consumo, descuentoTipo, descuento, subtotal, servicio, propina, total, pagos }
//    `pagos` es el desglose real: [{ metodo, monto }, ...]. Mesas.jsx ya lo
//    reenvía sin cambios (solo pasa el objeto), así que llega intacto hasta
//    donde se arma el body del fetch/axios hacia /api/caja/pago — ahí hay
//    que asegurarse de mandar `pagos` en el body (ver ejemplo abajo).
//
//    Ejemplo del body que debe viajar a POST /api/caja/pago:
//    {
//      mesa_id, mesa_nombre, pedido_id, total: resumen.total,
//      metodo_pago: metodoPago,          // ya existía, sigue igual
//      items, consumo: resumen.consumo, descuento: resumen.descuento,
//      servicio: resumen.servicio, propina: resumen.propina,
//      pagos: resumen.pagos,             // 👈 desglose real
//    }
//
// 2. Subcuentas: siguen viviendo SOLO en memoria del frontend (se pierden
//    si se recarga la página antes de cobrar).
//
// 3. Caja del día (servicio/propina/descuentos/pagos mixtos acumulados):
//    ya viene calculado desde el backend (Caja.cerrar / Caja.getHistorial),
//    pero la vista que lo muestra en pantalla
//
// ══════════════════════════════════════════════════════════════════