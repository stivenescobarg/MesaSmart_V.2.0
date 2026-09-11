// frontend/src/components/admin/DetalleMesa.jsx
//
// ══════════════════════════════════════════════════════════════════
// REDISEÑO — sigue sin depender de ningún CSS propio ("detalle-mesa.css"
// no existe más). Todo el estilo sale de las clases ya existentes en
// Admin.css (las mismas que usan Egresos.jsx, Usuarios, Caja, Dashboard):
//   modal-overlay / modal-box / modal-header / modal-body / modal-footer
//   tab-selector / tab-btn, campo-grupo / campo-label / campo-input
//   chip / chip-verde / chip-amber / chip-rojo / chip-neutro / chip-metodo
//   tabla / tabla-wrapper / th-* / td-*
//   btn-primario / btn-secundario / btn-ghost / btn-peligro / btn-ancho
//   admin-card, division-panel, detalle-total, estado-vacio, alerta-*
//   dashboard-grid / metrica-card / metrica-etiqueta / metrica-valor / metrica-sub
// No se agregó ninguna clase nueva a Admin.css. Admin.css NO se toca.
//
// PASE 2 — PULIDO VISUAL (solo dentro de este archivo, vía `style`
// inline con las variables/tokens que ya existen en Admin.css; cero
// cambios de lógica de negocio, cero clases nuevas, cero archivo CSS
// nuevo):
//
// 1. Botones que antes se veían "solo como texto" (btn-ghost y
//    btn-secundario en este archivo específicamente: "Mover productos",
//    "Dividir cuenta", "Cancelar división", "Cancelar" de los modales,
//    "➕ Nueva subcuenta", "→ Mover", "← Quitar 1") ahora llevan un
//    fondo/borde permanente (no solo en :hover) usando los mismos
//    tokens de color que ya usa "Cobrar" (var(--amber-dim),
//    var(--bg-hover), etc.). Se centralizó en dos constantes de estilo
//    (ESTILO_BTN_GHOST / ESTILO_BTN_SECUNDARIO) para que quede
//    consistente en todo el componente.
// 2. Tira de MÉTRICAS: cada tarjeta ahora tiene un acento de color
//    distinto en el borde superior (ámbar / azul / morado / verde —
//    todos tokens que ya existían) para diferenciarlas de un vistazo,
//    en vez de verse todas idénticas.
// 3. Los paneles de división (selección simple y subcuentas) ahora
//    tienen sombra (var(--shadow), ya definida en Admin.css) para dar
//    más profundidad, en vez de verse planos.
// 4. La tarjeta de subcuenta activa ahora anima el glow/borde con una
//    transición suave en vez de "saltar" al seleccionarse.
//
// 2. FIX DE BUG (pase anterior) — los modales (cobrar, PIN, mover,
//    subcuentas) se renderizan con un PORTAL (`createPortal` hacia
//    `document.body`) en vez de quedar anidados dentro del árbol de
//    la página. Esto es lo que causaba que el modal se viera
//    "pegado"/recortado arriba: si algún contenedor padre (p. ej. la
//    transición entre pestañas del admin) tiene `transform`, rompe el
//    `position: fixed` de cualquier hijo no-portal y lo desalinea del
//    viewport real. Con el portal, el modal siempre cubre la pantalla
//    completa sin importar dónde esté anidado en el árbol de
//    componentes.
// 3. El modal tiene `max-height` con scroll interno propio, así que
//    aunque el contenido sea alto (el de cobrar, por ejemplo) nunca se
//    corta ni se sale del viewport — el cuadro siempre se ve completo.
// 4. Tira de MÉTRICAS arriba del detalle (reutiliza dashboard-grid /
//    metrica-card, igual que Egresos): Total mesa, Ítems, Ticket
//    promedio, y — solo cuando aplica — Subcuentas activas.
// 5. Las líneas de método de pago muestran un chip de color
//    (chip-metodo, ya definido en Admin.css para efectivo/tarjeta/
//    transferencia) para identificar cada método de un vistazo.
//
// La LÓGICA es exactamente la misma que ya tenías: optimistic update
// de cantidades, eliminar con PIN, mover productos entre mesas, pago
// total, pago parcial por selección, subcuentas, pago mixto (varias
// líneas de método+monto), descuento/servicio/propina y validación
// de caja.
//
// onPagoTotal(metodoPago, resumen) y onPagoParcial(items, metodoPago, resumen)
// siguen recibiendo `resumen` con:
//   { consumo, descuentoTipo, descuento, subtotal, servicio, propina, total, pagos }
// `resumen.pagos` es el desglose real: [{ metodo_pago, monto }, ...]
// ══════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const METODOS_PAGO = ["Efectivo", "Tarjeta", "Transferencia"];
const ICONO_METODO = { Efectivo: "💵", Tarjeta: "💳", Transferencia: "📲" };
const CLASE_METODO = { Efectivo: "chip-efectivo", Tarjeta: "chip-tarjeta", Transferencia: "chip-transferencia" };

const PIN_ELIMINAR = "1234";

const DESCUENTOS_PRESET = [10, 20, 30, 50];

const num = (v) => parseFloat(v) || 0;
const money = (v) => `$${Math.round(num(v)).toLocaleString("es-CO")}`;

// Tolerancia para considerar que el desglose de pagos "cuadra" con el
// total (evita falsos negativos por errores de coma flotante).
const TOLERANCIA_CUADRE = 1;

// ══════════════════════════════════════════════════════════════════
// ESTILOS INLINE REUTILIZABLES (pase 2 — solo estética, no lógica)
// Se centralizan acá para no repetir el mismo objeto en cada botón y
// para que sea fácil de ajustar en un solo lugar. Usan únicamente
// variables/tokens que YA existen en Admin.css — no se inventa ningún
// color nuevo.
// ══════════════════════════════════════════════════════════════════
const ESTILO_BTN_GHOST = {
  background: "var(--bg-hover)",
  borderColor: "var(--border-light)",
  color: "var(--text-1)",
};

const ESTILO_BTN_SECUNDARIO = {
  background: "var(--amber-dim)",
};

const ESTILO_PANEL_ELEVADO = {
  boxShadow: "var(--shadow)",
};

// ══════════════════════════════════════════════════════════════════
// LÓGICA CENTRALIZADA DE CÁLCULO
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

// ══════════════════════════════════════════════════════════════════
// Modal genérico — renderizado con un PORTAL hacia document.body para
// que SIEMPRE cubra el viewport completo sin importar en qué parte
// del árbol de componentes esté montado (ver nota del encabezado).
// Incluye scroll interno propio para que el contenido nunca se corte.
// ══════════════════════════════════════════════════════════════════
const Modal = ({ titulo, peligro, ancho, footer, children, onCerrar }) => {
  const contenido = (
    <div className="modal-overlay" onClick={onCerrar}>
      <div
        className="modal-box"
        style={{
          maxWidth: ancho || "420px",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`modal-header ${peligro ? "modal-header-peligro" : "modal-header-normal"}`}>
          <h4 className="modal-titulo">{titulo}</h4>
          <button className="modal-cerrar" onClick={onCerrar}>✕</button>
        </div>
        <div className="modal-body" style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          {children}
        </div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );

  return createPortal(contenido, document.body);
};

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
    <Modal
      titulo="🔐 Eliminar producto"
      peligro
      onCerrar={onCerrar}
      footer={
        <>
          <button className="btn-ghost" style={ESTILO_BTN_GHOST} onClick={onCerrar}>Cancelar</button>
          <button className="btn-peligro" onClick={handleConfirmar} disabled={!pin}>
            Eliminar
          </button>
        </>
      }
    >
      <p className="texto-secundario" style={{ marginBottom: "0.75rem" }}>
        Estás por eliminar <strong>{item?.nombre}</strong>.
        Ingresa el PIN de administrador para confirmar.
      </p>
      <input
        className="campo-input"
        type="password"
        inputMode="numeric"
        maxLength={6}
        placeholder="●●●●"
        value={pin}
        autoFocus
        style={{ textAlign: "center", letterSpacing: "0.5em", fontFamily: "'DM Mono', monospace" }}
        onChange={(e) => { setPin(e.target.value); setError(""); }}
        onKeyDown={(e) => e.key === "Enter" && handleConfirmar()}
      />
      {error && <p className="alerta-error" style={{ marginTop: "0.75rem" }}>{error}</p>}
    </Modal>
  );
};

// ── Modal mover items entre MESAS ────────────────────────────────
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
    <Modal
      titulo="🔀 Mover productos a otra mesa"
      ancho="480px"
      onCerrar={onCerrar}
      footer={
        <>
          <button className="btn-ghost" style={ESTILO_BTN_GHOST} onClick={onCerrar}>Cancelar</button>
          <button
            className="btn-primario"
            onClick={handleMover}
            disabled={!itemsSeleccionados.length || !mesaDestinoId || procesando}
          >
            {procesando ? "Moviendo..." : `Mover (${itemsSeleccionados.length})`}
          </button>
        </>
      }
    >
      <p className="texto-secundario" style={{ marginBottom: "0.6rem" }}>
        Selecciona los productos que deseas mover:
      </p>

      <div className="tabla-wrapper">
        <table className="tabla">
          <thead>
            <tr>
              <th className="th-check">
                <input
                  type="checkbox"
                  checked={indicesSeleccionados.length === pedido.length && pedido.length > 0}
                  onChange={toggleTodos}
                />
              </th>
              <th>Producto</th>
              <th className="th-num">Cant.</th>
            </tr>
          </thead>
          <tbody>
            {pedido.map((item, idx) => (
              <tr
                key={idx}
                className={indicesSeleccionados.includes(idx) ? "fila-seleccionada" : ""}
                style={{ cursor: "pointer" }}
                onClick={() => toggleItem(idx)}
              >
                <td className="td-center">
                  <input
                    type="checkbox"
                    checked={indicesSeleccionados.includes(idx)}
                    onChange={() => toggleItem(idx)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="td-nombre">{item.nombre}</td>
                <td className="td-num">×{num(item.cantidad)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="campo-grupo" style={{ marginTop: "1rem" }}>
        <label className="campo-label">Mesa de destino</label>
        <select
          className="campo-input"
          value={mesaDestinoId}
          onChange={(e) => setMesaDestinoId(e.target.value)}
        >
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
      </div>
    </Modal>
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
    <Modal
      titulo="➕ Nueva subcuenta"
      onCerrar={onCerrar}
      footer={
        <>
          <button className="btn-ghost" style={ESTILO_BTN_GHOST} onClick={onCerrar}>Cancelar</button>
          <button className="btn-primario" onClick={confirmar} disabled={!nombre.trim()}>
            Crear
          </button>
        </>
      }
    >
      <div className="campo-grupo" style={{ marginBottom: 0 }}>
        <label className="campo-label">Nombre de la subcuenta</label>
        <input
          className="campo-input"
          type="text"
          maxLength={30}
          placeholder='Ej: "Juan", "Puesto 2"'
          value={nombre}
          autoFocus
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && confirmar()}
        />
      </div>
    </Modal>
  );
};

// ── Modal para decidir CUÁNTAS unidades mover a una subcuenta ────
const ModalCantidadSubcuenta = ({ item, disponible, subcuentaNombre, onConfirmar, onCerrar }) => {
  const [cantidad, setCantidad] = useState(1);

  const clamp = (v) => Math.min(Math.max(parseInt(v, 10) || 1, 1), disponible);

  const confirmar = () => onConfirmar(clamp(cantidad));

  return (
    <Modal
      titulo="🔢 ¿Cuántas unidades mover?"
      onCerrar={onCerrar}
      footer={
        <>
          <button className="btn-ghost" style={ESTILO_BTN_GHOST} onClick={onCerrar}>Cancelar</button>
          <button className="btn-primario" onClick={confirmar}>Mover</button>
        </>
      }
    >
      <p className="texto-secundario" style={{ marginBottom: "0.5rem" }}>
        <strong>{item.nombre}</strong> — disponible en cuenta principal: <strong>{disponible}</strong>
      </p>
      <p className="texto-secundario" style={{ marginBottom: "0.75rem", fontSize: "0.8rem" }}>
        Se moverán a la subcuenta "{subcuentaNombre}"
      </p>
      <div className="controles-cantidad" style={{ justifyContent: "center" }}>
        <button className="btn-cantidad" onClick={() => setCantidad((c) => clamp(c - 1))}>−</button>
        <input
          className="campo-input"
          type="number"
          min={1}
          max={disponible}
          value={cantidad}
          onChange={(e) => setCantidad(clamp(e.target.value))}
          style={{ width: "3.75rem", textAlign: "center", padding: "0.35rem" }}
        />
        <button className="btn-cantidad" onClick={() => setCantidad((c) => clamp(c + 1))}>+</button>
      </div>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════
// Modal de configuración de cobro (descuento/servicio/propina/
// PAGO MIXTO). Se usa para el cobro total de la mesa, para pago
// parcial (selección simple) y para el cobro de una subcuenta.
//
// El pago se arma como una LISTA de líneas { id, metodo, monto }.
// Por defecto arranca con una sola línea = el total completo. El
// usuario puede agregar más líneas para dividir el cobro. No se deja
// confirmar mientras la suma de las líneas no cuadre con el total.
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
    <Modal
      titulo={titulo || "💳 Configurar cobro"}
      ancho="460px"
      onCerrar={onCerrar}
      footer={
        <>
          <button className="btn-ghost" style={ESTILO_BTN_GHOST} onClick={onCerrar}>Cancelar</button>
          <button className="btn-primario" onClick={handleConfirmar} disabled={procesando || !cuadra}>
            {procesando ? "Procesando..." : `Confirmar pago ${money(resumen.total)}`}
          </button>
        </>
      }
    >
      {/* Descuento */}
      <div className="campo-grupo">
        <label className="campo-label">Descuento</label>
        <div className="metodo-selector">
          <button
            className={`btn-metodo ${descuentoTipo === null ? "activo" : ""}`}
            onClick={() => { setDescuentoTipo(null); setDescuentoMonto(""); }}
          >
            Sin descuento
          </button>
          {DESCUENTOS_PRESET.map((p) => (
            <button
              key={p}
              className={`btn-metodo ${descuentoTipo === String(p) ? "activo" : ""}`}
              onClick={() => setDescuentoTipo(String(p))}
            >
              {p}%
            </button>
          ))}
          <button
            className={`btn-metodo ${descuentoTipo === "personalizado" ? "activo" : ""}`}
            onClick={() => setDescuentoTipo("personalizado")}
          >
            Monto
          </button>
        </div>
        {descuentoTipo === "personalizado" && (
          <input
            className="campo-input"
            type="number"
            min={0}
            max={resumen.consumo}
            placeholder="Valor del descuento"
            style={{ marginTop: "0.6rem" }}
            value={descuentoMonto}
            onChange={(e) => setDescuentoMonto(Math.max(0, num(e.target.value)))}
          />
        )}
      </div>

      <hr />

      {/* Servicio 10% */}
      <div className="campo-grupo">
        <label className="campo-label">Servicio del 10% (opcional)</label>
        <label
          className="texto-secundario"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={servicioActivo}
            onChange={() => setServicioActivo((s) => !s)}
            style={{ accentColor: "var(--amber)", width: "1rem", height: "1rem" }}
          />
          El cliente acepta el servicio del 10%
        </label>
      </div>

      {/* Propina */}
      <div className="campo-grupo">
        <label className="campo-label">Propina (voluntaria)</label>
        <input
          className="campo-input"
          type="number"
          min={0}
          placeholder="$ 0"
          value={propina}
          onChange={(e) => setPropina(Math.max(0, num(e.target.value)))}
        />
      </div>

      <hr />

      {/* Métodos de pago — una o varias líneas */}
      <div className="campo-grupo">
        <label className="campo-label">Métodos de pago</label>
        {pagos.map((p) => (
          <div key={p.id} style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
            <span className={`chip chip-metodo ${CLASE_METODO[p.metodo]}`} style={{ flexShrink: 0 }}>
              {ICONO_METODO[p.metodo]}
            </span>
            <select
              className="campo-input"
              style={{ maxWidth: "150px" }}
              value={p.metodo}
              onChange={(e) => actualizarPago(p.id, "metodo", e.target.value)}
            >
              {METODOS_PAGO.map((m) => (
                <option key={m} value={m}>{ICONO_METODO[m]} {m}</option>
              ))}
            </select>
            <input
              className="campo-input"
              type="number"
              min={0}
              placeholder="$ 0"
              value={p.monto}
              onChange={(e) => actualizarPago(p.id, "monto", e.target.value)}
            />
            {pagos.length > 1 && (
              <button
                className="btn-ghost"
                style={{ ...ESTILO_BTN_GHOST, padding: "0 0.6rem" }}
                onClick={() => quitarLineaPago(p.id)}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          className="btn-ghost"
          style={{ ...ESTILO_BTN_GHOST, fontSize: "0.8rem" }}
          onClick={agregarLineaPago}
        >
          + Dividir entre otro método
        </button>

        {!cuadra && (
          <p className="alerta-error" style={{ marginTop: "0.6rem" }}>
            {diferencia > 0
              ? `Falta asignar ${money(diferencia)} para completar el total.`
              : `Los montos suman ${money(Math.abs(diferencia))} de más.`}
          </p>
        )}
      </div>

      {/* Resumen en tiempo real */}
      <div className="admin-card" style={{ padding: "0.9rem 1rem", borderTop: "2px solid var(--amber)" }}>
        <table className="tabla" style={{ fontSize: "0.85rem" }}>
          <tbody>
            <tr><td>Consumo</td><td className="td-num">{money(resumen.consumo)}</td></tr>
            {resumen.descuento > 0 && (
              <tr>
                <td style={{ color: "var(--red)" }}>Descuento</td>
                <td className="td-num" style={{ color: "var(--red)" }}>-{money(resumen.descuento)}</td>
              </tr>
            )}
            <tr><td>Subtotal</td><td className="td-num">{money(resumen.subtotal)}</td></tr>
            <tr><td>Servicio 10%</td><td className="td-num">{money(resumen.servicio)}</td></tr>
            <tr><td>Propina</td><td className="td-num">{money(resumen.propina)}</td></tr>
            <tr>
              <td style={{ fontWeight: 700 }}>Total</td>
              <td className="td-num td-monto" style={{ fontWeight: 700, fontSize: "1rem" }}>{money(resumen.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
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

  // ── modo de división ("simple" = selección + pago parcial; "subcuentas")
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

  // ── Métricas — se calculan de datos que YA tenemos, sin fetch extra ──
  const totalMesa = pedidoLocal.reduce(
    (acc, i) => acc + num(i.precio) * num(i.cantidad), 0
  );
  const totalItems = pedidoLocal.reduce((acc, i) => acc + num(i.cantidad), 0);
  const ticketPromedio = totalItems > 0 ? totalMesa / totalItems : 0;
  const subcuentasActivas = subcuentas.length;

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
      moverASubcuenta(item, 1); // solo hay 1 unidad: se mueve directo
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
    <div className="seccion-container">

      {/* ── Modales (renderizados con portal, ver Modal arriba) ── */}
      {modalPin && (
        <ModalPin item={modalPin.item} onConfirmar={handleConfirmarEliminar}
          onCerrar={() => setModalPin(null)} />
      )}
      {modalMover && (
        <ModalMoverItems pedido={pedidoLocal} mesas={mesas || []} mesaActual={mesa}
          onMover={onMoverItems} onCerrar={() => setModalMover(false)} />
      )}
      {avisoMin && (
        <Modal
          titulo="⚠️ Cantidad mínima"
          onCerrar={() => setAvisoMin(null)}
          footer={<button className="btn-primario" onClick={() => setAvisoMin(null)}>Entendido</button>}
        >
          <p className="texto-secundario">
            <strong>{avisoMin}</strong> no puede quedar en 0.
            Usa el botón <strong>🗑</strong> si deseas quitarlo del pedido.
          </p>
        </Modal>
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

      {/* ════ ENCABEZADO ════ */}
      <div className="seccion-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button className="btn-ghost btn-back" style={ESTILO_BTN_GHOST} onClick={onVolver}>← Volver</button>
          <h2 className="seccion-titulo">{mesa.nombre || `Mesa ${mesa.id}`}</h2>
          <span className={`chip ${mesa.ocupada ? "chip-amber" : "chip-verde"}`}>
            {mesa.ocupada ? "Ocupada" : "Libre"}
          </span>
        </div>
      </div>

      {pedidoLocal.length === 0 ? (
        <div className="admin-card">
          <div className="estado-vacio">
            <p className="texto-secundario">Esta mesa no tiene pedidos activos.</p>
          </div>
        </div>
      ) : (
        <>
          {/* ════ TIRA DE MÉTRICAS ════ */}
          {/* Cada tarjeta lleva un acento de color distinto en el borde
              superior (mismos tokens que ya existen en Admin.css) para
              diferenciarlas de un vistazo en vez de verse todas iguales. */}
          <div className="dashboard-grid">
            <div className="admin-card metrica-card" style={{ borderTop: "3px solid var(--amber)" }}>
              <p className="metrica-etiqueta">Total mesa</p>
              <p className="metrica-valor" style={{ color: "var(--amber)" }}>{money(totalMesa)}</p>
            </div>
            <div className="admin-card metrica-card" style={{ borderTop: "3px solid var(--blue)" }}>
              <p className="metrica-etiqueta">Ítems</p>
              <p className="metrica-valor">{totalItems}</p>
              <p className="metrica-sub">{pedidoLocal.length} producto(s) distintos</p>
            </div>
            <div className="admin-card metrica-card" style={{ borderTop: "3px solid var(--morado)" }}>
              <p className="metrica-etiqueta">Ticket promedio</p>
              <p className="metrica-valor">{money(ticketPromedio)}</p>
              <p className="metrica-sub">por ítem</p>
            </div>
            {modoDivision && divisionTipo === "subcuentas" && (
              <div className="admin-card metrica-card" style={{ borderTop: "3px solid var(--green)" }}>
                <p className="metrica-etiqueta">Subcuentas activas</p>
                <p className="metrica-valor" style={{ color: "var(--green)" }}>{subcuentasActivas}</p>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>

            {/* ════ SIDEBAR IZQUIERDO ════ */}
            <aside
              className="admin-card"
              style={{ flex: "1 1 300px", maxWidth: "340px", borderTop: "3px solid var(--amber)" }}
            >
              {/* Acciones */}
              <div className="campo-grupo">
                <label className="campo-label">Acciones</label>
                <button
                  className="btn-ghost btn-ancho"
                  style={ESTILO_BTN_GHOST}
                  onClick={() => setModalMover(true)}
                >
                  🔀 Mover productos
                </button>
              </div>

              {/* Cobro normal */}
              {cajaAbierta && !modoDivision && (
                <>
                  <hr />
                  <div className="campo-grupo" style={{ marginBottom: 0 }}>
                    <button
                      className="btn-primario btn-ancho"
                      onClick={() => setModalCobro({ tipo: "total", items: pedidoLocal })}
                      disabled={procesando}
                    >
                      💳 Cobrar {money(totalMesa)}
                    </button>
                    <button
                      className="btn-secundario btn-ancho"
                      style={{ ...ESTILO_BTN_SECUNDARIO, marginTop: "0.5rem" }}
                      onClick={() => { setModoDivision(true); setIndicesSeleccionados([]); }}
                    >
                      ➗ Dividir cuenta
                    </button>
                  </div>
                </>
              )}

              {/* Modo división */}
              {cajaAbierta && modoDivision && (
                <>
                  <hr />
                  <div className="campo-grupo" style={{ marginBottom: 0 }}>
                    <label className="campo-label">División de cuenta</label>

                    {/* Selector simple / subcuentas */}
                    <div className="tab-selector" style={{ marginBottom: "0.75rem", width: "100%" }}>
                      <button
                        className={`tab-btn ${divisionTipo === "simple" ? "activo" : ""}`}
                        style={{ flex: 1 }}
                        onClick={() => setDivisionTipo("simple")}
                      >
                        Selección simple
                      </button>
                      <button
                        className={`tab-btn ${divisionTipo === "subcuentas" ? "activo" : ""}`}
                        style={{ flex: 1 }}
                        onClick={() => setDivisionTipo("subcuentas")}
                      >
                        Subcuentas
                      </button>
                    </div>

                    {divisionTipo === "simple" ? (
                      <div className="division-panel" style={ESTILO_PANEL_ELEVADO}>
                        <p className="division-instruccion">
                          Selecciona ítems en la tabla de la derecha →
                        </p>
                        {itemsSeleccionados.length > 0 && (
                          <div className="division-resumen">
                            <span>{itemsSeleccionados.length} ítem(s)</span>
                            <strong>{money(totalSeleccionado)}</strong>
                          </div>
                        )}
                        <button
                          className="btn-primario btn-ancho"
                          onClick={() => setModalCobro({ tipo: "parcial", items: itemsSeleccionados })}
                          disabled={!itemsSeleccionados.length || procesando}
                        >
                          Registrar pago parcial
                        </button>
                      </div>
                    ) : (
                      <div className="division-panel" style={ESTILO_PANEL_ELEVADO}>
                        <button
                          className="btn-secundario btn-ancho"
                          style={ESTILO_BTN_SECUNDARIO}
                          onClick={() => setModalNuevaSubcuenta(true)}
                        >
                          ➕ Nueva subcuenta
                        </button>

                        {subcuentas.length === 0 && (
                          <p className="texto-secundario" style={{ fontSize: "0.8rem", marginTop: "0.6rem" }}>
                            Crea una subcuenta para empezar a asignar productos.
                          </p>
                        )}

                        {subcuentas.map((s) => {
                          const totalSub = s.items.reduce(
                            (acc, i) => acc + num(i.precio) * num(i.cantidad), 0
                          );
                          const activa = s.id === subcuentaActivaId;
                          return (
                            <div
                              key={s.id}
                              className="admin-card"
                              style={{
                                marginTop: "0.6rem",
                                padding: "0.75rem",
                                cursor: "pointer",
                                borderColor: activa ? "var(--amber-border)" : undefined,
                                boxShadow: activa ? "var(--amber-glow)" : undefined,
                                transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                              }}
                              onClick={() => setSubcuentaActivaId(s.id)}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <strong style={{ fontSize: "0.85rem" }}>
                                  {s.nombre}{activa ? " (activa)" : ""}
                                </strong>
                                <button
                                  className="btn-ghost"
                                  style={{ ...ESTILO_BTN_GHOST, padding: "0 0.4rem" }}
                                  onClick={(e) => { e.stopPropagation(); eliminarSubcuenta(s.id); }}
                                >✕</button>
                              </div>
                              <p className="texto-secundario" style={{ fontSize: "0.78rem", margin: "0.3rem 0 0.5rem" }}>
                                {s.items.length} ítem(s) — <span className="td-monto">{money(totalSub)}</span>
                              </p>
                              <button
                                className="btn-primario btn-ancho"
                                style={{ fontSize: "0.8rem", padding: "0.4rem" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setModalCobro({ tipo: "subcuenta", items: s.items, subcuentaId: s.id });
                                }}
                                disabled={!s.items.length || procesando}
                              >
                                Cobrar subcuenta
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <button
                      className="btn-ghost btn-ancho"
                      style={{ ...ESTILO_BTN_GHOST, marginTop: "0.75rem" }}
                      onClick={() => {
                        setModoDivision(false);
                        setIndicesSeleccionados([]);
                        setSubcuentas([]);
                        setSubcuentaActivaId(null);
                      }}
                    >
                      Cancelar división
                    </button>
                  </div>
                </>
              )}

              {!cajaAbierta && (
                <>
                  <hr />
                  <p className="advertencia-caja" style={{ padding: 0, borderTop: "none" }}>
                    ⚠️ Abre la caja para registrar pagos.
                  </p>
                </>
              )}
            </aside>

            {/* ════ PANEL DERECHO ════ */}
            <div style={{ flex: "3 1 480px", minWidth: 0 }}>
              {modoDivision && divisionTipo === "subcuentas" ? (
                // ── Vista de asignación a subcuentas ──────────────────
                !subcuentaActiva ? (
                  <div className="admin-card">
                    <p className="texto-secundario">
                      Selecciona o crea una subcuenta en el panel izquierdo para empezar a asignar productos.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="subtitulo">
                      Asignando productos a: {subcuentaActiva.nombre}
                    </p>
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
                                <button
                                  className="btn-secundario"
                                  style={ESTILO_BTN_SECUNDARIO}
                                  onClick={() => iniciarMoverASubcuenta(item)}
                                >
                                  → Mover
                                </button>
                              </td>
                            </tr>
                          ))}
                          {itemsCuentaPrincipal.length === 0 && (
                            <tr>
                              <td colSpan={4} className="texto-secundario" style={{ textAlign: "center" }}>
                                No quedan productos sin asignar en la cuenta principal.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {subcuentaActiva.items.length > 0 && (
                      <>
                        <p className="subtitulo" style={{ marginTop: "1.25rem" }}>
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
                                    <button
                                      className="btn-ghost"
                                      style={ESTILO_BTN_GHOST}
                                      onClick={() => devolverASubcuenta(subcuentaActiva.id, item.item_id, 1)}
                                    >
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
                )
              ) : (
                // ── Tabla normal (cobro / división simple) ──
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
                          <tr
                            key={item.item_id ?? idx}
                            className={enModoSimple && seleccionado ? "fila-seleccionada" : ""}
                            onClick={enModoSimple ? () => toggleSeleccion(idx) : undefined}
                            style={enModoSimple ? { cursor: "pointer" } : {}}
                          >
                            {enModoSimple && (
                              <td className="td-center">
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
                            <td className="td-num">{money(precio)}</td>
                            <td className="td-num td-monto">{money(precio * cantidad)}</td>

                            {!modoDivision && (
                              <td className="td-center">
                                <div className="controles-cantidad">
                                  <button className="btn-cantidad" onClick={() => handleModificar(item, -1)}>−</button>
                                  <span className="cantidad-valor">{cantidad}</span>
                                  <button className="btn-cantidad" onClick={() => handleModificar(item, 1)}>+</button>
                                </div>
                              </td>
                            )}

                            {!modoDivision && (
                              <td className="td-center">
                                <button
                                  className="btn-eliminar"
                                  title="Eliminar (requiere PIN)"
                                  onClick={() => setModalPin({ item })}
                                >
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
        </>
      )}
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
//    `pagos` es el desglose real: [{ metodo_pago, monto }, ...]. Asegúrate de
//    mandar `pagos` en el body de POST /api/caja/pago:
//
//    {
//      mesa_id, mesa_nombre, pedido_id, total: resumen.total,
//      metodo_pago: metodoPago,          // sigue igual
//      items, consumo: resumen.consumo, descuento: resumen.descuento,
//      servicio: resumen.servicio, propina: resumen.propina,
//      pagos: resumen.pagos,             // 👈 desglose real
//    }
//
// 2. Subcuentas: siguen viviendo SOLO en memoria del frontend (se pierden
//    si se recarga la página antes de cobrar).
//
// 3. Modales: usan `createPortal(document.body)`, así que siempre cubren
//    el viewport completo sin importar dónde esté montado el componente
//    en el árbol (evita el bug de "modal pegado arriba" por `transform`
//    en algún contenedor padre).
//
// 4. PASE 2 (este archivo): los ajustes de color de botones/tarjetas se
//    hicieron con `style` inline usando variables ya definidas en
//    Admin.css (var(--amber), var(--amber-dim), var(--bg-hover), etc.).
//    Admin.css NO fue modificado. Si más adelante prefieren mover estos
//    estilos a clases reales en Admin.css para reutilizarlos en otros
//    componentes, las constantes ESTILO_BTN_GHOST / ESTILO_BTN_SECUNDARIO
//    / ESTILO_PANEL_ELEVADO de arriba son el punto de partida directo.
//
// 5. Este archivo sigue sin importar ningún CSS propio — reutiliza por
//    completo las clases de Admin.css (igual que Egresos.jsx).
// ══════════════════════════════════════════════════════════════════