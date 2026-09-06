// frontend/src/components/admin/VentaDetalleModal.jsx
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

  // NUEVO: total esperado según la cuenta real (productos - descuento + servicio + propina).
  // Debe coincidir con totalPagos o el backend rechazará el guardado — esto solo
  // le avisa al usuario ANTES de intentar guardar, para que no se lleve la sorpresa
  // en el error del servidor.
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
    // `ancho` es la nueva prop opcional de Modal — le da más espacio
    // horizontal a este formulario en particular sin tocar el resto
    // de los modales de tu app (que no la pasan y quedan igual que hoy).
    <Modal
      abierto={true}
      titulo={`Editar venta — Mesa ${venta.mesa_nombre || "—"}`}
      onCancelar={onClose}
      labelCancelar="Cancelar"
      ancho="560px"
    >
      {/* Todo lo de abajo usa tus clases reales (campo-grupo, campo-label,
          campo-input, btn-primario, btn-secundario, btn-ghost) para que
          herede automáticamente tu tema claro/oscuro — nada de colores
          fijos acá. */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

        {venta.ediciones?.length > 0 && (
          <div className="campo-grupo">
            <p className="texto-secundario" style={{ marginBottom: "0.3rem" }}>
              ⚠️ Esta venta ya fue corregida antes:
            </p>
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {venta.ediciones.map((e, i) => (
                <li key={i} className="texto-muted" style={{ fontSize: "0.8rem" }}>
                  {new Date(e.editado_en).toLocaleString("es-CO")} — {e.editado_por}: "{e.motivo}"
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="campo-grupo">
          <label className="campo-label">Productos</label>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  className="campo-input"
                  style={{ flex: 1, minWidth: 0 }}
                  value={it.nombre}
                  onChange={(e) => actualizarItem(i, "nombre", e.target.value)}
                  placeholder="Producto"
                />
                <input
                  className="campo-input"
                  style={{ width: 64, flex: "none", textAlign: "center" }}
                  type="number" min="0"
                  value={it.cantidad}
                  onChange={(e) => actualizarItem(i, "cantidad", e.target.value)}
                />
                <input
                  className="campo-input"
                  style={{ width: 120, flex: "none" }}
                  type="number" min="0"
                  value={it.precio}
                  onChange={(e) => actualizarItem(i, "precio", e.target.value)}
                />
                <button className="btn-ghost" onClick={() => eliminarItem(i)}>✕</button>
              </div>
            ))}
          </div>

          <button className="btn-secundario" onClick={agregarItem} style={{ marginTop: "0.6rem" }}>
            + Agregar producto
          </button>
        </div>

        <div className="campo-grupo">
          <label className="campo-label">Métodos de pago</label>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {pagos.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <select
                  className="campo-input"
                  style={{ flex: 1, minWidth: 0 }}
                  value={p.metodo_pago}
                  onChange={(e) => actualizarPago(i, "metodo_pago", e.target.value)}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
                <input
                  className="campo-input"
                  style={{ width: 140, flex: "none" }}
                  type="number" min="0"
                  value={p.monto}
                  onChange={(e) => actualizarPago(i, "monto", e.target.value)}
                />
                <button className="btn-ghost" onClick={() => eliminarPago(i)}>✕</button>
              </div>
            ))}
          </div>

          <button className="btn-secundario" onClick={agregarPago} style={{ marginTop: "0.6rem" }}>
            + Agregar método
          </button>

          <p className="texto-secundario" style={{ marginTop: "0.6rem" }}>
            Total con estos pagos: <strong>{COP(totalPagos)}</strong>
          </p>
          <p className={pagosCuadran ? "texto-secundario" : "texto-error"} style={{ marginTop: "0.2rem" }}>
            Total de la cuenta (productos − descuento + servicio + propina): <strong>{COP(totalEsperado)}</strong>
            {!pagosCuadran && " — no coincide con los pagos. Ajusta los montos antes de guardar."}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
          <div className="campo-grupo">
            <label className="campo-label">Descuento</label>
            <input className="campo-input" type="number" value={descuento} onChange={e => setDescuento(e.target.value)} />
          </div>
          <div className="campo-grupo">
            <label className="campo-label">Servicio</label>
            <input className="campo-input" type="number" value={servicio} onChange={e => setServicio(e.target.value)} />
          </div>
          <div className="campo-grupo">
            <label className="campo-label">Propina</label>
            <input className="campo-input" type="number" value={propina} onChange={e => setPropina(e.target.value)} />
          </div>
        </div>

        <div className="campo-grupo">
          <label className="campo-label">Motivo de la corrección</label>
          <textarea
            className="campo-input"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: se cobró la mesa equivocada por error"
            rows={2}
          />
        </div>

        <div className="campo-grupo">
          <label className="campo-label">PIN de seguridad</label>
          <input
            className="campo-input"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
          />
        </div>

        {error && <p className="texto-error">{error}</p>}

        <button className="btn-primario btn-ancho" onClick={handleGuardar} disabled={guardando || !pagosCuadran}>
          {guardando ? "Guardando..." : "Guardar corrección"}
        </button>
      </div>
    </Modal>
  );
};

export default VentaDetalleModal;