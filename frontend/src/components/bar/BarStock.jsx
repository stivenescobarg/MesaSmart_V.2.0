import { useCallback, useEffect, useMemo, useState } from "react";
import { barService } from "../../services/barService";

const nivel = producto => {
  const porcentaje = producto.cantidad_actual / Math.max(producto.cantidad_minima, 1);
  if (porcentaje <= 0) return { nombre: "Agotado", clase: "critical" };
  if (porcentaje <= 1) return { nombre: "Bajo", clase: "critical" };
  if (porcentaje <= 1.5) return { nombre: "Atención", clase: "warning" };
  return { nombre: "Disponible", clase: "ok" };
};

const BarStock = ({ onActualizarResumen }) => {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [nota, setNota] = useState("");
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

  const registrar = async event => {
    event.preventDefault();
    if (!seleccionado || Number(cantidad) <= 0) return;
    setGuardando(true);
    try {
      await barService.registrarConsumo({ producto_id: seleccionado.id, cantidad: Number(cantidad), observacion: nota });
      setMensaje(`Consumo de ${seleccionado.nombre} registrado.`);
      setSeleccionado(null); setCantidad(""); setNota("");
      await cargar();
      onActualizarResumen?.();
    } catch (error) { setMensaje(error.message || "No fue posible registrar el consumo."); }
    finally { setGuardando(false); }
  };

  return <section className="bar-stock">
    <div className="bar-section-head"><div><h2>Inventario del bar</h2><p>Control en tiempo real y registro de consumos.</p></div>
      <button className="bar-outline-button" onClick={cargar}>↻ Actualizar</button></div>
    {mensaje && <div className="bar-inline-message">{mensaje}<button onClick={() => setMensaje("")}>✕</button></div>}
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
    {seleccionado && <div className="bar-modal-backdrop" onClick={() => setSeleccionado(null)}><form className="bar-consume-modal" onSubmit={registrar} onClick={event => event.stopPropagation()}>
      <button type="button" className="bar-close" onClick={() => setSeleccionado(null)}>✕</button><p className="bar-kicker">Salida de inventario</p><h3>{seleccionado.nombre}</h3>
      <label>Cantidad ({seleccionado.unidad})<input autoFocus required min="0.01" step="0.01" type="number" value={cantidad} onChange={event => setCantidad(event.target.value)} /></label>
      <label>Nota <input value={nota} onChange={event => setNota(event.target.value)} placeholder="Ej.: consumo durante el turno" /></label>
      <button className="bar-primary-button" disabled={guardando}>{guardando ? "Guardando..." : "Confirmar consumo"}</button>
    </form></div>}
  </section>;
};

export default BarStock;
