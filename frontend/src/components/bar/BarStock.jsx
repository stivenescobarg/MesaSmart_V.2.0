// frontend/src/components/bar/BarStock.jsx
// ── Componente de Inventario de Bar ─────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useState } from "react";
import { barService } from "../../services/barService";

const nivel = producto => {
  const porcentaje = producto.cantidad_actual / Math.max(producto.cantidad_minima, 1);
  if (porcentaje <= 0) return { nombre: "Agotado", clase: "critical" };
  if (porcentaje <= 1) return { nombre: "Bajo", clase: "critical" };
  if (porcentaje <= 1.5) return { nombre: "Atención", clase: "warning" };
  return { nombre: "Disponible", clase: "ok" };
};

// ── Resumen de Inventario (donut + conteo por estado) ─────────────
const COLORES = {
  ok: "var(--bar-success)",
  atencion: "var(--bar-warning)",
  critico: "var(--bar-danger)",
  agotado: "var(--bar-text-3)",
};

const ResumenInventario = ({ productos }) => {
  const conteo = useMemo(() => {
    const base = { ok: 0, atencion: 0, critico: 0, agotado: 0 };
    productos.forEach(p => {
      const { nombre } = nivel(p);
      if (nombre === "Disponible") base.ok++;
      else if (nombre === "Atención") base.atencion++;
      else if (nombre === "Bajo") base.critico++;
      else base.agotado++;
    });
    return base;
  }, [productos]);

  const total = productos.length || 1;
  const pct = clave => (conteo[clave] / total) * 100;
  const acumulado = { ok: 0, atencion: pct("ok"), critico: pct("ok") + pct("atencion"), agotado: pct("ok") + pct("atencion") + pct("critico") };

  const gradiente = `conic-gradient(
    ${COLORES.ok} 0% ${acumulado.atencion}%,
    ${COLORES.atencion} ${acumulado.atencion}% ${acumulado.critico}%,
    ${COLORES.critico} ${acumulado.critico}% ${acumulado.agotado}%,
    ${COLORES.agotado} ${acumulado.agotado}% 100%
  )`;

  return (
    <div className="bar-inventory-summary" style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "18px" }}>
      <div style={{ position: "relative", width: "96px", height: "96px", flexShrink: 0 }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: gradiente }} />
        <div style={{
          position: "absolute", inset: "14px", borderRadius: "50%",
          background: "var(--bar-card)", display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column",
        }}>
          <strong style={{ fontSize: "20px", color: "var(--bar-text)" }}>{productos.length}</strong>
          <span style={{ fontSize: "10px", color: "var(--bar-muted)" }}>productos</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: "13px", color: "var(--bar-text)" }}>
        <span><i style={{ background: COLORES.ok, width: 8, height: 8, borderRadius: "50%", display: "inline-block", marginRight: 6 }} />OK ({conteo.ok})</span>
        <span><i style={{ background: COLORES.atencion, width: 8, height: 8, borderRadius: "50%", display: "inline-block", marginRight: 6 }} />Bajo ({conteo.atencion})</span>
        <span><i style={{ background: COLORES.critico, width: 8, height: 8, borderRadius: "50%", display: "inline-block", marginRight: 6 }} />Crítico ({conteo.critico})</span>
        <span><i style={{ background: COLORES.agotado, width: 8, height: 8, borderRadius: "50%", display: "inline-block", marginRight: 6 }} />Sin stock ({conteo.agotado})</span>
      </div>
    </div>
  );
};

const BarStock = ({ onActualizarResumen }) => {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [nota, setNota] = useState("");
  const [pin, setPin] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cargar = useCallback(async () => {
    try {
      const data = await barService.getInventario();
      setProductos(data.productos || []);
    } catch (error) { setMensaje(error.message || "No fue posible cargar el inventario."); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  const filtrados = useMemo(() => productos.filter(producto => !busqueda ||
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    producto.proveedor.toLowerCase().includes(busqueda.toLowerCase())
  ), [productos, busqueda]);

  const cerrarModal = () => {
    setSeleccionado(null);
    setCantidad("");
    setNota("");
    setPin("");
  };

  const registrar = async event => {
    event.preventDefault();
    if (!seleccionado || Number(cantidad) <= 0) return;
    if (!/^\d{4,8}$/.test(pin)) {
      setMensaje("El PIN debe tener entre 4 y 8 dígitos.");
      return;
    }
    setGuardando(true);
    try {
      await barService.registrarConsumo({
        producto_id: seleccionado.id,
        cantidad: Number(cantidad),
        observacion: nota,
        pin,
      });
      setMensaje(`Consumo de ${seleccionado.nombre} registrado.`);
      cerrarModal();
      await cargar();
      onActualizarResumen?.();
    } catch (error) { setMensaje(error.message || "No fue posible registrar el consumo."); }
    finally { setGuardando(false); }
  };

  return <section className="bar-stock">
    <div className="bar-section-head"><div><h2>Inventario del bar</h2><p>Control en tiempo real y registro de consumos.</p></div>
      <button className="bar-outline-button" onClick={cargar}>↻ Actualizar</button></div>
    {mensaje && <div className="bar-inline-message">{mensaje}<button onClick={() => setMensaje("")}>✕</button></div>}
    {!cargando && productos.length > 0 && <ResumenInventario productos={productos} />}
    <input className="bar-search" value={busqueda} onChange={event => setBusqueda(event.target.value)} placeholder="Buscar producto o proveedor..." />
    {cargando ? <div className="bar-empty">Cargando inventario...</div> : filtrados.length === 0 ? <div className="bar-empty">No hay productos de bar.</div> :
      <div className="bar-stock-list">{filtrados.map(producto => {
        const estado = nivel(producto);
        const porcentaje = Math.min(100, (producto.cantidad_actual / Math.max(producto.cantidad_minima * 2, 1)) * 100);
        return <article className="bar-stock-item" key={producto.id}><div className="bar-stock-info"><div className="bar-stock-title"><strong>{producto.nombre}</strong><span className={`bar-stock-badge ${estado.clase}`}>{estado.nombre}</span></div>
          <small>{producto.proveedor}</small><div className="bar-progress"><i className={estado.clase} style={{ width: `${porcentaje}%` }} /></div>
          <b>{producto.cantidad_actual} {producto.unidad} <em>· mínimo {producto.cantidad_minima}</em></b></div>
          <button className="bar-consume-button" onClick={() => setSeleccionado(producto)}>Registrar consumo</button></article>;
      })}</div>}
    {seleccionado && <div className="bar-modal-backdrop" onClick={cerrarModal}><form className="bar-consume-modal" onSubmit={registrar} onClick={event => event.stopPropagation()}>
      <button type="button" className="bar-close" onClick={cerrarModal}>✕</button><p className="bar-kicker">Salida de inventario</p><h3>{seleccionado.nombre}</h3>
      <label>Cantidad ({seleccionado.unidad})<input autoFocus required min="0.01" step="0.01" type="number" value={cantidad} onChange={event => setCantidad(event.target.value)} /></label>
      <label>Nota <input value={nota} onChange={event => setNota(event.target.value)} placeholder="Ej.: consumo durante el turno" /></label>
      <label>PIN de seguridad <input required minLength={4} maxLength={8} inputMode="numeric" pattern="\d{4,8}" type="password" value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, ""))} placeholder="••••" /></label>
      <button className="bar-primary-button" disabled={guardando}>{guardando ? "Guardando..." : "Confirmar consumo"}</button>
    </form></div>}
  </section>;
};

export default BarStock;