// frontend/src/components/admin/VentaDetalleModal.jsx
//
// PASE DE DISEÑO (solo estilo, cero cambios de lógica):
// 1. FIX real del "aviso feo": este archivo usaba la clase
//    `texto-error`, que NO existe en Admin.css (solo existe
//    `alerta-error`, ya definida con fondo/borde rojo). Por eso el
//    aviso de "no coincide con los pagos" se veía como texto plano sin
//    ningún estilo. Se reemplazó por `alerta-error` en los 2 lugares
//    donde aparecía.
// 2. El aviso "Esta venta ya fue corregida antes" pasó de un bloque
//    sin estilo a usar `alerta-info` (misma clase que ya usa Mesas.jsx
//    para "la caja está cerrada"), para que se vea como un aviso real.
// 3. Layout más ancho (820px) y en 2 columnas cuando hay espacio:
//    Productos | Métodos de pago. Descuento/Servicio/Propina se quedan
//    en fila de 3 como antes. El resumen de totales ahora es una
//    tarjeta con tabla (igual que el resumen del modal de "Cobrar"),
//    en vez de 2 líneas de texto sueltas.
// 4. Toda la lógica (cálculo de totalEsperado, pagosCuadran, guardar,
//    validaciones) es EXACTAMENTE la misma que ya tenían.
// ══════════════════════════════════════════════════════════════════

import { useState } from "react";
import Modal from "./Modal";
import { cajaService } from "../../services/cajaService";

const COP = (n) => `$${(parseFloat(n) || 0).toLocaleString("es-CO")}`;

const VentaDetalleModal = ({ venta, onClose, onGuardado }) => {
  const [items, setItems] = useState(
    venta.items.map(it => ({ ...it }))
  );
  const [pagos, setPagos] = useState(
    venta.pagos.map(p => ({ ...p }))
  );
  const [descuento, setDescuento] = useState(venta.descuento || 0);
  const [servicio, setServicio]   = useState(venta.servicio || 0);
  const [propina, setPropina]     = useState(venta.propina || 0);
  const [motivo, setMotivo]       = useState("");
  const [pin, setPin]             = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState("");

  const totalPagos = pagos.reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0);

  // Total esperado según la cuenta real (productos - descuento + servicio + propina).
  // Debe coincidir con totalPagos o el backend rechazará el guardado — esto solo
  // le avisa al usuario ANTES de intentar guardar.
  const consumoActual = items.reduce(
    (acc, it) => acc + (parseFloat(it.precio) || 0) * (parseFloat(it.cantidad) || 0), 0
  );
  const totalEsperado = consumoActual - (parseFloat(descuento) || 0) + (parseFloat(servicio) || 0) + (parseFloat(propina) || 0);
  const pagosCuadran = Math.abs(totalPagos - totalEsperado) <= 1;

  const actualizarItem = (i, campo, valor) => {
    const copia = [...items];
    copia[i] = { ...copia[i], [campo]: valor };
    setItems(copia);
  };

  const eliminarItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const agregarItem = () =>
    setItems([...items, { nombre: "", cantidad: 1, precio: 0 }]);

  const actualizarPago = (i, campo, valor) => {
    const copia = [...pagos];
    copia[i] = { ...copia[i], [campo]: valor };
    setPagos(copia);
  };

  const eliminarPago = (i) => setPagos(pagos.filter((_, idx) => idx !== i));

  const agregarPago = () =>
    setPagos([...pagos, { metodo_pago: "efectivo", monto: 0 }]);

  const handleGuardar = async () => {
    setError("");

    if (!motivo.trim()) return setError("El motivo de la edición es obligatorio.");
    if (!pin.trim()) return setError("Ingresa el PIN de seguridad.");
    if (!pagos.length) return setError("Debe haber al menos un método de pago.");
    if (!pagosCuadran) {
      return setError(
        `Los pagos (${COP(totalPagos)}) no cuadran con el total de la cuenta (${COP(totalEsperado)}). Ajusta los montos.`
      );
    }

    setGuardando(true);
    try {
      await cajaService.editarVenta(venta.id, {
        pin,
        motivo,
        items: items.map(it => ({
          nombre: it.nombre,
          cantidad: parseFloat(it.cantidad) || 0,
          precio: parseFloat(it.precio) || 0,
        })),
        pagos: pagos.map(p => ({
          metodo_pago: p.metodo_pago,
          monto: parseFloat(p.monto) || 0,
        })),
        descuento: parseFloat(descuento) || 0,
        servicio: parseFloat(servicio) || 0,
        propina: parseFloat(propina) || 0,
      });
      onGuardado?.();
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || "No se pudo guardar la corrección.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto={true}
      titulo={`Editar venta — Mesa ${venta.mesa_nombre || "—"}`}
      onCancelar={onClose}
      labelCancelar="Cancelar"
      ancho="820px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {venta.ediciones?.length > 0 && (
          <div className="alerta-info" style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <strong style={{ fontSize: "0.82rem" }}>⚠️ Esta venta ya fue corregida antes</strong>
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {venta.ediciones.map((e, i) => (
                <li key={i} style={{ fontSize: "0.78rem", opacity: 0.9 }}>
                  {new Date(e.editado_en).toLocaleString("es-CO")} — {e.editado_por}: "{e.motivo}"
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Productos y Métodos de pago lado a lado cuando hay espacio;
            se apilan solos en pantallas angostas (auto-fit, sin media queries) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>

          <div className="campo-grupo" style={{ marginBottom: 0 }}>
            <label className="campo-label">Productos</label>

            {/* grid con columnas de ancho FIJO (nombre flexible, cantidad y
                precio fijos, botón fijo) para que todas las filas queden
                perfectamente alineadas sin importar cuántas haya.
                El precio se ensanchó (antes 100px se veía cortado por las
                flechitas del input number) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {items.map((it, i) => (
                <div
                  key={i}
                  style={{ display: "grid", gridTemplateColumns: "1fr 60px 135px auto", gap: "0.5rem", alignItems: "center" }}
                >
                  <input
                    className="campo-input"
                    style={{ width: "100%", minWidth: 0 }}
                    value={it.nombre}
                    onChange={(e) => actualizarItem(i, "nombre", e.target.value)}
                    placeholder="Producto"
                  />
                  <input
                    className="campo-input"
                    style={{ width: "100%", textAlign: "center", padding: "0.6rem 0.4rem" }}
                    type="number" min="0"
                    value={it.cantidad}
                    onChange={(e) => actualizarItem(i, "cantidad", e.target.value)}
                  />
                  <input
                    className="campo-input"
                    style={{ width: "100%", paddingRight: "1.6rem" }}
                    type="number" min="0"
                    value={it.precio}
                    onChange={(e) => actualizarItem(i, "precio", e.target.value)}
                  />
                  <button className="btn-ghost" style={{ padding: "0 0.6rem" }} onClick={() => eliminarItem(i)}>✕</button>
                </div>
              ))}
            </div>

            <button className="btn-secundario" onClick={agregarItem} style={{ marginTop: "0.6rem" }}>
              + Agregar producto
            </button>
          </div>

          <div className="campo-grupo" style={{ marginBottom: 0 }}>
            <label className="campo-label">Métodos de pago</label>

            {/* misma corrección de alineación: grid con columnas fijas en vez
                de flex, así el select y el monto quedan en la misma
                posición en todas las filas sin importar cuántas agregues */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {pagos.map((p, i) => (
                <div
                  key={i}
                  style={{ display: "grid", gridTemplateColumns: "1fr 135px auto", gap: "0.5rem", alignItems: "center" }}
                >
                  <select
                    className="campo-input"
                    style={{ width: "100%", minWidth: 0 }}
                    value={p.metodo_pago}
                    onChange={(e) => actualizarPago(i, "metodo_pago", e.target.value)}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                  <input
                    className="campo-input"
                    style={{ width: "100%", paddingRight: "1.6rem" }}
                    type="number" min="0"
                    value={p.monto}
                    onChange={(e) => actualizarPago(i, "monto", e.target.value)}
                  />
                  <button className="btn-ghost" style={{ padding: "0 0.6rem" }} onClick={() => eliminarPago(i)}>✕</button>
                </div>
              ))}
            </div>

            <button className="btn-secundario" onClick={agregarPago} style={{ marginTop: "0.6rem" }}>
              + Agregar método
            </button>
          </div>
        </div>

        {/* Descuento / Servicio / Propina */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
          <div className="campo-grupo" style={{ marginBottom: 0 }}>
            <label className="campo-label">Descuento</label>
            <input className="campo-input" type="number" value={descuento} onChange={e => setDescuento(e.target.value)} />
          </div>
          <div className="campo-grupo" style={{ marginBottom: 0 }}>
            <label className="campo-label">Servicio</label>
            <input className="campo-input" type="number" value={servicio} onChange={e => setServicio(e.target.value)} />
          </div>
          <div className="campo-grupo" style={{ marginBottom: 0 }}>
            <label className="campo-label">Propina</label>
            <input className="campo-input" type="number" value={propina} onChange={e => setPropina(e.target.value)} />
          </div>
        </div>

        {/* Resumen de totales — misma info que antes, ahora en tarjeta */}
        <div className="admin-card" style={{ padding: "0.9rem 1.1rem", borderTop: "2px solid var(--amber)" }}>
          <table className="tabla" style={{ fontSize: "0.85rem" }}>
            <tbody>
              <tr>
                <td>Total con estos pagos</td>
                <td className="td-num td-monto">{COP(totalPagos)}</td>
              </tr>
              <tr>
                <td>
                  Total de la cuenta
                  <br />
                  <span className="texto-muted" style={{ fontSize: "0.7rem" }}>
                    productos − descuento + servicio + propina
                  </span>
                </td>
                <td className="td-num" style={{ fontWeight: 700 }}>{COP(totalEsperado)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* FIX: antes era <p className="texto-error"> (clase inexistente,
            se veía sin estilo). Ahora usa alerta-error (roja, ya definida
            en Admin.css) y solo aparece cuando de verdad no cuadra. */}
        {!pagosCuadran && (
          <div className="alerta-error">
            ⚠️ Los pagos no coinciden con el total de la cuenta. Ajusta los montos antes de guardar.
          </div>
        )}

        <div className="campo-grupo" style={{ marginBottom: 0 }}>
          <label className="campo-label">Motivo de la corrección</label>
          <textarea
            className="campo-input"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: se cobró la mesa equivocada por error"
            rows={2}
          />
        </div>

        <div className="campo-grupo" style={{ marginBottom: 0, maxWidth: "220px" }}>
          <label className="campo-label">PIN de seguridad</label>
          <input
            className="campo-input"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
          />
        </div>

        {/* FIX: mismo problema — antes texto-error, ahora alerta-error */}
        {error && <div className="alerta-error">{error}</div>}

        <button className="btn-primario btn-ancho" onClick={handleGuardar} disabled={guardando || !pagosCuadran}>
          {guardando ? "Guardando..." : "Guardar corrección"}
        </button>
      </div>
    </Modal>
  );
};

export default VentaDetalleModal;